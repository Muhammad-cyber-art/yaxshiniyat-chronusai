import json
import logging
import uuid
import re
from typing import Dict, Any, List, Optional, Tuple
from django.conf import settings
from django.utils.text import slugify
from django.db import transaction
import openai

logger = logging.getLogger(__name__)


def get_openai_client() -> openai.OpenAI:
    api_key = getattr(settings, "OPENAI_API_KEY", "")
    base_url = getattr(settings, "AI_BASE_URL", None)
    kwargs = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    return openai.OpenAI(**kwargs)


def clean_json_response(raw_text: str) -> Dict[str, Any]:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n", "", cleaned)
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
    return json.loads(cleaned)


class AISimulatorService:
    """
    Core AI engine for ChronosAI:
    1. Generates immersive storylines, custom roles, and scientific reaction matrices from lesson material.
    2. Controls dynamic room scaling when participant capacity is exceeded.
    3. AI Bot role-filler for unoccupied roles in simulation rooms.
    4. Automated chemical/scientific/legal reaction and feedback engine.
    """

    @classmethod
    def generate_case_and_room(
        cls,
        course,
        lesson=None,
        teacher=None,
        room_style: str = "CUSTOM",
        expected_duration_minutes: int = 15,
        max_participants: int = 4,
        passing_score: int = 70,
        lesson_material_text: str = "",
        custom_instructions: str = ""
    ):
        from .models import SimulationCase, SimulationRoom, RoomChatMessage, RoomParticipant

        client = get_openai_client()
        model = getattr(settings, "AI_CHAT_MODEL", "gpt-4o-mini")

        material_excerpt = (lesson_material_text or "")[:6000]
        if not material_excerpt and lesson:
            material_excerpt = (lesson.content_text or lesson.description or lesson.title or "")[:6000]

        domain_name = course.domain.name if course and course.domain else "Umumiy ta'lim"
        course_title = course.title if course else "Kurs"
        lesson_title = lesson.title if lesson else "Mavzu"

        system_prompt = f"""Siz ta'lim va professional simulyatsiyalar bo'yicha yetakchi AI Arxitektorsiz.
Vazifangiz: O'qituvchi bergan darslik/material asosida o'quvchilar chuqur his qilishi uchun realistik, qiziqarli va professional SIMULYATSIYA XONASI (Simulator Room) yaratish.

Foydalanuvchi tanlagan uslub: {room_style}
Kurs: {course_title} ({domain_name})
Dars mavzusi: {lesson_title}
Xona sig'imi (ishtirokchilar soni): {max_participants} ta rol
Davomiyligi: {expected_duration_minutes} daqiqa
O'tish bali: {passing_score}

QAT'IY QOIDALAR:
1. Hikoya (storyline) dars materialiga to'g'ridan-to'g'ri bog'liq bo'lishi, dramatik, jonli va professional muhit yaratishi kerak.
2. Rollar soni aniq {max_participants} ta bo'lsin. Har bir rolda o'zining ismi, maqsadi va qatnashuvchi harakatlari bo'lsin.
   - Agar uslub "CHEMISTRY_LAB" bo'lsa: rollar (masalan: Bosh Kimyogar, Reagentlar Nazoratchisi, Xavfsizlik Muhandisi, Laborant-Tahlilchi).
   - Agar uslub "COURTROOM" bo'lsa: rollar (masalan: Raislik etuvchi Sudya, Davlat Qoralovchisi/Prokuror, Himoyachi Advokat, Ekspert-Kriminalist).
   - Boshqa fanlar (Tibbiyot, Kiberxavfsizlik, Tarix, Iqtisodiyot) uchun ham xuddi shunday mos rollar.
3. KOD VA REAKSIYALARNI AVTOMATLASHTIRISH (Automated Science / Domain Logic):
   - "reaction_rules" bo'limida: agar kimyo fani bo'lsa, mavzuga oid reagentlar aralashuvi, qanday reaksiya paydo bo'lishi (formula, rang o'zgarishi, gaz chiqishi, harorat, xavf ko'rsatkichi, ball) yozilsin.
   - Agar yuridik/sud bo'lsa, qonun moddalari, dalillar va e'tirozlar qoidalari yozilsin.
4. Javobni FAQAT toza JSON formatida quyidagi strukturada qaytaring:

{{
  "title": "Qiziqarli simulyatsiya sarlavhasi (O'zbek tilida)",
  "description": "Kirish hikoyasi (dramatik voqea, muammo yoki tajriba vazifasi). O'quvchini atmosferaga olib kiruvchi batafsil matn.",
  "role_context": "Simulyatsiya xonasining umumiy maqsadi va qoidalari",
  "hint_text": "Ishtirokchilarga boshlang'ich maslahat yoki yo'riqnoma",
  "initial_narrative": "Simulyator ochilganda ekranda paydo bo'ladigan birinchi voqea va xabar (masalan: 'Laboratoriya eshigi ochildi, stolda noma'lum kislota namunasi turibdi...')",
  "roles_schema": [
    {{
      "role_id": "role_1",
      "title": "Rol nomi (masalan: Bosh Kimyogar)",
      "goal": "Bu roldagi ishtirokchining asosiy vazifasi",
      "available_actions_or_items": ["Reagent A (HCl 0.1M)", "Lakmus qog'ozi", "Pipetka"]
    }}
  ],
  "reaction_rules": {{
    "domain_type": "chemistry|law|medical|cyber|custom",
    "known_combinations": [
      {{
        "trigger": ["HCl", "NaOH"],
        "chemical_equation": "HCl + NaOH -> NaCl + H2O",
        "visual_effect": "Neytrallanish sodir bo'ldi, eritma qizidi va rangsizlandi",
        "hazard_level": "LOW",
        "score_delta": 20,
        "explanation": "Kislota va ishqor neytrallanib osh tuzi va suv hosil qildi."
      }}
    ],
    "safety_warnings": ["Himoya ko'zoynagini taqing", "Reagentlarni to'g'ridan-to'g'ri hidlamang"],
    "scoring_criteria": "To'g'ri ketma-ketlikda amallarni bajarish va xulosalarni asoslash"
  }},
  "grading_rubric": {{
    "criteria": [
      {{"name": "Xavfsizlik va qoidalar", "weight": 30}},
      {{"name": "Mantiqiy tahlil va faollik", "weight": 40}},
      {{"name": "Xulosaning to'g'riligi", "weight": 30}}
    ]
  }}
}}"""

        user_content = f"""Darslik ma'lumoti:
{material_excerpt or 'Darslik matni berilmagan, mavzu bo\'yicha eng ilg\'or amaliy keys yarating.'}

O'qituvchining qo'shimcha ko'rsatmasi:
{custom_instructions or 'Barcha talabalar faol ishtirok etishi uchun interaktiv qilib bering.'}"""

        try:
            resp = client.chat.completions.create(
                model=model,
                temperature=0.4,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ]
            )
            raw = resp.choices[0].message.content or "{}"
            ai_data = clean_json_response(raw)
        except Exception as exc:
            logger.exception("Failed to generate simulation via OpenAI: %s", exc)
            ai_data = cls._generate_fallback_case_data(
                room_style, course_title, lesson_title, max_participants
            )

        with transaction.atomic():
            base_slug = slugify(ai_data.get("title", f"sim-{uuid.uuid4().hex[:6]}"))
            slug = base_slug or f"sim-{uuid.uuid4().hex[:6]}"
            idx = 1
            while SimulationCase.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{idx}"
                idx += 1

            reaction_rules = ai_data.get("reaction_rules", {})
            if not reaction_rules.get("interactive_items"):
                reaction_rules["interactive_items"] = cls._get_default_interactive_items(room_style)

            case = SimulationCase.objects.create(
                course=course,
                lesson=lesson,
                created_by=teacher,
                title=ai_data.get("title", f"{lesson_title} - Simulyatori"),
                slug=slug,
                description=ai_data.get("description", "Interaktiv simulyatsiya mashg'uloti."),
                role_context=ai_data.get("role_context", "Simulyatsiya muhiti."),
                room_style=room_style,
                max_participants=max_participants,
                roles_schema=ai_data.get("roles_schema", []),
                reaction_rules=reaction_rules,
                difficulty="MEDIUM",
                coin_reward=30,
                max_steps=10,
                passing_score=passing_score,
                hint_text=ai_data.get("hint_text", ""),
                expected_duration_minutes=expected_duration_minutes,
                grading_rubric=ai_data.get("grading_rubric", {}),
                is_published=True
            )

            room = SimulationRoom.objects.create(
                case=case,
                room_number=1,
                status=SimulationRoom.Status.WAITING,
                max_participants=max_participants,
                current_step=0
            )

            initial_msg = ai_data.get("initial_narrative", "Simulyator xonasi muvaffaqiyatli ishga tushirildi. O'z rolingizni tanlang va amaliyotni boshlang.")
            RoomChatMessage.objects.create(
                room=room,
                sender_role="SYSTEM_DIRECTOR",
                sender_name="AI Tizim Boshqaruvchisi",
                is_ai=True,
                message=initial_msg,
                scientific_feedback={"type": "ROOM_INITIALIZED", "style": room_style},
                step_number=0
            )

        return case, room

    @classmethod
    def join_or_scale_room(cls, case_id: str, user, preferred_role_id: Optional[str] = None):
        """
        Multi-Room Dynamic Scaling:
        If Room #1 is full (or fills up), it scales dynamically creating Room #2, #3, etc.
        Assigns the user to a free role in the available room.
        """
        from .models import SimulationCase, SimulationRoom, RoomParticipant, RoomChatMessage

        case = SimulationCase.objects.get(id=case_id)

        with transaction.atomic():
            # Check if user is already participating in an active or waiting room for this case
            existing_p = RoomParticipant.objects.filter(
                room__case=case,
                user=user,
                room__status__in=[SimulationRoom.Status.WAITING, SimulationRoom.Status.ACTIVE]
            ).first()

            if existing_p:
                return existing_p.room, existing_p, False

            # Find a room with available slots
            rooms = SimulationRoom.objects.filter(
                case=case,
                status__in=[SimulationRoom.Status.WAITING, SimulationRoom.Status.ACTIVE]
            ).order_by("room_number")

            target_room = None
            for r in rooms:
                human_count = r.participants.filter(is_active=True, is_ai=False).count()
                if human_count < r.max_participants:
                    target_room = r
                    break

            scaled_new_room = False
            # If all rooms are full, scale dynamically!
            if not target_room:
                last_room = SimulationRoom.objects.filter(case=case).order_by("-room_number").first()
                next_number = (last_room.room_number + 1) if last_room else 1
                target_room = SimulationRoom.objects.create(
                    case=case,
                    room_number=next_number,
                    status=SimulationRoom.Status.WAITING,
                    max_participants=case.max_participants,
                    current_step=0
                )
                scaled_new_room = True

                RoomChatMessage.objects.create(
                    room=target_room,
                    sender_role="SYSTEM_DIRECTOR",
                    sender_name="AI Tizim Boshqaruvchisi",
                    is_ai=True,
                    message=f"Avvalgi xonalar to'lganligi sababli yangi Simulyator Xonasi #{next_number} avtomatik ochildi! Yangi ishtirokchilar taklif etiladi.",
                    scientific_feedback={"scaled": True, "room_number": next_number},
                    step_number=0
                )

            # Assign role
            roles_schema = case.roles_schema or []
            taken_roles = set(target_room.participants.filter(is_active=True).values_list("role_id", flat=True))

            selected_role = None
            if preferred_role_id:
                for r_info in roles_schema:
                    if r_info.get("role_id") == preferred_role_id and preferred_role_id not in taken_roles:
                        selected_role = r_info
                        break

            if not selected_role:
                for r_info in roles_schema:
                    if r_info.get("role_id") not in taken_roles:
                        selected_role = r_info
                        break

            if not selected_role:
                role_idx = target_room.participants.count() + 1
                selected_role = {
                    "role_id": f"role_{role_idx}",
                    "title": f"Ishtirokchi #{role_idx}",
                    "goal": "Vazifani bajarish va hamkorlik qilish"
                }

            participant = RoomParticipant.objects.create(
                room=target_room,
                user=user,
                role_id=selected_role["role_id"],
                role_title=selected_role["title"],
                role_goal=selected_role.get("goal", ""),
                is_ai=False,
                is_active=True
            )

            RoomChatMessage.objects.create(
                room=target_room,
                sender_role="SYSTEM_DIRECTOR",
                sender_name="AI Tizim",
                is_ai=True,
                message=f"Xonaga yangi ishtirokchi qo'shildi: {user.get_full_name() or user.username} ({selected_role['title']}).",
                step_number=target_room.current_step
            )

            return target_room, participant, scaled_new_room

    @classmethod
    def populate_ai_roles_if_needed(cls, room):
        """
        AI Role-Filler: If there are unassigned roles in the room when starting,
        AI assumes those roles as active NPCs so the simulation can progress smoothly.
        """
        from .models import RoomParticipant, RoomChatMessage

        case = room.case
        roles_schema = case.roles_schema or []
        existing_role_ids = set(room.participants.filter(is_active=True).values_list("role_id", flat=True))

        created_ai_bots = []
        for r_info in roles_schema:
            r_id = r_info.get("role_id")
            if r_id and r_id not in existing_role_ids:
                bot_p = RoomParticipant.objects.create(
                    room=room,
                    user=None,
                    role_id=r_id,
                    role_title=r_info.get("title", "AI Hamkor"),
                    role_goal=r_info.get("goal", "Rol vazifasini AI sifatida to'liq bajarish"),
                    is_ai=True,
                    is_active=True
                )
                created_ai_bots.append(bot_p)

                RoomChatMessage.objects.create(
                    room=room,
                    sender_role=r_info.get("title", "AI Hamkor"),
                    sender_name=f"🤖 {r_info.get('title', 'AI Hamkor')} (AI Nazoratida)",
                    is_ai=True,
                    message=f"Salom jamoa! Ushbu simulyatsiyada men '{r_info.get('title')}' vazifasini bajaraman. Tayyorman, boshlaymiz!",
                    step_number=room.current_step
                )

        if created_ai_bots:
            first_bot = created_ai_bots[0]
            action_prompt = (
                "Stol ustidagi reagentlardan qaysi birini kolbaga quyamiz? Reagentlarni tanlab probirkaga soling va 'Reaksiyaga Kirishtirish' tugmasini bosing!"
                if room.case.room_style == "CHEMISTRY_LAB"
                else "Barcha rollar to'liq. O'z rolingizda fikr bildiring yoki harakat qiling!"
            )
            RoomChatMessage.objects.create(
                room=room,
                sender_role=first_bot.role_title,
                sender_name=f"🤖 {first_bot.role_title} (AI)",
                is_ai=True,
                message=f"Barchaga salom! Men {first_bot.role_title}man. {action_prompt}",
                step_number=room.current_step
            )

        if room.status == room.Status.WAITING:
            room.status = room.Status.ACTIVE
            room.save(update_fields=["status", "updated_at"])

        return created_ai_bots

    @classmethod
    def process_room_turn(
        cls,
        room,
        sender_participant,
        message_text: str,
        reaction_action: str = ""
    ) -> Dict[str, Any]:
        """
        Processes a turn in the simulator room:
        1. Evaluates scientific reaction or domain logic (chemistry reaction equation, legal evaluation, hazard, points).
        2. Saves user's message and scientific feedback.
        3. Prompts AI role-filler NPCs to respond appropriately in Uzbek.
        """
        from .models import RoomChatMessage

        case = room.case
        client = get_openai_client()
        model = getattr(settings, "AI_CHAT_MODEL", "gpt-4o-mini")

        room.current_step += 1
        room.save(update_fields=["current_step", "updated_at"])

        # 1. Scientific / Domain Reaction Evaluation
        reaction_result = cls._evaluate_reaction_logic(
            case=case,
            user_message=message_text,
            reaction_action=reaction_action,
            sender_participant=sender_participant
        )

        # Update participant's score
        added_score = reaction_result.get("score_delta", 5)
        sender_participant.individual_score += added_score
        sender_participant.save(update_fields=["individual_score"])

        # Save student's chat message
        user_msg = RoomChatMessage.objects.create(
            room=room,
            sender_user=sender_participant.user,
            sender_role=sender_participant.role_title,
            sender_name=sender_participant.user.get_full_name() or sender_participant.user.username if sender_participant.user else "Talaba",
            is_ai=False,
            message=message_text,
            scientific_feedback=reaction_result,
            step_number=room.current_step
        )

        # 2. Check if AI NPC bots need to respond
        ai_participants = list(room.participants.filter(is_ai=True, is_active=True))
        ai_responses = []

        if ai_participants:
            bot_to_act = ai_participants[room.current_step % len(ai_participants)]

            recent_msgs = list(room.chat_messages.order_by("-created_at")[:6])
            recent_msgs.reverse()
            history_summary = "\n".join([f"[{m.sender_name} - {m.sender_role}]: {m.message}" for m in recent_msgs])

            bot_system_prompt = f"""Siz ushbu interaktiv simulyatsiya xonasida AI ishtirokchisiz.
Uslub: {case.room_style}
Sizning rolingiz: {bot_to_act.role_title}
Sizning maqsadingiz: {bot_to_act.role_goal}
Reaktsiya/holat natijasi: {json.dumps(reaction_result, ensure_ascii=False)}

Vazifangiz: Talabaning oxirgi harakatiga va ilmiy/kasbiy holatga o'z rolingizdan kelib chiqib tabiiy, professional va qat'iy o'zbek tilida munosabat bildiring.
Agar kimyo bo'lsa: reagentlar holati, xavfsizlik va keyingi bosqich bo'yicha ko'rsatma yoki savol bering.
Agar sud zali bo'lsa: qonuniy e'tiroz, dalil talabi yoki sud hay'ati qarorini bildiring.
Javob ixcham (1-3 jumla), jonli va rolingizga 100% mos bo'lsin. Hech qanday texnik izohsiz, to'g'ridan-to'g'ri roldagi gapni yozing."""

            try:
                bot_call = client.chat.completions.create(
                    model=model,
                    temperature=0.7,
                    max_tokens=250,
                    messages=[
                        {"role": "system", "content": bot_system_prompt},
                        {"role": "user", "content": f"Oxirgi xabarlar:\n{history_summary}\n\nO'z rolingizda javob bering:"}
                    ]
                )
                bot_text = (bot_call.choices[0].message.content or "").strip()
            except Exception as exc:
                logger.exception("AI NPC turn generation failed: %s", exc)
                bot_text = f"Tushunarli! '{bot_to_act.role_title}' sifatida harakatni tasdiqlayman, keyingi bosqichga o'tamiz."

            ai_msg = RoomChatMessage.objects.create(
                room=room,
                sender_user=None,
                sender_role=bot_to_act.role_title,
                sender_name=f"🤖 {bot_to_act.role_title} (AI)",
                is_ai=True,
                message=bot_text,
                scientific_feedback={},
                step_number=room.current_step
            )
            ai_responses.append({
                "id": str(ai_msg.id),
                "sender_role": ai_msg.sender_role,
                "sender_name": ai_msg.sender_name,
                "is_ai": True,
                "message": ai_msg.message,
                "created_at": ai_msg.created_at.isoformat()
            })

        return {
            "room_id": str(room.id),
            "step_number": room.current_step,
            "reaction_result": reaction_result,
            "user_score": sender_participant.individual_score,
            "ai_responses": ai_responses
        }

    @classmethod
    def _evaluate_reaction_logic(
        cls,
        case,
        user_message: str,
        reaction_action: str,
        sender_participant
    ) -> Dict[str, Any]:
        """
        Automated reaction & domain logic:
        Understands chemical reactions (equations, products, thermal/color change, safety hazard)
        or legal/medical logic using OpenAI + predefined reaction_rules.
        """
        client = get_openai_client()
        model = getattr(settings, "AI_CHAT_MODEL", "gpt-4o-mini")

        rules = case.reaction_rules or {}
        rules_str = json.dumps(rules, ensure_ascii=False)

        role_title = getattr(sender_participant, 'role_title', 'Talaba-Ishtirokchi')
        prompt = f"""Siz simulyatsiyadagi ilmiy va mantiqiy reaksiyalarni hisoblovchi avtomatlashgan OpenAI GPT-4o ilmiy tahlilchisiz.
Simulyatsiya uslubi: {case.room_style}
Rol: {role_title}
Simulyatsiya qoidalari va reaksiyalar bazasi:
{rules_str}

Ishtirokchining harakati / xabari:
"{user_message}"
Maxsus harakat parametri (aralashtirilgan moddalar): "{reaction_action}"

Vazifa: Ushbu tajriba yoki harakatni ilmiy/amaliy tahlil qiling va quyidagi JSON formatda qaytaring:
{{
  "action_valid": true,
  "chemical_equation": "To'liq kimyoviy reaksiya tenglamasi (masalan: 2Hg + O2 -> 2HgO yoki 2HCl + Zn -> ZnCl2 + H2 ^) yoki aniq formula",
  "visual_effect": "Vizual o'zgarish (masalan: Eritma shiddatli qaynay boshladi, pushti rang paydo bo'ldi, oq bug' yoki qalin tutun ko'tarildi)",
  "hazard_alert": "Agar simob (Hg) kislorod (O2) yoki kislota bilan aralashtirilsa, yoki noto'g'ri/xavfli moddalar bo'lsa qat'iy 'EXPLOSION: <sababi>' deb yozing. Xavfsiz bo'lsa 'NONE' yoki 'LOW'.",
  "score_delta": 15,
  "scientific_explanation": "Hodisaning chuqur, qiziqarli va aniq ilmiy izohi (O'zbek tilida, nima sababdan bunday hodisa ro'y berganini tushuntiring)",
  "ai_model": "OpenAI GPT-4o"
}}"""

        try:
            resp = client.chat.completions.create(
                model=model,
                temperature=0.2,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "Siz OpenAI GPT-4o asosidagi professional ilmiy simulyatsiya analizatorisiz. Har doim to'liq va aniq JSON qaytaring."},
                    {"role": "user", "content": prompt}
                ]
            )
            raw = resp.choices[0].message.content or "{}"
            parsed = clean_json_response(raw)
            if not parsed.get("ai_model"):
                parsed["ai_model"] = "OpenAI GPT-4o"
            return parsed
        except Exception as exc:
            logger.exception("Reaction evaluation error: %s", exc)
            return {
                "action_valid": True,
                "chemical_equation": "Reaksiya qayd etildi",
                "visual_effect": "Moddalar aralashmasi ta'sirlashdi.",
                "hazard_alert": "NONE",
                "score_delta": 5,
                "scientific_explanation": "Amal muvaffaqiyatli bajarildi.",
                "ai_model": "OpenAI GPT-4o (Fallback)"
            }

    @classmethod
    def _generate_fallback_case_data(
        cls, room_style: str, course_title: str, lesson_title: str, max_participants: int
    ) -> Dict[str, Any]:
        if room_style == "CHEMISTRY_LAB":
            return {
                "title": f"Kimyoviy Eksperiment Simulyatori: {lesson_title}",
                "description": "Laboratoriyada kislota va asoslar o'zaro ta'siri hamda gaz ajralish reaksiyalarini o'rganish bo'yicha amaliy mashg'ulot.",
                "role_context": "Laboratoriya tajribasini xavfsiz va aniq bajarish.",
                "hint_text": "Reagentlar konsentratsiyasini nazorat qiling va himoya vositalaridan foydalaning.",
                "initial_narrative": "Laboratoriyaga xush kelibsiz! Stolda xlorid kislota (HCl), natriy gidroksid (NaOH) va sink (Zn) namunalari tayyorlangan.",
                "roles_schema": [
                    {"role_id": "role_1", "title": "Bosh Kimyogar", "goal": "Tajriba rejasini tuzish va nazorat qilish", "available_actions_or_items": ["HCl", "NaOH", "Indikator"]},
                    {"role_id": "role_2", "title": "Laborant-Tahlilchi", "goal": "Reagentlarni aralashtirish va natijalarni o'lchash", "available_actions_or_items": ["Buretkalar", "Probirkalar"]},
                    {"role_id": "role_3", "title": "Xavfsizlik Muhandisi", "goal": "Ekzotermik xavflarni oldini olish", "available_actions_or_items": ["Gazniyob", "Neytrallovchi eritma"]},
                    {"role_id": "role_4", "title": "Hisobchi-Tadqiqotchi", "goal": "Reaksiya tenglamalari va modda miqdorini hisoblash", "available_actions_or_items": ["Molyar kalkulyator"]}
                ][:max_participants],
                "reaction_rules": {
                    "domain_type": "chemistry",
                    "known_combinations": [
                        {
                            "trigger": ["HCl", "NaOH"],
                            "chemical_equation": "HCl + NaOH -> NaCl + H2O",
                            "visual_effect": "Neytrallanish yuz berdi, rang o'zgardi va harorat ko'tarildi.",
                            "hazard_level": "LOW",
                            "score_delta": 20,
                            "explanation": "Kuchsiz ekzotermik neytrallanish reaksiyasi."
                        }
                    ]
                },
                "grading_rubric": {"criteria": [{"name": "Aniqlik", "weight": 50}, {"name": "Xavfsizlik", "weight": 50}]}
            }
        else:
            return {
                "title": f"Interaktiv Simulyatsiya: {lesson_title}",
                "description": f"{course_title} fani bo'yicha amaliy keys va qaror qabul qilish simulyatsiyasi.",
                "role_context": "Vaziyatni birgalikda tahlil qilib to'g'ri yechimga kelish.",
                "hint_text": "Jamoa bilan maslahatlashib, faktlarga tayanib harakat qiling.",
                "initial_narrative": "Simulyator ishga tushirildi. Hamma o'z o'rnini egallasin.",
                "roles_schema": [
                    {"role_id": f"role_{i+1}", "title": f"Mutaxassis #{i+1}", "goal": "O'z yo'nalishi bo'yicha xulosa berish"}
                    for i in range(max_participants)
                ],
                "reaction_rules": {"domain_type": "custom"},
                "grading_rubric": {"criteria": [{"name": "Faollik", "weight": 50}, {"name": "Tahlil", "weight": 50}]}
            }

    @classmethod
    def _get_default_interactive_items(cls, room_style: str) -> List[Dict[str, Any]]:
        if room_style == "CHEMISTRY_LAB":
            return [
                {"id": "HCl", "name": "Xlorid kislota (HCl)", "formula": "HCl", "type": "acid", "color": "#fef08a", "ph": 1},
                {"id": "NaOH", "name": "Natriy ishqori (NaOH)", "formula": "NaOH", "type": "base", "color": "#bae6fd", "ph": 14},
                {"id": "H2SO4", "name": "Sulfat kislota (H2SO4)", "formula": "H2SO4", "type": "acid", "color": "#fde047", "ph": 1},
                {"id": "HNO3", "name": "Nitrat kislota (HNO3)", "formula": "HNO3", "type": "acid", "color": "#fed7aa", "ph": 1},
                {"id": "Zn", "name": "Rux donachalari (Zn)", "formula": "Zn", "type": "metal", "color": "#cbd5e1", "ph": 7},
                {"id": "Cu", "name": "Mis kukuni (Cu)", "formula": "Cu", "type": "metal", "color": "#fdba74", "ph": 7},
                {"id": "CuSO4", "name": "Mis kuporosi (CuSO4)", "formula": "CuSO4", "type": "salt", "color": "#38bdf8", "ph": 5},
                {"id": "Fe", "name": "Temir qirindisi (Fe)", "formula": "Fe", "type": "metal", "color": "#94a3b8", "ph": 7},
                {"id": "KMnO4", "name": "Kaliy permanganat (KMnO4)", "formula": "KMnO4", "type": "oxidizer", "color": "#c084fc", "ph": 7},
                {"id": "H2O2", "name": "Vodorod peroksid (H2O2)", "formula": "H2O2", "type": "peroxide", "color": "#f1f5f9", "ph": 6},
                {"id": "Hg", "name": "Simob metalli (Hg)", "formula": "Hg", "type": "metal", "color": "#e2e8f0", "ph": 7},
                {"id": "O2", "name": "Kislorod gazi (O2)", "formula": "O2", "type": "gas", "color": "#a5f3fc", "ph": 7},
                {"id": "Phenolphthalein", "name": "Fenolftalein indikatori", "formula": "Fenolftalein", "type": "indicator", "color": "#f43f5e", "ph": 7},
                {"id": "Lakmus", "name": "Lakmus indikatori", "formula": "Lakmus", "type": "indicator", "color": "#818cf8", "ph": 7},
                {"id": "AgNO3", "name": "Kumush nitrat (AgNO3)", "formula": "AgNO3", "type": "salt", "color": "#f8fafc", "ph": 6},
                {"id": "H2O", "name": "Distillangan Suv (H2O)", "formula": "H2O", "type": "solvent", "color": "#e0f2fe", "ph": 7},
            ]
        elif room_style == "COURTROOM":
            return [
                {"id": "evidence_forensic", "name": "Sud Ekspertizasi Xulosasi (№104)", "type": "evidence", "color": "#e0e7ff"},
                {"id": "law_article", "name": "Jinoyat Kodeksi 168-moddasi", "type": "law", "color": "#fef3c7"},
                {"id": "witness_proof", "name": "Guvoh Asrorovning Ko'rsatmasi", "type": "testimony", "color": "#f1f5f9"},
                {"id": "video_record", "name": "Kuzatuv Kamerasi Video Yozuvi", "type": "media", "color": "#fee2e2"},
                {"id": "contract_doc", "name": "Imzolangan Soxta Shartnoma", "type": "document", "color": "#ecfdf5"},
            ]
        elif room_style == "CYBER_DEFENSE":
            return [
                {"id": "firewall_rule", "name": "WAF / Firewall Himoya Qoidasi", "type": "defense", "color": "#dbeafe"},
                {"id": "rsa_key", "name": "Shifrlash Kaliti (RSA-2048)", "type": "cryptography", "color": "#fef9c3"},
                {"id": "packet_sniffer", "name": "Tarmoq Paket Tahlilchisi (Wireshark)", "type": "tool", "color": "#ede9fe"},
                {"id": "quarantine_host", "name": "Zararlangan Xostni Izolyatsiya Qilish", "type": "action", "color": "#fee2e2"},
            ]
        else:
            return [
                {"id": "action_analyze", "name": "Holatni Tahlil Qilish", "type": "action", "color": "#fef3c7"},
                {"id": "action_hypothesize", "name": "Gipoteza Ilgari Surish", "type": "hypothesis", "color": "#e0f2fe"},
                {"id": "action_verify", "name": "Tajribani Tekshirish", "type": "verify", "color": "#dcfce7"},
                {"id": "action_conclude", "name": "Yakuniy Xulosa Berish", "type": "conclusion", "color": "#f3e8ff"},
            ]
