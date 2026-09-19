from rest_framework import status, viewsets, permissions, filters
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, ValidationError
import requests
from django.utils.crypto import get_random_string

from .serializers import (
    RegisterSerializer, LoginSerializer, UsersListSerializer, 
    CurrentUserSerializer, BranchAccessSerializer, PublicRegisterSerializer
)
from .models import UserModel, BranchAccess
from rest_framework_simplejwt.views import TokenObtainPairView
User = get_user_model()


# Custom permission logic (keyin permission class sifatida ishlatamiz)
def get_user_role(user):
    return user.role if hasattr(user, 'role') else None



class RegisterViewSet(ModelViewSet):
    queryset = UserModel.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role', 'branch']
    search_fields = ['username', 'first_name', 'last_name']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserModel.objects.none()
        user = self.request.user
        if user.role == 'super_admin': 
            return UserModel.objects.select_related('branch').all()
        
        # Admin ko'ra oladigan filiallar
        allowed = list(user.branch_accesses.values_list('branch_id', flat=True))
        if user.branch_id: 
            allowed.append(user.branch_id)
        
        if user.role == 'admin':
            # BranchAccess orqali ko'chirilgan mentorlarni ham ko'rish
            return UserModel.objects.filter(
                Q(branch_id__in=allowed) | Q(branch_accesses__branch_id__in=allowed)
            ).exclude(role='super_admin').select_related('branch').distinct()
        return UserModel.objects.filter(id=user.id).select_related('branch')

    def create(self, request, *args, **kwargs):
        """Ruxsatlarni tekshirish logikasi"""
        current_user = request.user
        target_role = request.data.get('role', 'mentor')

        if current_user.role == 'super_admin':
            pass 
        elif current_user.role == 'admin':
            # Admin faqat mentor yarata olishi haqidagi cheklov
            if target_role != 'mentor':
                return Response(
                    {"detail": "Admin faqat mentor qo'sha oladi."},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            return Response(
                {"detail": "Sizda foydalanuvchi yaratish huquqi yo'q."},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """branch_id ni saqlash logikasi (Tuzatilgan)"""
        user = self.request.user
        requested_branch_id = self.request.data.get('branch_id')

        # 1. Super Admin uchun logika
        if user.role == 'super_admin':
            if requested_branch_id:
                serializer.save(branch_id=requested_branch_id)
            else:
                serializer.save() # Agar super_admin branch_id yubormasa null ketaveradi
            return

        # 2. Admin uchun ruxsat berilgan filialni tekshirish
        allowed = list(user.branch_accesses.values_list('branch_id', flat=True))
        if user.branch_id: 
            allowed.append(user.branch_id)

        # ID ni integerga o'girib tekshiramiz (xavfsizlik uchun)
        try:
            valid_requested_id = int(requested_branch_id) if requested_branch_id else None
        except (ValueError, TypeError):
            valid_requested_id = None

        if valid_requested_id and valid_requested_id in allowed:
            serializer.save(branch_id=valid_requested_id)
        else:
            # Agar ruxsati yo'q filialni yuborgan bo'lsa yoki yubormagan bo'lsa
            # o'zining asosiy filialiga biriktiriladi
            serializer.save(branch_id=user.branch_id)

    from drf_spectacular.utils import extend_schema
    @extend_schema(responses={200: UsersListSerializer(many=True)})
    @action(detail=False, methods=['get'], url_path='admins')
    def list_admins(self, request):
        # Super admin va adminlar ko'ra oladi
        branch_id = request.query_params.get('branch_id')
        
        if request.user.role == 'super_admin':
            admins = UserModel.objects.filter(role='admin').select_related('branch')
            if branch_id:
                admins = admins.filter(Q(branch_id=branch_id) | Q(branch_accesses__branch_id=branch_id)).distinct()
        elif request.user.role == 'admin':
            # Admin faqat o'zi ruxsatga ega filiallardagi adminlarni ko'radi
            allowed_branches = []
            if request.user.branch_id:
                allowed_branches.append(request.user.branch_id)
            allowed_branches.extend(
                request.user.branch_accesses.values_list('branch_id', flat=True)
            )
            admins = UserModel.objects.filter(
                Q(role='admin') & 
                (Q(branch_id__in=allowed_branches) | Q(branch_accesses__branch_id__in=allowed_branches))
            ).select_related('branch').distinct()
            if branch_id:
                admins = admins.filter(Q(branch_id=branch_id) | Q(branch_accesses__branch_id=branch_id)).distinct()
        else:
            return Response({"detail": "Faqat Super Admin yoki Admin ko'ra oladi."}, status=403)
        serializer = UsersListSerializer(admins, many=True)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        if self.request.user.role != 'super_admin':
            raise PermissionDenied("Faqat Super Admin foydalanuvchilarni o'chira oladi.")
        reason = self.request.query_params.get('reason', "Admin tomonidan o'chirildi")
        from archivebase.services import send_to_archive
        send_to_archive(instance, request_user=self.request.user, reason=reason)

    @action(detail=True, methods=['post'], url_path='remove-from-branch')
    def remove_from_branch(self, request, pk=None):
        """
        Mentorni asosiy filialidan o'chirish.
        Faqat super_admin va admin uchun ruxsat etilgan.
        Mentor branch = null bo'ladi (filialdan ajratiladi).
        """
        user = request.user
        if user.role not in ['super_admin', 'admin']:
            return Response(
                {"detail": "Bu amal uchun ruxsatingiz yo'q."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            target_user = self.get_object()
        except Exception:
            return Response({"detail": "Foydalanuvchi topilmadi."}, status=status.HTTP_404_NOT_FOUND)

        if target_user.role == 'super_admin':
            return Response(
                {"detail": "Super adminni filialdan olib tashlash mumkin emas."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Admin uchun: faqat o'zi ruxsatga ega filiallardan olib tashlashi mumkin
        if user.role == 'admin':
            allowed = []
            if user.branch_id:
                allowed.append(user.branch_id)
            allowed.extend(user.branch_accesses.values_list('branch_id', flat=True))
            if target_user.branch_id not in allowed:
                return Response(
                    {"detail": "Siz ushbu filialga ruxsatingiz yo'q."},
                    status=status.HTTP_403_FORBIDDEN
                )

        old_branch_name = target_user.branch.name if target_user.branch else "Noma'lum"
        target_user.branch = None
        target_user.save(update_fields=['branch'])

        return Response(
            {"detail": f"{target_user.get_full_name() or target_user.username} '{old_branch_name}' filialidan muvaffaqiyatli olib tashlandi."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='remove-branch-access')
    def remove_branch_access(self, request, pk=None):
        """
        Mentordan qo'shilgan (BranchAccess) filialni o'chirish.
        """
        user = request.user
        if user.role not in ['super_admin', 'admin']:
            return Response(
                {"detail": "Bu amal uchun ruxsatingiz yo'q."},
                status=status.HTTP_403_FORBIDDEN
            )

        branch_id = request.data.get('branch_id')
        if not branch_id:
            return Response({"detail": "branch_id kiritilishi shart."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_user = self.get_object()
        except Exception:
            return Response({"detail": "Foydalanuvchi topilmadi."}, status=status.HTTP_404_NOT_FOUND)

        # Admin ruxsatlarini tekshirish
        if user.role == 'admin':
            allowed = []
            if user.branch_id:
                allowed.append(user.branch_id)
            allowed.extend(user.branch_accesses.values_list('branch_id', flat=True))
            if int(branch_id) not in allowed:
                return Response(
                    {"detail": "Siz ushbu filialga ruxsatingiz yo'q."},
                    status=status.HTTP_403_FORBIDDEN
                )

        try:
            from .models import BranchAccess
            access = BranchAccess.objects.get(user=target_user, branch_id=branch_id)
            access.delete()
            return Response({"detail": "Qo'shilgan filialdan muvaffaqiyatli o'chirildi."}, status=status.HTTP_200_OK)
        except BranchAccess.DoesNotExist:
            return Response({"detail": "Bunday filial ruxsati topilmadi."}, status=status.HTTP_404_NOT_FOUND)

class UsersListView(ListAPIView):
    """Mentorlar ro'yxatini olish uchun (BranchAccess inobatga olingan)"""
    serializer_class = UsersListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserModel.objects.none()
        user = self.request.user
        
        if user.role == 'super_admin':
            return UserModel.objects.select_related('branch').all()

        allowed_branches = []
        if user.branch_id: allowed_branches.append(user.branch_id)
        allowed_branches.extend(user.branch_accesses.values_list('branch_id', flat=True))

        # BranchAccess orqali ko'chirilgan mentorlarni ham ko'rish
        return UserModel.objects.filter(
            role='mentor',
        ).filter(
            Q(branch_id__in=allowed_branches) | Q(branch_accesses__branch_id__in=allowed_branches)
        ).select_related('branch').distinct()

class CurrentUserView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CurrentUserSerializer

    def get_object(self):
        return self.request.user
from .permissions import IsSuperAdmin, IsSuperAdminOrAdmin

class BranchAccessViewSet(ModelViewSet):
    queryset = BranchAccess.objects.all().select_related('user', 'branch', 'granted_by')
    serializer_class = BranchAccessSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrAdmin]

    def get_queryset(self):
        """
        Agar user_id parametri berilgan bo'lsa, shu xodimning barcha filiallarini qaytaradi.
        Bu profilda xodimning qaysi filiallarda ishlashini ko'rsatish uchun kerak.
        Admin uchun: faqat o'zi ruxsatga ega bo'lgan filiallardagi BranchAccess yozuvlarini ko'radi.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admin uchun: faqat o'ziga ruxsat berilgan filiallardagi yozuvlarni qaytaramiz
        if user.role == 'admin':
            allowed_branches = []
            if user.branch_id:
                allowed_branches.append(user.branch_id)
            allowed_branches.extend(
                user.branch_accesses.values_list('branch_id', flat=True)
            )
            queryset = queryset.filter(
                Q(branch_id__in=allowed_branches) | Q(user__branch_id__in=allowed_branches)
            )

        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset

    def _get_admin_allowed_branch_ids(self, user):
        """Admin ruxsatga ega bo'lgan filial ID'larini qaytaradi."""
        allowed = []
        if user.branch_id:
            allowed.append(user.branch_id)
        allowed.extend(user.branch_accesses.values_list('branch_id', flat=True))
        return list(set(allowed))

    def _check_admin_transfer_allowed(self, user, validated_data):
        """
        Admin uchun transfer cheklovlarini tekshiradi:
        - Faqat mentorlarni transfer qilishi mumkin (adminlarni emas)
        - Faqat o'zi ruxsatga ega bo'lgan filiallar orasida transfer qilishi mumkin
        """
        target_user_id = validated_data.get('user_id')
        target_branch = validated_data.get('branch_id')  # Branch object

        # Admin faqat mentorlarni transfer qilishi mumkin
        try:
            target_user = UserModel.objects.get(id=target_user_id)
        except UserModel.DoesNotExist:
            raise PermissionDenied("Ko'rsatilgan foydalanuvchi topilmadi.")

        if target_user.role != 'mentor':
            raise PermissionDenied("Admin faqat mentorlarni boshqa filialga o'tkaza oladi.")

        allowed_branch_ids = self._get_admin_allowed_branch_ids(user)

        # Target user ning hozirgi filiali admin ruxsatlarida bo'lishi kerak
        if target_user.branch_id and target_user.branch_id not in allowed_branch_ids:
            raise PermissionDenied("Siz ushbu mentorning hozirgi filialiga ruxsatingiz yo'q.")

        # Yangi filial ham admin ruxsatlarida bo'lishi kerak
        target_branch_id = target_branch.id if hasattr(target_branch, 'id') else target_branch
        if target_branch_id not in allowed_branch_ids:
            raise PermissionDenied("Siz ko'rsatilgan yangi filialga ruxsatingiz yo'q.")

    def perform_create(self, serializer):
        user = self.request.user

        if user.role == 'admin':
            # Admin uchun qo'shimcha cheklovlar
            self._check_admin_transfer_allowed(user, serializer.validated_data)
        # Super admin uchun cheklov yo'q (oldingi mantiq)
        
        # Biriktirilayotgan user 'mentor' yoki 'admin' ekanligini tekshirish
        target_user = serializer.validated_data.get('user')
        if target_user and target_user.role not in ['mentor', 'admin']:
            raise ValidationError("Branch faqat mentor yoki adminlarga biriktirilishi mumkin.")

        serializer.save(granted_by=self.request.user)

    def check_super_admin(self):
        if self.request.user.role != 'super_admin':
            raise PermissionDenied("Faqat super_admin uchun ruxsat etilgan.")

    def _check_admin_or_super_admin(self):
        """Super admin yoki admin rolini tekshiradi."""
        user = self.request.user
        if user.role in ['super_admin', 'admin']:
            return
        raise PermissionDenied("Bu amal uchun ruxsatingiz yo'q.")

    def perform_update(self, serializer):
        self._check_admin_or_super_admin()
        
        # Admin uchun qo'shimcha cheklovlar
        if self.request.user.role == 'admin':
            self._check_admin_transfer_allowed(self.request.user, serializer.validated_data)

        target_user = serializer.validated_data.get('user')
        if target_user and target_user.role not in ['mentor', 'admin']:
            raise ValidationError("Faqat mentor yoki adminlarga branch biriktirish mumkin.")
            
        serializer.save()

    def perform_destroy(self, instance):
        """
        Xodimni filialdan olib tashlash.
        Muhim: Asosiy filialdan (user.branch) olib tashlashga ruxsat bermaymiz.
        """
        self._check_admin_or_super_admin()
        
        # Admin uchun: faqat o'zi ruxsatga ega filiallardan olib tashlashi mumkin
        user = self.request.user
        if user.role == 'admin':
            allowed_branch_ids = self._get_admin_allowed_branch_ids(user)
            if instance.branch_id not in allowed_branch_ids:
                raise PermissionDenied("Siz ushbu filialdan olib tashlash huquqiga ega emassiz.")
            # Admin faqat mentorlarni olib tashlashi mumkin
            if instance.user.role != 'mentor':
                raise PermissionDenied("Admin faqat mentorlarni filialdan olib tashlay oladi.")
        
        # Xavfsizlik: Asosiy filialdan olib tashlashni oldini olish
        if instance.user.branch and instance.branch.id == instance.user.branch.id:
            raise ValidationError({
                "detail": "Xodimni asosiy filialidan olib tashlash mumkin emas. Avval boshqa filialga asosiy filial sifatida transfer qiling."
            })
        
        instance.delete()

    
class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class CRMLoginView(APIView):
    """
    CRM tizimi uchun alohida login endpoint.
    Faqat admin, mentor va super_admin rollari kira oladi.
    Student rollari uchun kirish qat'iyan taqiqlanadi.
    Username va parol asosida ishlaydi (Google OAuth yo'q).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username_or_email = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()

        if not username_or_email or not password:
            return Response(
                {"detail": "Username va parol majburiy maydonlar."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Username yoki email orqali foydalanuvchini topamiz
        from django.db.models import Q
        user = User.objects.filter(
            Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email)
        ).first()

        if not user:
            return Response(
                {"detail": "Foydalanuvchi topilmadi. Username yoki emailni tekshiring."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Faqat CRM rollari kira oladi
        crm_roles = ['admin', 'mentor', 'super_admin']
        if user.role not in crm_roles:
            return Response(
                {"detail": "Bu tizimga kirish uchun sizda CRM (admin/mentor) roli bo'lishi shart. Talabalar uchun bu kirish eshigi mavjud emas."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Parolni tekshirish
        from django.contrib.auth import authenticate
        auth_user = authenticate(request, username=user.username, password=password)
        if auth_user is None:
            return Response(
                {"detail": "Parol noto'g'ri kiritildi."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not auth_user.is_active:
            return Response(
                {"detail": "Hisobingiz faol emas. Administrator bilan bog'laning."},
                status=status.HTTP_403_FORBIDDEN
            )

        # JWT token yaratamiz
        token = LoginSerializer.get_token(auth_user)

        return Response({
            "detail": "CRM tizimiga muvaffaqiyatli kirdingiz.",
            "access": str(token.access_token),
            "refresh": str(token),
            "user": {
                "id": auth_user.id,
                "username": auth_user.username,
                "first_name": auth_user.first_name,
                "last_name": auth_user.last_name,
                "role": auth_user.role,
                "branch_id": auth_user.branch.id if auth_user.branch else None,
                "branch_name": auth_user.branch.name if auth_user.branch else None,
            }
        }, status=status.HTTP_200_OK)


class PublicRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = LoginSerializer.get_token(user)
            return Response({
                "detail": "Muvaffaqiyatli ro'yxatdan o'tdingiz.",
                "access": str(token.access_token),
                "refresh": str(token),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                    "subject": user.subject,
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            credential = request.data.get('credential') or request.data.get('token')
            if not credential:
                return Response(
                    {"detail": "Google credential (ID token) taqdim etilmadi. Iltimos, Google orqali qayta urining."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 1. Google OAuth2 tokeninfo orqali token haqiqiyligini tekshirish
            try:
                resp = requests.get(
                    f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}",
                    timeout=8
                )
            except Exception as net_err:
                return Response(
                    {"detail": "Google serveriga ulanishda tarmoq xatoligi yuz berdi. Iltimos, birozdan so'ng qayta urining."},
                    status=status.HTTP_502_BAD_GATEWAY
                )

            if resp.status_code != 200:
                return Response(
                    {"detail": "Google tokeni yaroqsiz yoki muddati tugagan."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            google_data = resp.json()
            email = google_data.get('email')
            email_verified = google_data.get('email_verified')

            if not email or (email_verified is not True and str(email_verified).lower() != 'true'):
                return Response(
                    {"detail": "Google akkauntingiz emaili tasdiqlanmagan yoki mavjud emas."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Agar backend sozlamalarida GOOGLE_CLIENT_ID ko'rsatilgan bo'lsa, aud ni tekshiramiz
            from django.conf import settings
            expected_client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '').strip()
            if expected_client_id:
                token_aud = google_data.get('aud', '')
                if token_aud != expected_client_id:
                    return Response(
                        {"detail": "Google token aud (Client ID) mos kelmadi."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            email = email.strip().lower()
            first_name = google_data.get('given_name') or google_data.get('name') or ''
            last_name = google_data.get('family_name') or ''

            # Ochiq Google registratsiyasi orqali faqat talabalar hisob ochishi mumkin (mentorlar CRM ichida qo'shiladi)
            role = 'student'

            # 2. Foydalanuvchini email orqali bazadan qidirish
            user = UserModel.objects.filter(email__iexact=email).first()
            is_new = False

            if not user:
                # Yangi foydalanuvchi faqat student yoki mentor bo'lib ro'yxatdan o'tishi mumkin
                base_username = email.split('@')[0].replace('.', '_').replace('-', '_')
                username = base_username
                counter = 1
                while UserModel.objects.filter(username__iexact=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1

                user = UserModel.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name or username,
                    last_name=last_name or '',
                    role=role,
                    password=get_random_string(32)
                )
                user.is_email_verified = True
                user.save(update_fields=['is_email_verified'])
                is_new = True
            else:
                # XAVFSIZLIK: Agar akkaunt super_admin yoki admin bo'lsa,
                # ochiq Google OAuth orqali kirish qat'iyan taqiqlanadi!
                if user.role in ['super_admin', 'admin'] or user.is_superuser or user.is_staff:
                    return Response({
                        "detail": "Xavfsizlik nuqtai nazaridan, ma'muriy (Admin / Super Admin) akkauntlar faqat maxsus login va parol orqali tizimga kirishi shart!"
                    }, status=status.HTTP_403_FORBIDDEN)

                # Oddiy foydalanuvchining roli o'zgartirilmaydi!
                updated_fields = []
                if first_name and not user.first_name:
                    user.first_name = first_name
                    updated_fields.append('first_name')
                if last_name and not user.last_name:
                    user.last_name = last_name
                    updated_fields.append('last_name')
                if not user.is_email_verified:
                    user.is_email_verified = True
                    updated_fields.append('is_email_verified')
                if updated_fields:
                    user.save(update_fields=updated_fields)

            token = LoginSerializer.get_token(user)

            return Response({
                "detail": "Google orqali muvaffaqiyatli kirdingiz.",
                "access": str(token.access_token),
                "refresh": str(token),
                "is_new_user": is_new,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role,
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": f"Google orqali kirishda xatolik yuz berdi: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class MentorLabTokenView(APIView):
    """
    CRM dan laboratoriyaga (Mentor Dashboard) avtomatik parolsiz kirish uchun token generatsiyasi.
    
    Faqat admin yoki super_admin bu endpointni chaqira oladi.
    Mentor uchun JWT access + refresh token yaratib qaytaradi.
    Mentor parolini bilmasdan ham o'z dashboard labaratoriyasiga kira oladi.
    
    POST /api/mentor-lab-token/{user_id}/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        requester = request.user

        # Faqat admin va super_admin chaqira oladi
        if requester.role not in ['admin', 'super_admin']:
            return Response(
                {"detail": "Bu amal faqat admin yoki super_admin uchun ruxsat etilgan."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Mentor foydalanuvchini topish
        try:
            mentor = User.objects.get(id=user_id, role='mentor')
        except User.DoesNotExist:
            return Response(
                {"detail": "Mentor topilmadi yoki bu foydalanuvchi mentor emas."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Admin faqat o'z filialidagi mentorlarni chaqira oladi
        if requester.role == 'admin':
            allowed_branches = list(requester.branch_accesses.values_list('branch_id', flat=True))
            if requester.branch_id:
                allowed_branches.append(requester.branch_id)

            # Mentorning filialini tekshiramiz
            mentor_branches = list(mentor.branch_accesses.values_list('branch_id', flat=True))
            if mentor.branch_id:
                mentor_branches.append(mentor.branch_id)

            # Umumiy filial bo'lishi kerak
            if not set(allowed_branches) & set(mentor_branches):
                return Response(
                    {"detail": "Siz bu mentorning filialida admin emassiz."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Mentor faolligini tekshirish
        if not mentor.is_active:
            return Response(
                {"detail": "Bu mentor hisobi faol emas. Avval faollashtiring."},
                status=status.HTTP_403_FORBIDDEN
            )

        # JWT token generatsiya qilish
        token = LoginSerializer.get_token(mentor)

        return Response({
            "detail": f"{mentor.get_full_name() or mentor.username} uchun laboratoriya tokeni yaratildi.",
            "access": str(token.access_token),
            "refresh": str(token),
            "mentor": {
                "id": mentor.id,
                "username": mentor.username,
                "first_name": mentor.first_name,
                "last_name": mentor.last_name,
                "role": mentor.role,
                "branch_id": mentor.branch.id if mentor.branch else None,
                "branch_name": mentor.branch.name if mentor.branch else None,
            }
        }, status=status.HTTP_200_OK)
