import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from curriculum.models import Course, Lesson


class DifficultyLevel(models.TextChoices):
    EASY = "EASY", _("Easy")
    MEDIUM = "MEDIUM", _("Medium")
    HARD = "HARD", _("Hard")
    EXPERT = "EXPERT", _("Expert")


class RoomStyle(models.TextChoices):
    COURTROOM = "COURTROOM", _("Sud Zali (Sudya, Prokuror, Advokat, Guvoh)")
    CHEMISTRY_LAB = "CHEMISTRY_LAB", _("Kimyo Laboratoriyasi (Bosh Laborant, Reagent Tahlilchisi, Xavfsizlik Inspektori)")
    MEDICAL_ER = "MEDICAL_ER", _("Tibbiy Reanimatsiya (Bosh Shifokor, Jarroh, Anesteziolog)")
    CYBER_DEFENSE = "CYBER_DEFENSE", _("Kiber-Xavfsizlik Markazi (SOC Tahlilchi, Administrator, Kriptograf)")
    CUSTOM = "CUSTOM", _("Umumiy / Erkin Simulyatsiya")


class SimulationCase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="simulation_cases", db_index=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True, related_name="simulation_cases")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_simulation_cases")
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(help_text="Scenario presented to the student.")
    role_context = models.TextField(help_text="The role the student assumes.")
    room_style = models.CharField(max_length=30, choices=RoomStyle.choices, default=RoomStyle.CUSTOM, db_index=True)
    max_participants = models.PositiveSmallIntegerField(default=4, validators=[MinValueValidator(1), MaxValueValidator(12)])
    roles_schema = models.JSONField(default=list, blank=True, help_text="List of roles in this simulation room")
    reaction_rules = models.JSONField(default=dict, blank=True, help_text="Science or logic reaction matrix")
    difficulty = models.CharField(max_length=10, choices=DifficultyLevel.choices, default=DifficultyLevel.MEDIUM, db_index=True)
    coin_reward = models.PositiveIntegerField(default=25)
    max_steps = models.PositiveSmallIntegerField(default=5, validators=[MinValueValidator(2), MaxValueValidator(50)])
    passing_score = models.PositiveSmallIntegerField(default=70, validators=[MinValueValidator(0), MaxValueValidator(100)])
    hint_text = models.TextField(blank=True, default="")
    expected_duration_minutes = models.PositiveSmallIntegerField(default=15)
    grading_rubric = models.JSONField(default=dict, blank=True)
    is_published = models.BooleanField(default=True, db_index=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "simulation_case"
        ordering = ["course", "difficulty", "title"]

    def __str__(self):
        return f"[{self.course.title}] {self.title}"


class SimulationRoom(models.Model):
    class Status(models.TextChoices):
        WAITING = "WAITING", _("Ishtirokchilar kutilmoqda")
        ACTIVE = "ACTIVE", _("Jarayon faol")
        COMPLETED = "COMPLETED", _("Yakunlandi")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(SimulationCase, on_delete=models.CASCADE, related_name="rooms", db_index=True)
    room_number = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.WAITING, db_index=True)
    max_participants = models.PositiveSmallIntegerField(default=4)
    current_step = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "simulation_room"
        ordering = ["case", "room_number"]
        unique_together = [("case", "room_number")]

    def __str__(self):
        return f"{self.case.title} - Xona #{self.room_number} ({self.status})"

    @property
    def active_participants_count(self):
        return self.participants.filter(is_active=True).count()

    @property
    def is_full(self):
        return self.active_participants_count >= self.max_participants


class RoomParticipant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(SimulationRoom, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="room_participations")
    role_id = models.CharField(max_length=100)
    role_title = models.CharField(max_length=255)
    role_goal = models.TextField(blank=True)
    is_ai = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    individual_score = models.FloatField(default=0.0)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "simulation_room_participant"
        ordering = ["joined_at"]
        unique_together = [("room", "role_id")]

    def __str__(self):
        name = "🤖 AI Bot" if self.is_ai else (self.user.username if self.user else "Talaba")
        return f"{name} ({self.role_title}) in Room #{self.room.room_number}"


class RoomChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(SimulationRoom, on_delete=models.CASCADE, related_name="chat_messages", db_index=True)
    sender_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    sender_role = models.CharField(max_length=100)
    sender_name = models.CharField(max_length=255)
    is_ai = models.BooleanField(default=False)
    message = models.TextField()
    scientific_feedback = models.JSONField(default=dict, blank=True)
    step_number = models.PositiveSmallIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "simulation_room_chat_message"
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.sender_role}] {self.sender_name}: {self.message[:40]}"


class SimulationSession(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", _("Active")
        COMPLETED = "COMPLETED", _("Completed")
        FAILED = "FAILED", _("Failed")
        ABANDONED = "ABANDONED", _("Abandoned")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="simulation_sessions", db_index=True)
    case = models.ForeignKey(SimulationCase, on_delete=models.PROTECT, related_name="sessions")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    current_step = models.PositiveSmallIntegerField(default=0)
    steps_taken = models.PositiveSmallIntegerField(default=0)
    total_score = models.FloatField(default=0.0)
    error_analysis = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "simulation_session"
        ordering = ["-started_at"]

    def __str__(self):
        return f"Session {self.id} ({self.status})"


class SimulationStepLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(SimulationSession, on_delete=models.CASCADE, related_name="step_logs", db_index=True)
    step_number = models.PositiveSmallIntegerField()
    student_input = models.TextField()
    ai_response_raw = models.JSONField(default=dict)
    step_score = models.FloatField(default=0.0)
    feedback_text = models.TextField(blank=True)
    next_scenario_text = models.TextField(blank=True)
    is_final_step = models.BooleanField(default=False)
    rag_context_chunks = models.JSONField(default=list, blank=True)
    prompt_tokens = models.PositiveIntegerField(default=0)
    completion_tokens = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "simulation_step_log"
        ordering = ["session", "step_number"]
        unique_together = [("session", "step_number")]
