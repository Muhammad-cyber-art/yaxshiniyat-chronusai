import uuid
from rest_framework import generics, views, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from curriculum.models import Course, Lesson

from .models import (
    SimulationCase,
    SimulationSession,
    SimulationRoom,
    RoomParticipant,
    RoomChatMessage,
)
from .serializers import (
    SimulationCaseSerializer,
    StartSimulationSerializer,
    TurnInputSerializer,
    SimulationSessionSerializer,
    SimulationRoomSerializer,
    RoomParticipantSerializer,
    RoomChatMessageSerializer,
    GenerateCaseSerializer,
    JoinRoomSerializer,
    RoomTurnInputSerializer,
)
from .services import SimulationEngineService
from .ai_generator import AISimulatorService


def get_effective_user(request):
    if request.user and request.user.is_authenticated:
        return request.user
    User = get_user_model()
    demo_user, _ = User.objects.get_or_create(
        username='demo_student',
        defaults={
            'email': 'demo@chronosai.uz',
            'role': 'admin',
            'is_active': True
        }
    )
    return demo_user


class SimulationCaseListView(generics.ListAPIView):
    queryset = SimulationCase.objects.filter(is_published=True, is_active=True).select_related('course__domain', 'lesson')
    serializer_class = SimulationCaseSerializer
    permission_classes = [AllowAny]


class SimulationCaseDetailView(generics.RetrieveAPIView):
    queryset = SimulationCase.objects.filter(is_published=True, is_active=True).select_related('course__domain', 'lesson')
    serializer_class = SimulationCaseSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]


class GenerateSimulationCaseView(views.APIView):
    """
    1. O'qituvchi kurs va darsni belgilab, simulyator xonasini AI orqali yaratadi.
    - room_style (Sud zali, Kimyo laboratoriyasi, Tibbiyot, Kiber-xavfsizlik, Erkin)
    - expected_duration_minutes
    - passing_score / max ball
    - max_participants (xona sig'imi)
    - lesson_material_text (elektron darslik matni)
    AI bular asosida storyline, rollar va ilmiy reaksiyalar qoidasini yaratadi.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = GenerateCaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = get_effective_user(request)
        course = get_object_or_404(Course, id=data['course_id'])
        lesson = None
        if data.get('lesson_id'):
            lesson = Lesson.objects.filter(id=data['lesson_id']).first()

        try:
            case, room = AISimulatorService.generate_case_and_room(
                course=course,
                lesson=lesson,
                teacher=user,
                room_style=data.get('room_style', 'CUSTOM'),
                expected_duration_minutes=data.get('expected_duration_minutes', 15),
                max_participants=data.get('max_participants', 4),
                passing_score=data.get('passing_score', 70),
                lesson_material_text=data.get('lesson_material_text', ''),
                custom_instructions=data.get('custom_instructions', '')
            )
            invite_path = f"/simulation?roomId={room.id}&caseId={case.id}"
            return Response({
                'success': True,
                'message': 'AI simulyator xonasi muvaffaqiyatli yaratildi!',
                'data': {
                    'case': SimulationCaseSerializer(case).data,
                    'room': SimulationRoomSerializer(room).data,
                    'invite_url': invite_path,
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'success': False,
                'error': {'message': f"Simulyator generatsiya qilishda xatolik: {str(e)}"}
            }, status=status.HTTP_400_BAD_REQUEST)


class SimulationCaseRoomsView(views.APIView):
    """Bitta simulyatsiya keysiga tegishli barcha xonalar ro'yxatini qaytaradi"""
    permission_classes = [AllowAny]

    def get(self, request, case_id, *args, **kwargs):
        case = get_object_or_404(SimulationCase, id=case_id)
        rooms = case.rooms.all().prefetch_related('participants__user')
        return Response({
            'success': True,
            'data': {
                'case': SimulationCaseSerializer(case).data,
                'rooms': SimulationRoomSerializer(rooms, many=True).data,
            }
        })


class JoinRoomView(views.APIView):
    """
    O'quvchi xonaga kiradi.
    Agar 1-xona to'lgan bo'lsa, AI dinamik tarzda yangi xona (Multi-room scaling) ochadi.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = JoinRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = get_effective_user(request)
        room_id = data.get('room_id')
        case_id = data.get('case_id')

        if room_id and not case_id:
            target_r = get_object_or_404(SimulationRoom, id=room_id)
            case_id = str(target_r.case_id)

        if not case_id:
            return Response({'success': False, 'error': {'message': 'case_id yoki room_id kiritilishi shart.'}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            room, participant, scaled = AISimulatorService.join_or_scale_room(
                case_id=str(case_id),
                user=user,
                preferred_role_id=data.get('preferred_role_id')
            )
            # Avtomatik ravishda bo'sh qolgan o'rinlarni AI botlar bilan to'ldirish
            AISimulatorService.populate_ai_roles_if_needed(room)

            invite_path = f"/simulation?roomId={room.id}&caseId={room.case_id}"
            return Response({
                'success': True,
                'message': 'Simulyatsiya xonasiga muvaffaqiyatli qo\'shildingiz.',
                'data': {
                    'room_id': str(room.id),
                    'room_number': room.room_number,
                    'status': room.status,
                    'scaled_new_room': scaled,
                    'invite_url': invite_path,
                    'participant': RoomParticipantSerializer(participant).data,
                    'room': SimulationRoomSerializer(room).data,
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'error': {'message': str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)


class StartRoomView(views.APIView):
    """
    Simulyatsiyani boshlash.
    2. Agar o'quvchilar soni yetishmasa, AI bo'sh qolgan barcha rollarni o'z zimmasiga oladi (AI NPC botlar).
    """
    permission_classes = [AllowAny]

    def post(self, request, room_id, *args, **kwargs):
        room = get_object_or_404(SimulationRoom, id=room_id)
        created_bots = AISimulatorService.populate_ai_roles_if_needed(room)
        return Response({
            'success': True,
            'message': f"Simulyatsiya boshlandi! {len(created_bots)} ta rol AI botlar tomonidan to'ldirildi.",
            'data': {
                'room': SimulationRoomSerializer(room).data,
                'ai_bots_count': len(created_bots)
            }
        })


class RoomDetailView(views.APIView):
    """Xona holati, ishtirokchilar va barcha chat xabarlarini qaytaradi"""
    permission_classes = [AllowAny]

    def get(self, request, room_id, *args, **kwargs):
        room = get_object_or_404(SimulationRoom.objects.select_related('case__course__domain'), id=room_id)
        # Agar xonada AI botlar hali bo'lmasa, bo'sh o'rinlarga AI ishtirokchilarni joylashtirish
        if room.participants.filter(is_ai=True).count() == 0:
            AISimulatorService.populate_ai_roles_if_needed(room)

        chat_messages = room.chat_messages.all().order_by('created_at')
        user = get_effective_user(request)
        my_participant = room.participants.filter(user=user, is_active=True).first()

        return Response({
            'success': True,
            'data': {
                'room': SimulationRoomSerializer(room).data,
                'chat_messages': RoomChatMessageSerializer(chat_messages, many=True).data,
                'my_role': RoomParticipantSerializer(my_participant).data if my_participant else None,
                'case': SimulationCaseSerializer(room.case).data,
            }
        })


class RoomTurnView(views.APIView):
    """
    Xonada navbat/harakat yuborish:
    3. AI kimyoviy reaksiya yoki qonuniy mantiqni avtomatik hisoblaydi (formula, effekt, xavf, ball).
    Bo'sh rollardagi AI NPC botlar talaba gapiga o'zbek tilida mos javob beradi.
    """
    permission_classes = [AllowAny]

    def post(self, request, room_id, *args, **kwargs):
        serializer = RoomTurnInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        room = get_object_or_404(SimulationRoom, id=room_id)
        user = get_effective_user(request)

        participant = room.participants.filter(user=user, is_active=True).first()
        if not participant:
            # Join as participant if not already
            room, participant, _ = AISimulatorService.join_or_scale_room(str(room.case_id), user)

        result = AISimulatorService.process_room_turn(
            room=room,
            sender_participant=participant,
            message_text=data['message'],
            reaction_action=data.get('reaction_action', '')
        )

        return Response({
            'success': True,
            'message': 'Harakat qayd etildi.',
            'data': result
        })


# Legacy Single-Player endpoints compatibility:
class StartSimulationView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = StartSimulationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_effective_user(request)
        try:
            session = SimulationEngineService.start_session(
                student=user,
                case_id=str(serializer.validated_data['case_id'])
            )
        except ValueError as e:
            return Response({'success': False, 'error': {'code': 'NOT_FOUND', 'message': str(e)}}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'success': False, 'error': {'code': 'ERROR', 'message': str(e)}}, status=status.HTTP_400_BAD_REQUEST)

        step_logs = [
            {
                'step_number': log.step_number,
                'student_input': log.student_input,
                'step_score': log.step_score,
                'feedback': log.feedback_text,
                'next_scenario': log.next_scenario_text,
                'is_final': log.is_final_step,
                'strengths': log.ai_response_raw.get('strengths', []) if isinstance(log.ai_response_raw, dict) else [],
                'error_flags': log.ai_response_raw.get('error_flags', []) if isinstance(log.ai_response_raw, dict) else [],
                'running_total_score': session.total_score,
            }
            for log in session.step_logs.order_by('step_number')
        ]

        return Response({
            'success': True,
            'message': 'Simulation started! Good luck.',
            'data': {
                'session_id': str(session.id),
                'case_title': session.case.title,
                'role_context': session.case.role_context,
                'description': session.case.description,
                'max_steps': session.case.max_steps,
                'passing_score': session.case.passing_score,
                'status': session.status,
                'step_logs': step_logs,
            }
        }, status=status.HTTP_201_CREATED)


class SimulationTurnView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, session_id, *args, **kwargs):
        serializer = TurnInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_effective_user(request)
        try:
            result = SimulationEngineService.process_turn(
                session_id=str(session_id),
                student=user,
                student_input=serializer.validated_data['student_input']
            )
        except Exception as e:
            return Response({'success': False, 'error': {'code': 'AI_ERROR', 'message': str(e)}}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'success': True, 'data': result})


class AbandonSessionView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, session_id, *args, **kwargs):
        user = get_effective_user(request)
        try:
            SimulationEngineService.abandon_session(session_id=str(session_id), student=user)
            return Response({'success': True, 'message': 'Session abandoned.'})
        except Exception as e:
            return Response({'success': False, 'error': {'message': str(e)}}, status=status.HTTP_400_BAD_REQUEST)


class MySessionListView(generics.ListAPIView):
    serializer_class = SimulationSessionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = get_effective_user(self.request)
        return SimulationSession.objects.filter(student=user).select_related('case').prefetch_related('step_logs')
