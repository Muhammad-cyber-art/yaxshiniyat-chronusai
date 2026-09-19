import uuid
from rest_framework import serializers
from django.utils.text import slugify
from django.contrib.auth import get_user_model
from .models import Domain, Course, Lesson, StudyGroup, StudyGroupStudent

User = get_user_model()


class LessonSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        required=False,
        allow_null=True
    )
    course_title = serializers.CharField(source="course.title", read_only=True)
    slug = serializers.CharField(required=False, allow_blank=True)
    attachment = serializers.FileField(required=False, allow_null=True)
    attachment_url = serializers.SerializerMethodField(read_only=True)
    attachment_name = serializers.CharField(read_only=True)

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
            "attachment",
            "attachment_url",
            "attachment_name",
        ]
        validators = []  # Handled programmatically in create()

    def get_attachment_url(self, obj):
        """Faylning to'liq URL sini qaytaradi"""
        if obj.attachment:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)
        if "course_id" in data and not data.get("course"):
            data["course"] = data["course_id"]
        if not data.get("slug") and data.get("title"):
            data["slug"] = slugify(data["title"]) or "dars"
        return super().to_internal_value(data)

    def create(self, validated_data):
        course = validated_data.get("course")
        if not course:
            course_id = self.initial_data.get("course_id")
            if course_id:
                course = Course.objects.filter(id=course_id).first()
            if not course:
                course = Course.objects.first()
            validated_data["course"] = course

        base_slug = slugify(validated_data.get("title", "lesson")) or "dars"
        slug = base_slug
        idx = 1
        while Lesson.objects.filter(slug=slug, course=course).exists():
            slug = f"{base_slug}-{idx}"
            idx += 1
        validated_data["slug"] = slug
        validated_data["is_published"] = True

        # Original fayl nomini saqlash
        attachment = validated_data.get("attachment")
        if attachment:
            import os
            validated_data["attachment_name"] = getattr(attachment, "name", "").split("/")[-1]

        return super().create(validated_data)

    def update(self, instance, validated_data):
        attachment = validated_data.get("attachment")
        if attachment:
            import os
            validated_data["attachment_name"] = getattr(attachment, "name", "").split("/")[-1]
            # Eski faylni o'chirish
            if instance.attachment:
                try:
                    instance.attachment.delete(save=False)
                except Exception:
                    pass
        return super().update(instance, validated_data)



class CourseSerializer(serializers.ModelSerializer):
    domain = serializers.PrimaryKeyRelatedField(
        queryset=Domain.objects.all(),
        required=False,
        allow_null=True
    )
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

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)
        # Agar 'domain' qiymati UUID bo'lmasa (fan nomi sifatida kiritilgan bo'lsa)
        domain_val = data.get("domain")
        if domain_val and isinstance(domain_val, str):
            try:
                uuid.UUID(str(domain_val))
            except (ValueError, TypeError, AttributeError):
                if not data.get("domain_name"):
                    data["domain_name"] = domain_val.strip()
                data.pop("domain", None)

        return super().to_internal_value(data)

    def get_instructor_name(self, obj):
        if obj.instructor:
            name = f"{obj.instructor.first_name} {obj.instructor.last_name}".strip()
            return name if name else obj.instructor.username
        return "Akademik Mentor"

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
        # 1. Fan (Domain) yaratish yoki topish
        domain_name = self.initial_data.get("domain_name") or self.initial_data.get("domain")
        domain_obj = validated_data.get("domain")

        if not domain_obj and domain_name and isinstance(domain_name, str) and domain_name.strip():
            clean_name = domain_name.strip()
            existing_domain = None
            try:
                existing_domain = Domain.objects.filter(id=clean_name).first()
            except Exception:
                pass

            if not existing_domain:
                existing_domain = Domain.objects.filter(name__iexact=clean_name).first()

            if not existing_domain:
                # Yangi fan (Domain) bazada yaratiladi
                base_slug = slugify(clean_name) or "fan"
                slug = base_slug
                idx = 1
                while Domain.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{idx}"
                    idx += 1
                existing_domain = Domain.objects.create(
                    name=clean_name,
                    slug=slug,
                    description=f"{clean_name} yo'nalishidagi zamonaviy fan va kurslar",
                    is_active=True,
                )

            domain_obj = existing_domain
            validated_data["domain"] = domain_obj

        # Agar fan ko'rsatilmagan bo'lsa
        if not validated_data.get("domain"):
            first_domain = Domain.objects.first()
            if not first_domain:
                first_domain = Domain.objects.create(
                    name="Umumiy Fanlar",
                    slug="umumiy-fanlar",
                    description="Umumiy fanlar yo'nalishi",
                    is_active=True,
                )
            validated_data["domain"] = first_domain

        # 2. Kurs slugi yaratish
        if not validated_data.get("slug"):
            base_slug = slugify(validated_data.get("title", "course")) or "kurs"
            slug = base_slug
            idx = 1
            while Course.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{idx}"
                idx += 1
            validated_data["slug"] = slug

        # 3. Kurs doimo ommaviy va global (barcha talabalarga ko'rinadi)
        validated_data["is_published"] = True

        return super().create(validated_data)


class DomainSerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = Domain
        fields = ["id", "name", "slug", "description", "icon_url", "courses"]
        extra_kwargs = {
            "slug": {"required": False},
        }

    def create(self, validated_data):
        if not validated_data.get("slug"):
            base_slug = slugify(validated_data.get("name", "domain")) or "fan"
            slug = base_slug
            idx = 1
            while Domain.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{idx}"
                idx += 1
            validated_data["slug"] = slug
        validated_data["is_active"] = True
        return super().create(validated_data)


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
