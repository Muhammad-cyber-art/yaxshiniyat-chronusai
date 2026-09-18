from rest_framework import serializers
from .models import SimulationCase, SimulationSession, SimulationStepLog

class SimulationCaseSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    domain_name = serializers.CharField(source="course.domain.name", read_only=True)

    class Meta:
        model = SimulationCase
        fields = [
            "id", "title", "slug", "description", "role_context", "difficulty",
            "coin_reward", "max_steps", "passing_score", "course_title", "domain_name"
        ]

class StartSimulationSerializer(serializers.Serializer):
    case_id = serializers.UUIDField()

class TurnInputSerializer(serializers.Serializer):
    student_input = serializers.CharField(min_length=3, max_length=5000)

class SimulationStepLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SimulationStepLog
        fields = ["step_number", "student_input", "step_score", "feedback_text", "next_scenario_text", "is_final_step", "created_at"]

class SimulationSessionSerializer(serializers.ModelSerializer):
    case_title = serializers.CharField(source="case.title", read_only=True)
    step_logs = SimulationStepLogSerializer(many=True, read_only=True)

    class Meta:
        model = SimulationSession
        fields = ["id", "case", "case_title", "status", "current_step", "steps_taken", "total_score", "started_at", "completed_at", "step_logs"]
