from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
import re
import logging
from patient.models import PatientProfile
from doctor.models import DoctorProfile
from doctor.constants import DOCTOR_SPECIALIZATIONS
from hospital.models import HospitalAdmin

logger = logging.getLogger(__name__)

User = get_user_model()

from .models import PendingUser
from .utils import generate_otp, hash_otp, send_otp_email
from django.contrib.auth.hashers import make_password

DOCTOR_SPECIALIZATION_LOOKUP = {
    specialization.lower(): specialization for specialization in DOCTOR_SPECIALIZATIONS
}

SL_PHONE_COMPACT_REGEX = re.compile(r'^(?:\+94|0)?7\d{8}$')
SL_NIC_REGEX = re.compile(r'^(?:\d{9}[VvXx]|\d{12})$')
SLMC_REG_NUMBER_REGEX = re.compile(r'^(?:\d{3,10}|[A-Z]{2,10}/\d{3,10})$')
GENDER_LOOKUP = {
    'male': 'Male',
    'female': 'Female',
    'other': 'Other',
}


def _compact_phone(value):
    return re.sub(r'[\s\-]', '', value or '')


def _normalize_sl_phone(value):
    compact = _compact_phone(value)
    if not SL_PHONE_COMPACT_REGEX.match(compact):
        raise serializers.ValidationError('Enter a valid Sri Lankan mobile number.')

    if compact.startswith('0'):
        return f'+94{compact[1:]}'
    if compact.startswith('94'):
        return f'+{compact}'
    return compact


def _validate_dob_range(value):
    today = timezone.localdate()
    oldest_allowed = today - timezone.timedelta(days=120 * 365)

    if value > today:
        raise serializers.ValidationError('Date of birth cannot be in the future.')
    if value < oldest_allowed:
        raise serializers.ValidationError('Enter a valid date of birth.')
    return value

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

    def validate_full_name(self, value):
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError('Full name must be at least 2 characters long.')
        return cleaned

    def validate_phone(self, value):
        return _normalize_sl_phone(value)

    def validate_date_of_birth(self, value):
        return _validate_dob_range(value)

    def validate_gender(self, value):
        normalized = GENDER_LOOKUP.get((value or '').strip().lower())
        if not normalized:
            raise serializers.ValidationError('Gender must be Male, Female, or Other.')
        return normalized

    def validate_address(self, value):
        cleaned = value.strip()
        if len(cleaned) < 5:
            raise serializers.ValidationError('Address must be at least 5 characters long.')
        return cleaned

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
            otp_code='',
            otp_code_hash=hash_otp(otp_code),
            otp_last_sent_at=timezone.now(),
            expires_at=timezone.now() + timezone.timedelta(minutes=10)
        )

        try:
            send_otp_email(email, otp_code)
        except Exception as e:
            logger.error(f'Failed to send OTP email to {email}: {type(e).__name__}: {e}')
            PendingUser.objects.filter(email=email).delete()
            raise serializers.ValidationError({
                'email': 'Unable to send OTP email at the moment. Please try again later.'
            })

        return {'email': email} # Return data containing email for response serialization

class DoctorRegistrationSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    preferred_name = serializers.CharField(write_only=True)
    nic_number = serializers.CharField(write_only=True)
    gender = serializers.CharField(write_only=True, required=False)
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
        fields = ('full_name', 'preferred_name', 'nic_number', 'gender', 'license_number', 'specialization',  'phone', 'email', 'password', 'password2')

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

    def create(self, validated_data):
        validated_data.pop('password2')
        email = validated_data.pop('email')
        password = validated_data.pop('password')

        # Check if PendingUser already exists for this email
        PendingUser.objects.filter(email=email).delete()

        profile_data = {
            'specialization': validated_data.pop('specialization'),
            'gender': validated_data.pop('gender', 'Other'),
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
            otp_code='',
            otp_code_hash=hash_otp(otp_code),
            otp_last_sent_at=timezone.now(),
            expires_at=timezone.now() + timezone.timedelta(minutes=10)
        )

        try:
            send_otp_email(email, otp_code)
        except Exception:
            PendingUser.objects.filter(email=email).delete()
            raise serializers.ValidationError({
                'email': 'Unable to send OTP email at the moment. Please try again later.'
            })

        return {'email': email}


class DoctorTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if getattr(self.user, 'role', None) != 'DOCTOR':
            raise AuthenticationFailed('No doctor account found for this email.')

        data['role'] = getattr(self.user, 'role', '')
        data['email'] = getattr(self.user, 'email', '')
        return data


class PatientTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if getattr(self.user, 'role', None) != 'PATIENT':
            raise AuthenticationFailed('No patient account found for this email.')

        data['role'] = getattr(self.user, 'role', '')
        data['email'] = getattr(self.user, 'email', '')
        return data


class HospitalAdminRegistrationSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    phone = serializers.CharField(write_only=True)
    hospital_id = serializers.IntegerField(write_only=True)
    date_of_birth = serializers.DateField(write_only=True)
    gender = serializers.CharField(write_only=True)
    nic_number = serializers.CharField(write_only=True)
    address = serializers.CharField(write_only=True)
    employee_id = serializers.CharField(write_only=True)
    designation = serializers.CharField(write_only=True)
    date_of_joining = serializers.DateField(write_only=True)
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
        fields = (
            'full_name', 'phone', 'hospital_id', 'date_of_birth', 'gender', 'nic_number',
            'address', 'employee_id', 'designation', 'date_of_joining',
            'email', 'password', 'password2'
        )

    def validate_full_name(self, value):
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError('Full name must be at least 2 characters long.')
        return cleaned

    def validate_phone(self, value):
        return _normalize_sl_phone(value)

    def validate_date_of_birth(self, value):
        return _validate_dob_range(value)

    def validate_gender(self, value):
        normalized = GENDER_LOOKUP.get((value or '').strip().lower())
        if not normalized:
            raise serializers.ValidationError('Gender must be Male, Female, or Other.')
        return normalized

    def validate_nic_number(self, value):
        cleaned = (value or '').strip().upper()
        if not SL_NIC_REGEX.match(cleaned):
            raise serializers.ValidationError('Enter a valid Sri Lankan NIC number.')
        return cleaned

    def validate_address(self, value):
        cleaned = value.strip()
        if len(cleaned) < 5:
            raise serializers.ValidationError('Address must be at least 5 characters long.')
        return cleaned

    def validate_hospital_id(self, value):
        from hospital.models import Hospital
        try:
            Hospital.objects.get(id=value, is_active=True)
        except Hospital.DoesNotExist:
            raise serializers.ValidationError('Invalid or inactive hospital.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        hospital_id = validated_data.pop('hospital_id')

        # Check if PendingUser already exists for this email
        PendingUser.objects.filter(email=email).delete()

        # Extract profile data
        profile_data = {
            'full_name': validated_data.pop('full_name'),
            'phone': validated_data.pop('phone'),
            'hospital_id': hospital_id,
            'date_of_birth': str(validated_data.pop('date_of_birth')),
            'gender': validated_data.pop('gender'),
            'nic_number': validated_data.pop('nic_number'),
            'address': validated_data.pop('address'),
            'employee_id': validated_data.pop('employee_id'),
            'designation': validated_data.pop('designation'),
            'date_of_joining': str(validated_data.pop('date_of_joining')),
        }
        
        # Generate and Send OTP
        otp_code = generate_otp()
        
        # Create PendingUser
        PendingUser.objects.create(
            email=email,
            password=make_password(password),
            role='HOSPITAL_ADMIN',
            profile_data=profile_data,
            otp_code='',
            otp_code_hash=hash_otp(otp_code),
            otp_last_sent_at=timezone.now(),
            expires_at=timezone.now() + timezone.timedelta(minutes=10)
        )

        try:
            send_otp_email(email, otp_code)
        except Exception as e:
            logger.error(f'Failed to send OTP email to {email}: {type(e).__name__}: {e}')
            PendingUser.objects.filter(email=email).delete()
            raise serializers.ValidationError({
                'email': 'Unable to send OTP email at the moment. Please try again later.'
            })

        return {'email': email}


class HospitalAdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        if getattr(self.user, 'role', None) != 'HOSPITAL_ADMIN':
            raise AuthenticationFailed('No hospital admin account found for this email.')

        # Ensure the hospital admin profile is verified by system admins
        admin_profile = getattr(self.user, 'hospital_admin_profile', None)
        if not admin_profile or not getattr(admin_profile, 'is_verified', False):
            raise AuthenticationFailed('Hospital admin account pending verification by system administrators.')
        # Get the admin's hospitals
        admin_roles = HospitalAdmin.objects.filter(
            user=self.user, is_active=True
        ).select_related('hospital').values('hospital_id', 'hospital__name')
        
        hospitals = [{'id': role['hospital_id'], 'name': role['hospital__name']} for role in admin_roles]
        
        data['role'] = getattr(self.user, 'role', '')
        data['email'] = getattr(self.user, 'email', '')
        data['hospitals'] = hospitals

        return data
