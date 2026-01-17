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
from .models import UserOTP
from .utils import generate_otp, send_otp_email
from django.utils import timezone

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

        user = get_object_or_404(User, email=email)
        
        try:
            user_otp = UserOTP.objects.get(user=user)
        except UserOTP.DoesNotExist:
            return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)

        if user_otp.otp_code != otp_code:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        if user_otp.expires_at < timezone.now():
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)

        # Activate user
        user.is_active = True
        user.save()
        user_otp.delete() # Delete OTP after successful verification

        return Response({'message': 'Account verified successfully'}, status=status.HTTP_200_OK)

class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        if not isinstance(request.data, dict):
             return Response({'error': 'Invalid data format. Expected a JSON object.'}, status=status.HTTP_400_BAD_REQUEST)
             
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, email=email)

        if user.is_active:
             return Response({'message': 'Account is already active'}, status=status.HTTP_200_OK)

        # Generate new OTP
        otp_code = generate_otp()
        
        # Update or Create UserOTP
        UserOTP.objects.update_or_create(
            user=user,
            defaults={'otp_code': otp_code, 'expires_at': timezone.now() + timezone.timedelta(minutes=10)}
        )
        
        send_otp_email(user.email, otp_code)

        return Response({'message': 'OTP sent successfully'}, status=status.HTTP_200_OK)
