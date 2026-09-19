from django.urls import path
from .views import (
    SimulationCaseListView,
    SimulationCaseDetailView,
    GenerateSimulationCaseView,
    SimulationCaseRoomsView,
    JoinRoomView,
    RoomDetailView,
    StartRoomView,
    RoomTurnView,
    StartSimulationView,
    SimulationTurnView,
    AbandonSessionView,
    MySessionListView,
)

app_name = "simulation"

urlpatterns = [
    # Multi-room & AI Generator routes
    path("generate-case/", GenerateSimulationCaseView.as_view(), name="generate_case"),
    path("cases/<uuid:case_id>/rooms/", SimulationCaseRoomsView.as_view(), name="case_rooms"),
    path("rooms/join/", JoinRoomView.as_view(), name="join_room"),
    path("rooms/<uuid:room_id>/", RoomDetailView.as_view(), name="room_detail"),
    path("rooms/<uuid:room_id>/start/", StartRoomView.as_view(), name="start_room"),
    path("rooms/<uuid:room_id>/turn/", RoomTurnView.as_view(), name="room_turn"),

    # Case listing & details
    path("cases/", SimulationCaseListView.as_view(), name="case_list"),
    path("cases/<slug:slug>/", SimulationCaseDetailView.as_view(), name="case_detail"),

    # Legacy solo simulation session routes
    path("start/", StartSimulationView.as_view(), name="start_simulation"),
    path("<uuid:session_id>/turn/", SimulationTurnView.as_view(), name="simulation_turn"),
    path("<uuid:session_id>/abandon/", AbandonSessionView.as_view(), name="abandon_session"),
    path("my-sessions/", MySessionListView.as_view(), name="my_sessions"),
]
