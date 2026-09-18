from django.urls import path
from .views import DomainListView, CourseListView, CourseDetailView, LessonDetailView

app_name = "curriculum"

urlpatterns = [
    path("domains/", DomainListView.as_view(), name="domain_list"),
    path("courses/", CourseListView.as_view(), name="course_list"),
    path("courses/<slug:slug>/", CourseDetailView.as_view(), name="course_detail"),
    path("lessons/<slug:slug>/", LessonDetailView.as_view(), name="lesson_detail"),
]
