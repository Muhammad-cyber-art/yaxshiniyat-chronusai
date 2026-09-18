import json
import logging
from typing import Dict, Any, Tuple
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from curriculum.services import CurriculumService

logger = logging.getLogger(__name__)

AI_RESPONSE_SCHEMA = {
    "type": "object",
    "required": ["feedback", "step_score", "next_scenario", "is_final", "error_flags", "strengths"],
    "properties": {
        "feedback": {"type": "string", "description": "Detailed feedback on student response."},
        "step_score": {"type": "number", "minimum": 0, "maximum": 100, "description": "Score for this step."},
        "next_scenario": {"type": "string", "description": "Next scenario prompt or empty if final."},
        "is_final": {"type": "boolean", "description": "True if simulation finishes."},
        "error_flags": {"type": "array", "items": {"type": "string"}, "description": "Categories of errors."},
        "strengths": {"type": "array", "items": {"type": "string"}, "description": "Demonstrated strengths."},
        "knowledge_gap": {"type": "string", "description": "Area where student needs improvement."}
    }
}

SYSTEM_PROMPT_TEMPLATE = """You are an expert AI evaluator for the ChronosAI Education & Simulation platform.
You are evaluating a {domain} simulation for the role: {role_context}

## Your Constraints (CRITICAL):
1. You MUST ONLY reference information from the provided KNOWLEDGE BASE CONTEXT below.
2. Do NOT introduce any facts, laws, formulas, or concepts that are NOT in the knowledge base.
3. If the student's answer cannot be evaluated from the knowledge base, say so explicitly.
4. You must return ONLY a valid JSON object matching the schema below. No other text.

## Knowledge Base Context:
{rag_context}

## Simulation Case:
{case_description}

## Grading Rubric:
{rubric}

## Response Schema (return EXACTLY this JSON):
{schema}

## Conversation so far:
{conversation_history}

## Student's latest response:
{student_input}

Evaluate strictly and return the JSON response now."""


class AIResponseParseError(Exception):
    pass


class SimulationEngineService:
    @staticmethod
    @transaction.atomic
    def start_session(student, case_id: str) -> "SimulationSession":
        from .models import SimulationCase, SimulationSession

        try:
            case = SimulationCase.objects.select_related("course__domain", "lesson").get(id=case_id, is_published=True)
        except SimulationCase.DoesNotExist:
            raise ValueError(f"SimulationCase '{case_id}' not found or not published.")

        # Resume active session if exists
        existing = SimulationSession.objects.filter(student=student, case=case, status=SimulationSession.Status.ACTIVE).first()
        if existing:
            return existing

        session = SimulationSession.objects.create(
            student=student,
            case=case,
            status=SimulationSession.Status.ACTIVE,
            started_at=timezone.now(),
            current_step=0,
        )
        return session

    @staticmethod
    @transaction.atomic
    def process_turn(session_id: str, student, student_input: str) -> Dict[str, Any]:
        from .models import SimulationSession, SimulationStepLog

        session = SimulationSession.objects.select_for_update(of=("self",)).select_related(
            "case__course__domain", "case__lesson"
        ).get(id=session_id, student=student)

        if session.status != SimulationSession.Status.ACTIVE:
            raise PermissionError(f"Session is {session.status}. Cannot process turn.")

        next_step_number = session.steps_taken + 1
        is_final_by_steps = next_step_number >= session.case.max_steps

        # RAG retrieval
        lesson_ids = [session.case.lesson_id] if session.case.lesson_id else []
        rag_results = CurriculumService.retrieve_relevant_chunks(query=student_input, lesson_ids=lesson_ids)
        rag_context = "\n---\n".join([t for t, _ in rag_results]) or "No specific knowledge base context found for this step."

        # History
        logs = session.step_logs.order_by("step_number")
        history_text = ""
        for log in logs:
            history_text += f"Step {log.step_number} Student: {log.student_input}\nStep {log.step_number} AI: {log.feedback_text}\n"

        ai_response, prompt_tokens, completion_tokens = SimulationEngineService._call_ai(
            session=session,
            student_input=student_input,
            rag_context=rag_context,
            conversation_history=history_text,
            force_final=is_final_by_steps
        )

        step_score = float(ai_response.get("step_score", 0.0))
        step_score = max(0.0, min(100.0, step_score))
        is_final = bool(ai_response.get("is_final", False)) or is_final_by_steps
        feedback_text = ai_response.get("feedback", "")
        next_scenario = ai_response.get("next_scenario", "") if not is_final else ""
        error_flags = ai_response.get("error_flags", [])
        strengths = ai_response.get("strengths", [])

        # Running average score
        old_total = session.total_score * session.steps_taken
        new_total = old_total + step_score
        session.steps_taken = next_step_number
        session.total_score = new_total / session.steps_taken
        session.current_step = next_step_number

        error_analysis = session.error_analysis or {}
        for flag in error_flags:
            error_analysis[flag] = error_analysis.get(flag, 0) + 1
        session.error_analysis = error_analysis

        SimulationStepLog.objects.create(
            session=session,
            step_number=next_step_number,
            student_input=student_input,
            ai_response_raw=ai_response,
            step_score=step_score,
            feedback_text=feedback_text,
            next_scenario_text=next_scenario,
            is_final_step=is_final,
            rag_context_chunks=[t for t, _ in rag_results],
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

        if is_final:
            session.status = SimulationSession.Status.COMPLETED if session.total_score >= session.case.passing_score else SimulationSession.Status.FAILED
            session.completed_at = timezone.now()
            session.save()
        else:
            session.save(update_fields=["steps_taken", "total_score", "current_step", "error_analysis", "last_activity_at"])

        return {
            "session_id": str(session.id),
            "step_number": next_step_number,
            "step_score": step_score,
            "running_total_score": round(session.total_score, 2),
            "feedback": feedback_text,
            "next_scenario": next_scenario,
            "is_final": is_final,
            "error_flags": error_flags,
            "strengths": strengths,
            "session_status": session.status,
            "coins_earned": session.case.coin_reward if is_final and session.status == SimulationSession.Status.COMPLETED else 0,
        }

    @staticmethod
    def _call_ai(session, student_input: str, rag_context: str, conversation_history: str, force_final: bool = False) -> Tuple[Dict[str, Any], int, int]:
        rubric_str = json.dumps(session.case.grading_rubric, indent=2) if session.case.grading_rubric else "{}"
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            domain=session.case.course.domain.name,
            role_context=session.case.role_context,
            rag_context=rag_context,
            case_description=session.case.description,
            rubric=rubric_str,
            schema=json.dumps(AI_RESPONSE_SCHEMA, indent=2),
            conversation_history=conversation_history or "None yet.",
            student_input=student_input,
        )

        if force_final:
            system_prompt += "\n\nIMPORTANT: This is the FINAL step. Set is_final=true in your response."

        api_key = getattr(settings, "OPENAI_API_KEY", "")
        if not api_key:
            return {
                "feedback": f"Demo javob: '{student_input[:50]}...' qabul qilindi.",
                "step_score": 75.0,
                "next_scenario": "" if force_final else "Keyingi qadam tahlilini kiriting.",
                "is_final": force_final,
                "error_flags": [],
                "strengths": ["Mavzuni tushunish"],
                "knowledge_gap": ""
            }, 0, 0

        try:
            import openai
            client_kwargs = {"api_key": api_key}
            base_url = getattr(settings, "AI_BASE_URL", None)
            if base_url:
                client_kwargs["base_url"] = base_url
            client = openai.OpenAI(**client_kwargs)

            resp = client.chat.completions.create(
                model=getattr(settings, "AI_CHAT_MODEL", "gemini-2.5-flash"),
                temperature=float(getattr(settings, "AI_TEMPERATURE", 0.2)),
                max_tokens=int(getattr(settings, "AI_MAX_TOKENS", 2048)),
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": student_input}
                ]
            )

            raw = resp.choices[0].message.content or "{}"
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1]
                if cleaned.endswith("```"):
                    cleaned = cleaned.rsplit("```", 1)[0]
                cleaned = cleaned.strip()

            parsed = json.loads(cleaned)
            prompt_tokens = resp.usage.prompt_tokens if resp.usage else 0
            completion_tokens = resp.usage.completion_tokens if resp.usage else 0
            return parsed, prompt_tokens, completion_tokens
        except Exception as exc:
            logger.exception("Simulation AI call failed: %s", exc)
            raise

    @staticmethod
    @transaction.atomic
    def abandon_session(session_id: str, student) -> None:
        from .models import SimulationSession
        session = SimulationSession.objects.select_for_update().get(id=session_id, student=student, status=SimulationSession.Status.ACTIVE)
        session.status = SimulationSession.Status.ABANDONED
        session.completed_at = timezone.now()
        session.save(update_fields=["status", "completed_at"])
