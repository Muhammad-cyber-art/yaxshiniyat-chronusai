from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Domain, Course, Lesson
from .serializers import DomainSerializer, CourseSerializer, LessonSerializer

class DomainListView(generics.ListAPIView):
    queryset = Domain.objects.filter(is_active=True).prefetch_related("courses")
    serializer_class = DomainSerializer
    permission_classes = [AllowAny]

class CourseListView(generics.ListAPIView):
    queryset = Course.objects.filter(is_published=True).select_related("domain").prefetch_related("lessons")
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]

class CourseDetailView(generics.RetrieveAPIView):
    queryset = Course.objects.filter(is_published=True)
    serializer_class = CourseSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]

class LessonDetailView(generics.RetrieveAPIView):
    queryset = Lesson.objects.filter(is_published=True)
    serializer_class = LessonSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]
