import uuid
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator


class DifficultyLevel(models.TextChoices):
    BEGINNER = "BEGINNER", _("Beginner")
    INTERMEDIATE = "INTERMEDIATE", _("Intermediate")
    ADVANCED = "ADVANCED", _("Advanced")
    EXPERT = "EXPERT", _("Expert")


class Domain(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    icon_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "curriculum_domain"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    domain = models.ForeignKey(Domain, on_delete=models.PROTECT, related_name="courses", db_index=True)
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="curriculum_courses")
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    description = models.TextField(blank=True)
    cover_image_url = models.URLField(blank=True)
    difficulty = models.CharField(max_length=20, choices=DifficultyLevel.choices, default=DifficultyLevel.BEGINNER, db_index=True)
    is_published = models.BooleanField(default=False, db_index=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "curriculum_course"
        ordering = ["domain", "sort_order", "title"]

    def __str__(self):
        return f"[{self.domain.name}] {self.title}"


class Lesson(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="lessons", db_index=True)
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, db_index=True)
    content = models.TextField(help_text="Lesson content in Markdown. Used as RAG knowledge base.")
    summary = models.TextField(blank=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    reading_time_minutes = models.PositiveSmallIntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(120)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "curriculum_lesson"
        ordering = ["course", "sort_order"]
        unique_together = [("course", "slug")]

    def __str__(self):
        return f"[{self.course.title}] {self.title}"


class DocumentChunk(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="chunks", db_index=True)
    chunk_index = models.PositiveSmallIntegerField()
    text = models.TextField()
    token_count = models.PositiveIntegerField(default=0)
    embedding = models.JSONField(null=True, blank=True)
    source_section = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "curriculum_document_chunk"
        ordering = ["lesson", "chunk_index"]
        unique_together = [("lesson", "chunk_index")]

    def __str__(self):
        return f"Chunk[{self.chunk_index}] of {self.lesson.title}"


class StudyGroup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mentor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="curriculum_study_groups")
    name = models.CharField(max_length=255)
    course_name = models.CharField(max_length=255)
    schedule = models.CharField(max_length=255, default="Dush / Chor / Juma • 16:00")
    max_students = models.PositiveSmallIntegerField(default=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "curriculum_study_group"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class StudyGroupStudent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group = models.ForeignKey(StudyGroup, on_delete=models.CASCADE, related_name="students")
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, blank=True)
    progress = models.PositiveSmallIntegerField(default=0)
    ai_score = models.CharField(max_length=50, default="Yangi")
    joined_date = models.DateField(auto_now_add=True)

    class Meta:
        db_table = "curriculum_study_group_student"
        ordering = ["-joined_date"]

    def __str__(self):
        return f"{self.name} ({self.group.name})"

