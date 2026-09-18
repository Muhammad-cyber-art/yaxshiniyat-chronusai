import uuid
from rest_framework import generics, views, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils.text import slugify

from .models import Domain, Course, Lesson, StudyGroup, StudyGroupStudent
from .serializers import (
    DomainSerializer,
    CourseSerializer,
    LessonSerializer,
    StudyGroupSerializer,
    StudyGroupStudentSerializer,
    PublicMentorSerializer,
)

User = get_user_model()


class DomainListView(generics.ListCreateAPIView):
    queryset = Domain.objects.filter(is_active=True).prefetch_related("courses")
    serializer_class = DomainSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def perform_create(self, serializer):
        name = self.request.data.get("name", "").strip() or "Fan"
        base_slug = slugify(name) or "fan"
        slug = base_slug
        idx = 1
        while Domain.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{idx}"
            idx += 1
        serializer.save(slug=slug, is_active=True)


class CourseListView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        base_qs = (
            Course.objects.filter(is_published=True)
            .select_related("domain", "instructor")
            .prefetch_related("lessons", "simulation_cases")
            .order_by("sort_order", "-created_at")
        )
        user = self.request.user
        mine = self.request.query_params.get("mine")

        # Faqat o'z kurslarini boshqarish uchun ?mine=true so'ralganda
        if mine and mine.lower() in ["true", "1"]:
            if user and user.is_authenticated:
                return base_qs.filter(instructor=user)
            return base_qs.none()

        # Barcha talabalar va ommaviy ko'rish uchun: barcha kurslar global ko'rinadi
        return base_qs

    def perform_create(self, serializer):
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        serializer.save(instructor=user, is_published=True)


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.filter(is_published=True).select_related("domain", "instructor").prefetch_related("lessons", "simulation_cases")
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field or "slug"
        lookup_value = self.kwargs.get(lookup_url_kwarg) or self.kwargs.get("slug") or self.kwargs.get("pk") or self.kwargs.get("id")
        
        try:
            val_uuid = uuid.UUID(str(lookup_value))
            obj = self.queryset.filter(id=val_uuid).first()
            if obj:
                self.check_object_permissions(self.request, obj)
                return obj
        except Exception:
            pass

        obj = self.queryset.filter(slug=lookup_value).first()
        if not obj:
            obj = self.queryset.filter(title__iexact=lookup_value).first()
        if obj:
            self.check_object_permissions(self.request, obj)
            return obj

        from django.http import Http404
        raise Http404("Kurs topilmadi")


class LessonListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        qs = Lesson.objects.filter(is_published=True).select_related("course").order_by("course", "sort_order")
        course_slug = self.request.query_params.get("course_slug")
        course_id = self.request.query_params.get("course_id")
        if course_slug:
            qs = qs.filter(course__slug=course_slug)
        elif course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    def perform_create(self, serializer):
        course_id = self.request.data.get("course_id")
        course_slug = self.request.data.get("course_slug")
        course = None
        if course_id:
            course = Course.objects.filter(id=course_id).first()
        elif course_slug:
            course = Course.objects.filter(slug=course_slug).first()
        if not course:
            course = Course.objects.first()

        title = self.request.data.get("title", "Yangi Dars")
        slug = slugify(title) or "dars"
        idx = 1
        base_slug = slug
        while Lesson.objects.filter(slug=slug, course=course).exists():
            slug = f"{base_slug}-{idx}"
            idx += 1

        serializer.save(course=course, slug=slug, is_published=True)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Lesson.objects.filter(is_published=True)
    serializer_class = LessonSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]


class StudyGroupListCreateView(generics.ListCreateAPIView):
    serializer_class = StudyGroupSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = StudyGroup.objects.prefetch_related("students").order_by("-created_at")
        # Mentor faqat o'z guruhlarini ko'radi
        user = self.request.user
        if user and user.is_authenticated and hasattr(user, 'role') and user.role == 'mentor':
            return qs.filter(mentor=user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        serializer.save(mentor=user)


class StudyGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StudyGroup.objects.prefetch_related("students")
    serializer_class = StudyGroupSerializer
    permission_classes = [AllowAny]


class StudyGroupStudentCreateView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, group_id, *args, **kwargs):
        group = StudyGroup.objects.filter(id=group_id).first()
        if not group:
            return Response({"error": "Guruh topilmadi"}, status=status.HTTP_404_NOT_FOUND)

        name = request.data.get("name", "").strip()
        if not name:
            return Response({"error": "Talaba ismi kiritilishi shart"}, status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get("email", "").strip()
        if not email:
            safe_name = slugify(name).replace("-", "_")
            email = f"{safe_name}@student.uz"

        student = StudyGroupStudent.objects.create(
            group=group,
            name=name,
            email=email,
            progress=0,
            ai_score="Yangi",
        )
        serializer = StudyGroupStudentSerializer(student)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudyGroupStudentDeleteView(views.APIView):
    permission_classes = [AllowAny]

    def delete(self, request, group_id, student_id, *args, **kwargs):
        student = StudyGroupStudent.objects.filter(id=student_id, group_id=group_id).first()
        if not student:
            return Response({"error": "Talaba topilmadi"}, status=status.HTTP_404_NOT_FOUND)
        student.delete()
        return Response({"success": True, "message": "Talaba guruhdan o'chirildi"})


class PublicMentorListView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        db_mentors = User.objects.filter(role="mentor").select_related("branch")
        mentors_data = []

        for m in db_mentors:
            full_name = f"{m.first_name} {m.last_name}".strip() if m.first_name else m.username
            branch_name = m.branch.name if m.branch else None
            # Faqat haqiqiy avatar image URL ishlatiladi
            avatar = None
            if m.image:
                try:
                    avatar = request.build_absolute_uri(m.image.url)
                except Exception:
                    avatar = None

            mentors_data.append({
                "id": m.id,
                "name": full_name,
                "title": m.subject or "Akademik Mentor",
                "institution": branch_name,
                "specialty": m.subject or "",
                "rating": None,
                "students_count": None,
                "courses_count": Course.objects.filter(instructor=m).count(),
                "avatar": avatar,
            })

        serializer = PublicMentorSerializer(mentors_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
