from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from patient.models import PatientProfile
from doctor.models import DoctorProfile

User = get_user_model()

class PatientRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)
    date_of_birth = serializers.DateField(write_only=True)
    gender = serializers.CharField(write_only=True)
    address = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name', 'phone', 'date_of_birth', 'gender', 'address')

    def create(self, validated_data):
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
        
        # Create Profile
        PatientProfile.objects.create(user=user, **profile_data)
        return user

class DoctorRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    specialization = serializers.CharField(write_only=True)
    license_number = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'specialization', 'license_number', 'phone')

    def create(self, validated_data):
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
        
        DoctorProfile.objects.create(user=user, **profile_data)
        return user
