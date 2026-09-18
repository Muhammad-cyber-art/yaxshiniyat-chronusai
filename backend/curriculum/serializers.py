from rest_framework import serializers
from .models import Domain, Course, Lesson

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "title", "slug", "summary", "content", "reading_time_minutes", "sort_order"]

class CourseSerializer(serializers.ModelSerializer):
    domain_name = serializers.CharField(source="domain.name", read_only=True)
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "description", "cover_image_url", "difficulty", "domain", "domain_name", "lessons"]

class DomainSerializer(serializers.ModelSerializer):
    courses = CourseSerializer(many=True, read_only=True)

    class Meta:
        model = Domain
        fields = ["id", "name", "slug", "description", "icon_url", "courses"]
