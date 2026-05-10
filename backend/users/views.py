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
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_str, force_bytes
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
GENERIC_PASSWORD_RESET_MESSAGE = 'If an account with that email exists, a password reset link has been sent.'


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def _mask_email(email):
    if not email or '@' not in email:
        return 'unknown'
    local, domain = email.split('@', 1)
    if not local:
        return f'***@{domain}'
    if len(local) == 1:
        return f'{local}***@{domain}'
    return f'{local[0]}***{local[-1]}@{domain}'

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
        try:
            send_otp_email(pending_user.email, otp_code)
        except Exception:
            return Response(
                {'error': 'Unable to send OTP email at the moment. Please try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        pending_user.save(update_fields=['otp_code', 'otp_code_hash', 'otp_last_sent_at', 'expires_at'])

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

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_password_reset_request'

    def post(self, request):
        #  If the request data is not a dict, return an error response
        if not isinstance(request.data, dict):
            logger.warning('password_reset_request.invalid_payload ip=%s', _get_client_ip(request))
            return Response({'error': 'Invalid data format. Expected JSON object.'}, status=status.HTTP_400_BAD_REQUEST)

        email = request.data.get('email')
        if not email:
            logger.warning('password_reset_request.missing_email ip=%s', _get_client_ip(request))
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email.strip(), is_active=True).first()
        masked_email = _mask_email(email.strip())
        client_ip = _get_client_ip(request)

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            role = str(getattr(user, 'role', 'PATIENT') or 'PATIENT').lower()

            frontend_base_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000').rstrip('/')
            reset_link = f"{frontend_base_url}/reset-password?uid={uid}&token={token}&role={role}"

            subject = 'Reset your NexClinic password'
            message = (
                'We received a request to reset your password.\n\n'
                f'Click this link to set a new password:\n{reset_link}\n\n'
                'If you did not request this, you can safely ignore this email.'
            )

            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                logger.info(
                    'password_reset_request.email_sent user_id=%s role=%s email=%s ip=%s',
                    user.pk,
                    role,
                    masked_email,
                    client_ip,
                )
            except Exception:
                # Keep response non-disclosing even if mail delivery fails.
                logger.exception(
                    'password_reset_request.email_send_failed user_id=%s role=%s email=%s ip=%s',
                    user.pk,
                    role,
                    masked_email,
                    client_ip,
                )
        else:
            logger.info('password_reset_request.unknown_email email=%s ip=%s', masked_email, client_ip)

        return Response({'message': GENERIC_PASSWORD_RESET_MESSAGE}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth_password_reset_confirm'

    def post(self, request):
        if not isinstance(request.data, dict):
            logger.warning('password_reset_confirm.invalid_payload ip=%s', _get_client_ip(request))
            return Response({'error': 'Invalid data format. Expected JSON object.'}, status=status.HTTP_400_BAD_REQUEST)

        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        client_ip = _get_client_ip(request)

        if not uid or not token or not new_password:
            logger.warning('password_reset_confirm.missing_fields ip=%s', client_ip)
            return Response({'error': 'uid, token and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, UnicodeDecodeError, User.DoesNotExist):
            logger.warning('password_reset_confirm.invalid_uid_or_user uid=%s ip=%s', uid, client_ip)
            return Response(
                {'error': 'Invalid or expired reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            logger.warning('password_reset_confirm.invalid_token user_id=%s role=%s ip=%s', user.pk, user.role, client_ip)
            return Response(
                {'error': 'Invalid or expired reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=user)
        except ValidationError as exc:
            logger.warning('password_reset_confirm.password_validation_failed user_id=%s role=%s ip=%s', user.pk, user.role, client_ip)
            return Response({'error': ' '.join(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        logger.info('password_reset_confirm.success user_id=%s role=%s ip=%s', user.pk, user.role, client_ip)

        return Response(
            {
                'message': 'Password reset successful.',
                'role': user.role,
            },
            status=status.HTTP_200_OK,
        )