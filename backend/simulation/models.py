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


class SimulationCase(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="simulation_cases", db_index=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True, related_name="simulation_cases")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_simulation_cases")
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(help_text="Scenario presented to the student.")
    role_context = models.TextField(help_text="The role the student assumes.")
    difficulty = models.CharField(max_length=10, choices=DifficultyLevel.choices, default=DifficultyLevel.MEDIUM, db_index=True)
    coin_reward = models.PositiveIntegerField(default=25)
    max_steps = models.PositiveSmallIntegerField(default=5, validators=[MinValueValidator(2), MaxValueValidator(50)])
    passing_score = models.PositiveSmallIntegerField(default=70, validators=[MinValueValidator(0), MaxValueValidator(100)])
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
