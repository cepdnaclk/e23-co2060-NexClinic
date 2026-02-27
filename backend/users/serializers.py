from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from patient.models import PatientProfile
from doctor.models import DoctorProfile

User = get_user_model()

from .models import PendingUser
from .utils import generate_otp, send_otp_email
from django.contrib.auth.hashers import make_password

class PatientRegistrationSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)
    date_of_birth = serializers.DateField(write_only=True)
    gender = serializers.CharField(write_only=True)
    address = serializers.CharField(write_only=True)
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

    class Meta:
        model = User
        fields = ('full_name', 'phone', 'date_of_birth', 'gender', 'address', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        
        # Check if PendingUser already exists for this email
        PendingUser.objects.filter(email=email).delete()

        # Extract profile data
        profile_data = {
            'full_name': validated_data.pop('full_name'),
            'phone': validated_data.pop('phone'),
            'date_of_birth': str(validated_data.pop('date_of_birth')), # Convert to string for JSON serialization
            'gender': validated_data.pop('gender'),
            'address': validated_data.pop('address'),
        }
        
        # Generate and Send OTP
        otp_code = generate_otp()
        
        # Create PendingUser
        PendingUser.objects.create(
            email=email,
            password=make_password(password),
            role='PATIENT',
            profile_data=profile_data,
            otp_code=otp_code,
            expires_at=timezone.now() + timezone.timedelta(minutes=10)
        )
        
        send_otp_email(email, otp_code)

        return {'email': email} # Return data containing email for response serialization

class DoctorRegistrationSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    preferred_name = serializers.CharField(write_only=True)
    nic_number = serializers.CharField(write_only=True)
    license_number = serializers.CharField(write_only=True)
    specialization = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)
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

    class Meta:
        model = User
        fields = ('full_name', 'preferred_name', 'nic_number', 'license_number', 'specialization',  'phone', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        email = validated_data.pop('email')
        password = validated_data.pop('password')

        # Check if PendingUser already exists for this email
        PendingUser.objects.filter(email=email).delete()

        profile_data = {
            'specialization': validated_data.pop('specialization'),
            'license_number': validated_data.pop('license_number'),
            'phone': validated_data.pop('phone'),
            'full_name': validated_data.pop('full_name'),
            'preferred_name': validated_data.pop('preferred_name'),
            'nic_number': validated_data.pop('nic_number'),
        }
        
        # Generate and Send OTP
        otp_code = generate_otp()
        
        # Create PendingUser
        PendingUser.objects.create(
            email=email,
            password=make_password(password),
            role='DOCTOR',
            profile_data=profile_data,
            otp_code=otp_code,
            expires_at=timezone.now() + timezone.timedelta(minutes=10)
        )
        
        send_otp_email(email, otp_code)

        return {'email': email}
