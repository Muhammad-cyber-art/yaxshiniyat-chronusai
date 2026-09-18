from django.urls import path
from .views import (
    SimulationCaseListView,
    SimulationCaseDetailView,
    StartSimulationView,
    SimulationTurnView,
    AbandonSessionView,
    MySessionListView,
)

app_name = "simulation"

urlpatterns = [
    path("cases/", SimulationCaseListView.as_view(), name="case_list"),
    path("cases/<slug:slug>/", SimulationCaseDetailView.as_view(), name="case_detail"),
    path("start/", StartSimulationView.as_view(), name="start_simulation"),
    path("<uuid:session_id>/turn/", SimulationTurnView.as_view(), name="simulation_turn"),
    path("<uuid:session_id>/abandon/", AbandonSessionView.as_view(), name="abandon_session"),
    path("my-sessions/", MySessionListView.as_view(), name="my_sessions"),
]
