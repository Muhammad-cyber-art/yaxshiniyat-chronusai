from rest_framework import serializers
from .models import (
    SimulationCase,
    SimulationSession,
    SimulationStepLog,
    SimulationRoom,
    RoomParticipant,
    RoomChatMessage,
)


class SimulationCaseSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    domain_name = serializers.CharField(source="course.domain.name", read_only=True)
    lesson_title = serializers.CharField(source="lesson.title", read_only=True)

    class Meta:
        model = SimulationCase
        fields = [
            "id",
            "course",
            "course_title",
            "lesson",
            "lesson_title",
            "title",
            "slug",
            "description",
            "role_context",
            "room_style",
            "max_participants",
            "roles_schema",
            "reaction_rules",
            "difficulty",
            "coin_reward",
            "max_steps",
            "passing_score",
            "hint_text",
            "expected_duration_minutes",
            "domain_name",
            "created_at",
        ]


class RoomParticipantSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = RoomParticipant
        fields = [
            "id",
            "user",
            "username",
            "full_name",
            "role_id",
            "role_title",
            "role_goal",
            "is_ai",
            "is_active",
            "individual_score",
            "joined_at",
        ]

    def get_full_name(self, obj):
        if obj.is_ai:
            return f"🤖 {obj.role_title} (AI)"
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return "Talaba"


class RoomChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomChatMessage
        fields = [
            "id",
            "room",
            "sender_user",
            "sender_role",
            "sender_name",
            "is_ai",
            "message",
            "scientific_feedback",
            "step_number",
            "created_at",
        ]


class SimulationRoomSerializer(serializers.ModelSerializer):
    case_title = serializers.CharField(source="case.title", read_only=True)
    room_style = serializers.CharField(source="case.room_style", read_only=True)
    roles_schema = serializers.JSONField(source="case.roles_schema", read_only=True)
    participants = RoomParticipantSerializer(many=True, read_only=True)
    active_count = serializers.IntegerField(source="active_participants_count", read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = SimulationRoom
        fields = [
            "id",
            "case",
            "case_title",
            "room_style",
            "room_number",
            "status",
            "max_participants",
            "current_step",
            "roles_schema",
            "participants",
            "active_count",
            "is_full",
            "created_at",
        ]


class GenerateCaseSerializer(serializers.Serializer):
    course_id = serializers.UUIDField()
    lesson_id = serializers.UUIDField(required=False, allow_null=True)
    room_style = serializers.CharField(default="CUSTOM")
    expected_duration_minutes = serializers.IntegerField(default=15, min_value=3, max_value=120)
    max_participants = serializers.IntegerField(default=4, min_value=1, max_value=12)
    passing_score = serializers.IntegerField(default=70, min_value=1, max_value=100)
    lesson_material_text = serializers.CharField(required=False, allow_blank=True, max_length=15000)
    custom_instructions = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class JoinRoomSerializer(serializers.Serializer):
    case_id = serializers.UUIDField(required=False, allow_null=True)
    room_id = serializers.UUIDField(required=False, allow_null=True)
    preferred_role_id = serializers.CharField(required=False, allow_blank=True)


class RoomTurnInputSerializer(serializers.Serializer):
    message = serializers.CharField(min_length=2, max_length=5000)
    reaction_action = serializers.CharField(required=False, allow_blank=True, max_length=500)


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
