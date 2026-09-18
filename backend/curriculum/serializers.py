from rest_framework import serializers
from django.utils.text import slugify
from django.contrib.auth import get_user_model
from .models import Domain, Course, Lesson, StudyGroup, StudyGroupStudent

User = get_user_model()


class LessonSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "course",
            "course_title",
            "title",
            "slug",
            "summary",
            "content",
            "reading_time_minutes",
            "sort_order",
            "is_published",
        ]
        extra_kwargs = {
            "slug": {"required": False},
            "course": {"required": False},
        }

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data.get("title", "lesson"))
        return super().create(validated_data)


class CourseSerializer(serializers.ModelSerializer):
    domain_name = serializers.CharField(source="domain.name", read_only=True)
    instructor_name = serializers.SerializerMethodField()
    simulations_count = serializers.SerializerMethodField()
    simulation_slug = serializers.SerializerMethodField()
    lessons_count = serializers.SerializerMethodField()
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "cover_image_url",
            "difficulty",
            "domain",
            "domain_name",
            "instructor",
            "instructor_name",
            "simulations_count",
            "simulation_slug",
            "lessons_count",
            "is_published",
            "lessons",
        ]
        extra_kwargs = {
            "slug": {"required": False},
            "instructor": {"required": False},
            "domain": {"required": False},
        }

    def get_instructor_name(self, obj):
        if obj.instructor:
            name = f"{obj.instructor.first_name} {obj.instructor.last_name}".strip()
            return name if name else obj.instructor.username
        return "Prof. Alisher Qodirov"

    def get_simulations_count(self, obj):
        if hasattr(obj, "simulation_cases"):
            return obj.simulation_cases.filter(is_published=True).count()
        return 0

    def get_simulation_slug(self, obj):
        if hasattr(obj, "simulation_cases"):
            first_case = obj.simulation_cases.filter(is_published=True).first()
            if first_case:
                return first_case.slug
        return None

    def get_lessons_count(self, obj):
        if hasattr(obj, "lessons"):
            return obj.lessons.count()
        return 0

    def create(self, validated_data):
        if not validated_data.get("slug"):
            base_slug = slugify(validated_data.get("title", "course"))
            slug = base_slug
            idx = 1
            while Course.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{idx}"
                idx += 1
            validated_data["slug"] = slug

        if not validated_data.get("domain"):
            first_domain = Domain.objects.first()
            if first_domain:
                validated_data["domain"] = first_domain

        return super().create(validated_data)


class DomainSerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = Domain
        fields = ["id", "name", "slug", "description", "icon_url", "courses"]


class StudyGroupStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyGroupStudent
        fields = ["id", "group", "name", "email", "progress", "ai_score", "joined_date"]
        extra_kwargs = {"group": {"required": False}}


class StudyGroupSerializer(serializers.ModelSerializer):
    students = StudyGroupStudentSerializer(many=True, read_only=True)
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = StudyGroup
        fields = [
            "id",
            "name",
            "course_name",
            "schedule",
            "max_students",
            "created_at",
            "students",
            "students_count",
        ]

    def get_students_count(self, obj):
        return obj.students.count()


class PublicMentorSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    title = serializers.CharField()
    institution = serializers.CharField()
    specialty = serializers.CharField()
    rating = serializers.FloatField()
    students_count = serializers.IntegerField()
    courses_count = serializers.IntegerField()
    avatar = serializers.CharField()
