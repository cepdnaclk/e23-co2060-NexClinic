from rest_framework import generics
from rest_framework.permissions import AllowAny
from .serializers import PatientRegistrationSerializer, DoctorRegistrationSerializer

class PatientRegisterView(generics.CreateAPIView):
    serializer_class = PatientRegistrationSerializer
    permission_classes = [AllowAny]

class DoctorRegisterView(generics.CreateAPIView):
    serializer_class = DoctorRegistrationSerializer
    permission_classes = [AllowAny]

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import PendingUser
from .utils import generate_otp, send_otp_email
from django.utils import timezone
from django.db import transaction
from patient.models import PatientProfile
from doctor.models import DoctorProfile

User = get_user_model()

class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

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
            if User.objects.filter(email=email).exists():
                return Response({'error': 'User is already verified. Please log in.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': 'Registration not found. Please register first.'}, status=status.HTTP_400_BAD_REQUEST)

        if pending_user.otp_code != otp_code:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        if pending_user.expires_at < timezone.now():
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)

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
            
            pending_user.delete()

        return Response({'message': 'Account verified successfully'}, status=status.HTTP_200_OK)

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

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
             if User.objects.filter(email=email).exists():
                 return Response({'message': 'Account is already active'}, status=status.HTTP_200_OK)
             return Response({'error': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate new OTP
        otp_code = generate_otp()
        
        pending_user.otp_code = otp_code
        pending_user.expires_at = timezone.now() + timezone.timedelta(minutes=10)
        pending_user.save()
        
        send_otp_email(pending_user.email, otp_code)

        return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)
