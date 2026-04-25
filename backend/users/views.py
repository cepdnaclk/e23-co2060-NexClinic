from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from .serializers import (
    PatientRegistrationSerializer,
    DoctorRegistrationSerializer,
    PatientTokenObtainPairSerializer,
    DoctorTokenObtainPairSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

class PatientRegisterView(generics.CreateAPIView):
    serializer_class = PatientRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_register'

class DoctorRegisterView(generics.CreateAPIView):
    serializer_class = DoctorRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_register'


class PatientLoginView(TokenObtainPairView):
    serializer_class = PatientTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'


class DoctorLoginView(TokenObtainPairView):
    serializer_class = DoctorTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_login'

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import PendingUser
from .utils import generate_otp, hash_otp, send_otp_email, send_admin_notification_email, verify_otp


from django.utils import timezone
from django.db import transaction
from patient.models import PatientProfile
from doctor.models import DoctorProfile

User = get_user_model()
logger = logging.getLogger(__name__)

OTP_MAX_FAILED_ATTEMPTS = getattr(settings, 'OTP_MAX_FAILED_ATTEMPTS', 5)
OTP_LOCKOUT_MINUTES = getattr(settings, 'OTP_LOCKOUT_MINUTES', 15)
OTP_RESEND_COOLDOWN_SECONDS = getattr(settings, 'OTP_RESEND_COOLDOWN_SECONDS', 60)
GENERIC_VERIFY_ERROR = 'Invalid or expired OTP.'
GENERIC_RESEND_MESSAGE = 'If the account is eligible, a new OTP has been sent.'

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_verify_otp'

    def post(self, request):
        if not isinstance(request.data, dict):
             return Response({'error': 'Invalid data format. Expected a JSON object.'}, status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get('email')
        otp_code = request.data.get('otp')

        if not email or not otp_code:
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pending_user = PendingUser.objects.get(email=email)
        except PendingUser.DoesNotExist:
            return Response({'error': GENERIC_VERIFY_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        if pending_user.otp_locked_until and pending_user.otp_locked_until > timezone.now():
            return Response({'error': 'Too many invalid attempts. Please try again later.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        otp_is_valid = verify_otp(otp_code, pending_user.otp_code_hash)

        if not otp_is_valid:
            pending_user.otp_failed_attempts += 1
            if pending_user.otp_failed_attempts >= OTP_MAX_FAILED_ATTEMPTS:
                pending_user.otp_locked_until = timezone.now() + timezone.timedelta(minutes=OTP_LOCKOUT_MINUTES)
                pending_user.otp_failed_attempts = 0
            pending_user.save(update_fields=['otp_failed_attempts', 'otp_locked_until'])
            return Response({'error': GENERIC_VERIFY_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        if pending_user.expires_at < timezone.now():
            return Response({'error': GENERIC_VERIFY_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        # Atomic transaction to create User and Profile, then delete PendingUser
        with transaction.atomic():
            user = User.objects.create_user(
                email=pending_user.email,
                password=None, # Set password manually below
                role=pending_user.role
            )
            user.password = pending_user.password # Assign hashed password directly
            user.is_active = True
            user.save()

            if pending_user.role == 'PATIENT':
                PatientProfile.objects.create(user=user, **pending_user.profile_data)
            elif pending_user.role == 'DOCTOR':
                DoctorProfile.objects.create(user=user, **pending_user.profile_data)
                doctor_name = pending_user.profile_data.get('preferred_name', 'Doctor')

                def send_doctor_notification():
                    try:
                        send_admin_notification_email(user.email, doctor_name)
                    except Exception:
                        # Avoid failing account verification due to notification email issues.
                        logger.exception('Failed to send admin notification for doctor registration: %s', user.email)

                transaction.on_commit(send_doctor_notification)
            
            pending_user.delete()

        return Response({'message': 'Account verified successfully'}, status=status.HTTP_200_OK)

class ResendOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_resend_otp'

    def post(self, request):
        if not isinstance(request.data, dict):
             return Response({'error': 'Invalid data format. Expected a JSON object.'}, status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Check in PendingUser not User
        try:
            pending_user = PendingUser.objects.get(email=email)
        except PendingUser.DoesNotExist:
             return Response({'message': GENERIC_RESEND_MESSAGE}, status=status.HTTP_200_OK)

        if pending_user.otp_last_sent_at:
            next_allowed_time = pending_user.otp_last_sent_at + timezone.timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
            if next_allowed_time > timezone.now():
                return Response({'error': 'Please wait before requesting another OTP.'}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Generate new OTP
        otp_code = generate_otp()
        
        pending_user.otp_code = ''
        pending_user.otp_code_hash = hash_otp(otp_code)
        pending_user.otp_last_sent_at = timezone.now()
        pending_user.expires_at = timezone.now() + timezone.timedelta(minutes=10)
        pending_user.save(update_fields=['otp_code', 'otp_code_hash', 'otp_last_sent_at', 'expires_at'])
        
        send_otp_email(pending_user.email, otp_code)

        return Response({'message': GENERIC_RESEND_MESSAGE}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh') if isinstance(request.data, dict) else None

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # Token blacklist app may be disabled; logout still succeeds client-side.
                pass

        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
