from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from users.serializers import (
    SL_NIC_REGEX,
    SLMC_REG_NUMBER_REGEX,
    _normalize_sl_phone,
    DOCTOR_SPECIALIZATION_LOOKUP,
    GENDER_LOOKUP
)
import re
from .models import ActivityLog, Hospital

User = get_user_model()


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
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'}
    )
    full_name = serializers.CharField(required=True)
    preferred_name = serializers.CharField(required=True)
    nic_number = serializers.CharField(required=True)
    gender = serializers.CharField(required=False, default='Other')
    license_number = serializers.CharField(required=True)
    specialization = serializers.CharField(required=True)
    phone = serializers.CharField(required=True)

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

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

