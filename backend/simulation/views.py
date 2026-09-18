from rest_framework import generics, views, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import SimulationCase, SimulationSession
from .serializers import SimulationCaseSerializer, StartSimulationSerializer, TurnInputSerializer, SimulationSessionSerializer
from .services import SimulationEngineService

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
    queryset = SimulationCase.objects.filter(is_published=True, is_active=True).select_related('course__domain')
    serializer_class = SimulationCaseSerializer
    permission_classes = [AllowAny]

class SimulationCaseDetailView(generics.RetrieveAPIView):
    queryset = SimulationCase.objects.filter(is_published=True, is_active=True).select_related('course__domain')
    serializer_class = SimulationCaseSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]

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
