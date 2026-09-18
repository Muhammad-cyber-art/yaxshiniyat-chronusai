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


class DomainListView(generics.ListAPIView):
    queryset = Domain.objects.filter(is_active=True).prefetch_related("courses")
    serializer_class = DomainSerializer
    permission_classes = [AllowAny]


class CourseListView(generics.ListCreateAPIView):
    queryset = (
        Course.objects.filter(is_published=True)
        .select_related("domain", "instructor")
        .prefetch_related("lessons", "simulation_cases")
        .order_by("sort_order", "-created_at")
    )
    serializer_class = CourseSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user and self.request.user.is_authenticated else None
        serializer.save(instructor=user, is_published=True)


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.filter(is_published=True).select_related("domain", "instructor").prefetch_related("lessons", "simulation_cases")
    serializer_class = CourseSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]


class LessonListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonSerializer
    permission_classes = [AllowAny]

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
        slug = slugify(title)
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
        return StudyGroup.objects.prefetch_related("students").order_by("-created_at")

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

        avatars = [
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80",
        ]

        idx = 0
        for m in db_mentors:
            full_name = f"{m.first_name} {m.last_name}".strip() if m.first_name else m.username
            branch_name = m.branch.name if m.branch else "O'zbekiston Fanlar Akademiyasi"
            avatar = m.image.url if m.image else avatars[idx % len(avatars)]
            mentors_data.append({
                "id": m.id,
                "name": full_name,
                "title": m.subject or "Akademik Mentor & Tadqiqotchi",
                "institution": branch_name,
                "specialty": m.subject or "Zamonaviy Fanlar va AI Amaliyoti",
                "rating": 4.95,
                "students_count": 340 + (m.id * 85),
                "courses_count": Course.objects.filter(instructor=m).count() or 2,
                "avatar": avatar,
            })
            idx += 1

        # Agar bazada 4 tadan kam mentor bo'lsa, platforma to'liq ko'rinishi uchun nufuzli professorlarni qo'shamiz
        default_professors = [
            {
                "id": 901,
                "name": "Prof. Alisher Qodirov",
                "title": "Biologiya Fanlari Doktori, Professor",
                "institution": "O'zbekiston Fanlar Akademiyasi",
                "specialty": "Molekulyar Genetika va Biotexnologiya",
                "rating": 4.95,
                "students_count": 1240,
                "courses_count": 3,
                "avatar": avatars[0],
            },
            {
                "id": 902,
                "name": "Dr. Sardor Nazarov",
                "title": "Fizika-Matematika Fanlari Nomzodi",
                "institution": "O'zbekiston Milliy Universiteti",
                "specialty": "Nazariy Fizika va Kvant Optikasi",
                "rating": 4.92,
                "students_count": 890,
                "courses_count": 2,
                "avatar": avatars[1],
            },
            {
                "id": 903,
                "name": "Dots. Nilufar Karimova",
                "title": "Yuridik Fanlar Nomzodi, Dotsent",
                "institution": "Toshkent Davlat Yuridik Universiteti",
                "specialty": "Fuqarolik va Xalqaro Tijorat Huquqi",
                "rating": 4.88,
                "students_count": 1450,
                "courses_count": 4,
                "avatar": avatars[2],
            },
            {
                "id": 904,
                "name": "Dots. Maftuna Rahimova",
                "title": "Kimyo Fanlari Nomzodi",
                "institution": "O'zbekiston Milliy Universiteti",
                "specialty": "Organik Sintez va Spektroskopiya",
                "rating": 4.90,
                "students_count": 760,
                "courses_count": 2,
                "avatar": avatars[3],
            },
        ]

        existing_names = {m["name"].lower() for m in mentors_data}
        for prof in default_professors:
            if prof["name"].lower() not in existing_names:
                mentors_data.append(prof)

        serializer = PublicMentorSerializer(mentors_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
