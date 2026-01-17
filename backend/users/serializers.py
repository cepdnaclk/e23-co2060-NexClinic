from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from patient.models import PatientProfile
from doctor.models import DoctorProfile

User = get_user_model()

from .models import UserOTP
from .utils import generate_otp, send_otp_email

class PatientRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'}
    )
    full_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)
    date_of_birth = serializers.DateField(write_only=True)
    gender = serializers.CharField(write_only=True)
    address = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'full_name', 'phone', 'date_of_birth', 'gender', 'address')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        # Extract profile data
        profile_data = {
            'full_name': validated_data.pop('full_name'),
            'phone': validated_data.pop('phone'),
            'date_of_birth': validated_data.pop('date_of_birth'),
            'gender': validated_data.pop('gender'),
            'address': validated_data.pop('address'),
        }
        
        # Create User
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role='PATIENT'
        )
        user.is_active = False # Deactivate until OTP verification
        user.save()
        
        # Create Profile
        PatientProfile.objects.create(user=user, **profile_data)

        # Generate and Send OTP
        otp_code = generate_otp()
        UserOTP.objects.create(user=user, otp_code=otp_code, expires_at=timezone.now() + timezone.timedelta(minutes=10))
        send_otp_email(user.email, otp_code)

        return user

class DoctorRegistrationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'}
    )
    specialization = serializers.CharField(write_only=True)
    license_number = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'specialization', 'license_number', 'phone')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        profile_data = {
            'specialization': validated_data.pop('specialization'),
            'license_number': validated_data.pop('license_number'),
            'phone': validated_data.pop('phone'),
        }
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role='DOCTOR'
        )
        user.is_active = False
        user.save()
        
        DoctorProfile.objects.create(user=user, **profile_data)

        # Generate and Send OTP
        otp_code = generate_otp()
        UserOTP.objects.create(user=user, otp_code=otp_code, expires_at=timezone.now() + timezone.timedelta(minutes=10))
        send_otp_email(user.email, otp_code)

        return user
