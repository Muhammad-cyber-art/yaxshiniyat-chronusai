from django.urls import path
from .views import (
    DomainListView,
    CourseListView,
    CourseDetailView,
    LessonListCreateView,
    LessonDetailView,
    StudyGroupListCreateView,
    StudyGroupDetailView,
    StudyGroupStudentCreateView,
    StudyGroupStudentDeleteView,
    PublicMentorListView,
)

app_name = "curriculum"

urlpatterns = [
    path("domains/", DomainListView.as_view(), name="domain_list"),
    path("courses/", CourseListView.as_view(), name="course_list"),
    path("courses/<uuid:pk>/", CourseDetailView.as_view(), name="course_detail_by_pk"),
    path("courses/<slug:slug>/", CourseDetailView.as_view(), name="course_detail"),
    path("lessons/", LessonListCreateView.as_view(), name="lesson_list_create"),
    path("lessons/<slug:slug>/", LessonDetailView.as_view(), name="lesson_detail"),
    path("mentors/", PublicMentorListView.as_view(), name="mentor_list"),
    path("groups/", StudyGroupListCreateView.as_view(), name="study_group_list"),
    path("groups/<uuid:pk>/", StudyGroupDetailView.as_view(), name="study_group_detail"),
    path("groups/<uuid:group_id>/students/", StudyGroupStudentCreateView.as_view(), name="study_group_student_add"),
    path("groups/<uuid:group_id>/students/<uuid:student_id>/", StudyGroupStudentDeleteView.as_view(), name="study_group_student_delete"),
]
