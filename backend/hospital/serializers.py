from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.serializers import (
    SL_NIC_REGEX,
    SLMC_REG_NUMBER_REGEX,
    _normalize_sl_phone,
    DOCTOR_SPECIALIZATION_LOOKUP,
    GENDER_LOOKUP
)
import re
from .models import ActivityLog, Hospital, HospitalAdmin, HospitalAdminProfile

User = get_user_model()


class HospitalAdminProfileSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    hospitals = serializers.SerializerMethodField()

    class Meta:
        model = HospitalAdminProfile
        fields = (
            'email',
            'full_name',
            'date_of_birth',
            'gender',
            'nic_number',
            'phone',
            'address',
            'employee_id',
            'designation',
            'date_of_joining',
            'is_verified',
            'hospitals',
        )
        read_only_fields = fields

    def get_email(self, obj):
        return obj.user.email

    def get_hospitals(self, obj):
        admin_roles = HospitalAdmin.objects.filter(user=obj.user, is_active=True).select_related('hospital')
        return [{'id': role.hospital_id, 'name': role.hospital.name} for role in admin_roles]


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = (
            'id',
            'name',
            'address',
            'contact_numbers',
            'email',
            'is_active',
        )
        read_only_fields = fields

class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ('id','user_email','hospital_id','action','model_name','object_id','data','created_at')

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None


class HospitalAdminCreateDoctorSerializer(serializers.Serializer):
    email = serializers.EmailField(
        required=True,
    )
    full_name = serializers.CharField(required=True)
    preferred_name = serializers.CharField(required=True)
    nic_number = serializers.CharField(required=True)
    gender = serializers.CharField(required=False, default='Other')
    license_number = serializers.CharField(required=True)
    specialization = serializers.CharField(required=True)
    phone = serializers.CharField(required=True)

    def validate_email(self, value):
        normalized = User.objects.normalize_email(value).lower()
        existing_user = User.objects.filter(email__iexact=normalized).first()
        if not existing_user:
            return normalized

        # A deleted DoctorProfile can leave its CustomUser login behind. Allow
        # that orphaned doctor login to be rebuilt, but never reset an active
        # account (or an account belonging to another role) through this API.
        if existing_user.role == User.Role.DOCTOR and not hasattr(existing_user, 'doctor_profile'):
            return existing_user.email

        raise serializers.ValidationError(
            'An active account with this email already exists. Use Forgot password '
            'or add the existing doctor to the hospital instead.'
        )

    def validate_full_name(self, value):
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError('Full name must be at least 2 characters long.')
        return cleaned

    def validate_preferred_name(self, value):
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError('Preferred name must be at least 2 characters long.')
        return cleaned

    def validate_nic_number(self, value):
        cleaned = (value or '').strip().upper()
        if not SL_NIC_REGEX.match(cleaned):
            raise serializers.ValidationError('Enter a valid Sri Lankan NIC number.')
        return cleaned

    def validate_gender(self, value):
        normalized = GENDER_LOOKUP.get((value or '').strip().lower())
        if not normalized:
            raise serializers.ValidationError('Gender must be Male, Female, or Other.')
        return normalized

    def validate_license_number(self, value):
        cleaned = re.sub(r'\s+', '', (value or '').strip().upper())
        if not SLMC_REG_NUMBER_REGEX.match(cleaned):
            raise serializers.ValidationError(
                'Enter a valid SLMC registration number (e.g., 12345, MB/1234, or PMC/5678).'
            )
        return cleaned

    def validate_phone(self, value):
        return _normalize_sl_phone(value)

    def validate_specialization(self, value):
        canonical = DOCTOR_SPECIALIZATION_LOOKUP.get(value.strip().lower())
        if not canonical:
            raise serializers.ValidationError('Please choose a valid specialization.')
        return canonical

