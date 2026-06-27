from rest_framework import serializers
from django.utils import timezone
from datetime import datetime

from doctor.models import Appointment, AppointmentAvailableSlot, DoctorOnlineAdviceAvailability, DoctorProfile
from hospital.models import Hospital, HospitalAdmin, DoctorHospitalVerification, SlotTemplate

VALID_WEEK_DAYS = {
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday',
}


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = [
            'id',
            'name',
            'address',
            'contact_numbers',
            'email',
            'is_active',
            'created_at',
            'updated_at',
        ]

        read_only_fields = ['id', 'created_at', 'updated_at']

class HospitalAdminSerializer(serializers.ModelSerializer):

    hospitalName = serializers.CharField(source='hospital.name', read_only=True)
    userEmail = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = HospitalAdmin
        fields = [
            'id',
            'user',
            'userEmail',
            'hospital',
            'hospitalName',
            'is_active',
            'created_at',
        ]

        read_only_fields = ['id', 'created_at', 'userEmail', 'hospitalName']


class DoctorVerificationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorProfile
        fields = [
            'id',
            'full_name',
            'preferred_name',
            'nic_number',
            'phone',
            'license_number',
            'specialization',
            'gender',
            'experience_years',
            'qualifications',
            'address',
        ]


class DoctorHospitalVerificationSerializer(serializers.ModelSerializer):
    doctorName = serializers.CharField(source='doctor.full_name', read_only=True)
    hospitalName = serializers.CharField(source='hospital.name', read_only=True)
    verifiedByEmail = serializers.CharField(source='verified_by.email', read_only=True)
    doctorDetails = DoctorVerificationProfileSerializer(source='doctor', read_only=True)

    class Meta:
        model = DoctorHospitalVerification
        fields = [
            'id',
            'doctor',
            'doctorName',
            'doctorDetails',
            'hospital',
            'hospitalName',
            'status',
            'verified_by',
            'verifiedByEmail',
            'verified_at',
            'rejection_reason',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'doctorName',
            'hospitalName',
            'verifiedByEmail',
            'verified_at',
            'created_at',
        ]

class SlotTemplateSerializer(serializers.ModelSerializer):
    doctorName = serializers.CharField(source='doctor.full_name', read_only=True)
    hospitalName = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = SlotTemplate
        fields = [
            'id',
            'doctor',
            'doctorName',
            'hospital',
            'hospitalName',
            'day_of_week',
            'start_time',
            'end_time',
            'slot_duration_minutes',
            'default_patient_limit',
            'is_active',
            'created_by',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'doctorName',
            'hospitalName',
            'created_by',
            'created_at',
            'updated_at',
        ]


class AdminAppointmentCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, allow_blank=False)

class AppointmentAvailableSlotSerializer(serializers.ModelSerializer):
    hospital = serializers.SerializerMethodField()
    bookedCount = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentAvailableSlot
        fields = ['id', 'date', 'day_of_week', 'hospital', 'start_time', 'end_time', 'bookedCount']

    def get_hospital(self, obj):
        if obj.hospital:
            return obj.hospital.name if hasattr(obj.hospital, 'name') else str(obj.hospital)
        return 'NexClinic'

    def get_bookedCount(self, obj):
        return obj.appointments.count()


class AppointmentSlotInputSerializer(serializers.Serializer):
    date = serializers.DateField()
    hospital = serializers.CharField(max_length=255)
    start_time = serializers.TimeField(input_formats=['%H:%M', '%H:%M:%S'])
    end_time = serializers.TimeField(input_formats=['%H:%M', '%H:%M:%S'])

    def validate(self, attrs):
        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError('start_time must be before end_time.')

        attrs['day_of_week'] = attrs['date'].strftime('%A')
        return attrs


class BulkAppointmentSlotCreateSerializer(serializers.Serializer):
    slots = AppointmentSlotInputSerializer(many=True, allow_empty=False)


class AppointmentSlotUpdateSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    hospital = serializers.CharField(required=False, max_length=255)
    start_time = serializers.TimeField(required=False, input_formats=['%H:%M', '%H:%M:%S'])
    end_time = serializers.TimeField(required=False, input_formats=['%H:%M', '%H:%M:%S'])

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('At least one field must be provided for update.')
        return attrs


class OnlineAdviceAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorOnlineAdviceAvailability
        fields = ['id', 'day_of_week', 'start_time', 'end_time']


class OnlineAdviceSlotInputSerializer(serializers.Serializer):
    day_of_week = serializers.CharField(max_length=12)
    start_time = serializers.TimeField(input_formats=['%H:%M', '%H:%M:%S'])
    end_time = serializers.TimeField(input_formats=['%H:%M', '%H:%M:%S'])

    def validate(self, attrs):
        day_key = attrs['day_of_week'].strip().lower()
        if day_key not in VALID_WEEK_DAYS:
            raise serializers.ValidationError('day_of_week must be a valid weekday name.')

        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError('start_time must be before end_time.')

        attrs['day_of_week'] = VALID_WEEK_DAYS[day_key]
        return attrs


class BulkOnlineAdviceSlotCreateSerializer(serializers.Serializer):
    slots = OnlineAdviceSlotInputSerializer(many=True, allow_empty=False)


class OnlineAdviceSlotUpdateSerializer(serializers.Serializer):
    day_of_week = serializers.CharField(max_length=12, required=False)
    start_time = serializers.TimeField(required=False, input_formats=['%H:%M', '%H:%M:%S'])
    end_time = serializers.TimeField(required=False, input_formats=['%H:%M', '%H:%M:%S'])

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('At least one field must be provided for update.')

        if 'day_of_week' in attrs:
            day_key = attrs['day_of_week'].strip().lower()
            if day_key not in VALID_WEEK_DAYS:
                raise serializers.ValidationError('day_of_week must be a valid weekday name.')
            attrs['day_of_week'] = VALID_WEEK_DAYS[day_key]

        return attrs


class DoctorAppointmentSerializer(serializers.ModelSerializer):
    patientId = serializers.SerializerMethodField()
    patientName = serializers.SerializerMethodField()
    patientAge = serializers.SerializerMethodField()
    patientGender = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    requestedAt = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'patientId',
            'patientName',
            'patientAge',
            'patientGender',
            'reason',
            'date',
            'time',
            'location',
            'requestedAt',
            'status',
            'category',
        ]

    def get_patientId(self, obj):
        return str(obj.patient_id)

    def get_patientName(self, obj):
        if obj.patient and obj.patient.full_name:
            return obj.patient.full_name
        if obj.patient and obj.patient.user:
            return obj.patient.user.email
        return "Unknown"

    def get_patientAge(self, obj):
        dob = getattr(obj.patient, 'date_of_birth', None)
        if not dob:
            return 0
        today = timezone.localdate()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    def get_patientGender(self, obj):
        return getattr(obj.patient, 'gender', 'Other') or 'Other'

    def get_date(self, obj):
        return obj.slot.date.isoformat()

    def get_time(self, obj):
        return obj.slot.start_time.strftime('%H:%M')

    def get_location(self, obj):
        if obj.slot and obj.slot.hospital:
            return obj.slot.hospital.name if hasattr(obj.slot.hospital, 'name') else str(obj.slot.hospital)
        return obj.doctor.location or "NexClinic"

    def get_requestedAt(self, obj):
        return timezone.localtime(obj.requested_at).strftime('%Y-%m-%d %H:%M')

    def get_status(self, obj):
        mapping = {
            Appointment.Status.PENDING: 'Pending',
            Appointment.Status.ACCEPTED: 'Accepted',
            Appointment.Status.REJECTED: 'Rejected',
            Appointment.Status.COMPLETED: 'Completed',
            Appointment.Status.CANCELLED: 'Cancelled',
        }
        return mapping.get(obj.status, obj.status)

    def get_category(self, obj):
        if obj.status == Appointment.Status.PENDING:
            return 'request'

        if obj.status == Appointment.Status.ACCEPTED:
            naive_dt = datetime.combine(obj.slot.date, obj.slot.start_time)
            appointment_dt = timezone.make_aware(naive_dt, timezone.get_current_timezone())
            return 'upcoming' if appointment_dt >= timezone.now() else 'previous'

        return 'previous'


class DoctorPatientProfileSerializer(serializers.Serializer):
    patientId = serializers.SerializerMethodField()
    fullName = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    gender = serializers.SerializerMethodField()
    bloodGroup = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    emergencyContact = serializers.SerializerMethodField()
    allergies = serializers.SerializerMethodField()
    conditions = serializers.SerializerMethodField()
    currentMedications = serializers.SerializerMethodField()
    lastVisit = serializers.SerializerMethodField()

    def get_patientId(self, obj):
        return str(obj.id)

    def get_fullName(self, obj):
        if obj.full_name:
            return obj.full_name
        if obj.user and obj.user.email:
            return obj.user.email
        return 'Not available'

    def get_age(self, obj):
        dob = getattr(obj, 'date_of_birth', None)
        if not dob:
            return None
        today = timezone.localdate()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    def get_gender(self, obj):
        return obj.gender or 'Not available'

    def get_bloodGroup(self, obj):
        return 'Not available'

    def get_phone(self, obj):
        return obj.phone or 'Not available'

    def get_emergencyContact(self, obj):
        return 'Not available'

    def get_allergies(self, obj):
        return ['Not available']

    def get_conditions(self, obj):
        return ['Not available']

    def get_currentMedications(self, obj):
        return ['Not available']

    def get_comments(self, obj):
        return getattr(obj, 'doctor_comments', '') or ''

    def get_prescriptions(self, obj):
        return getattr(obj, 'prescriptions', '') or ''

    def get_lastVisit(self, obj):
        doctor_profile = self.context.get('doctor_profile')

        queryset = obj.appointments.select_related('slot').order_by('-slot__date', '-slot__start_time')
        if doctor_profile is not None:
            queryset = queryset.filter(doctor=doctor_profile)

        appointment = queryset.first()
        if not appointment or not appointment.slot:
            return 'Not available'

        return appointment.slot.date.isoformat()


class DoctorPatientProfileUpdateSerializer(serializers.Serializer):
    comments = serializers.CharField(required=False, allow_blank=True)
    prescriptions = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('At least one field must be provided for update.')
        return attrs

    def update(self, instance, validated_data):
        update_fields = []

        if 'comments' in validated_data:
            instance.doctor_comments = validated_data['comments']
            update_fields.append('doctor_comments')

        if 'prescriptions' in validated_data:
            instance.prescriptions = validated_data['prescriptions']
            update_fields.append('prescriptions')

        if update_fields:
            instance.save(update_fields=sorted(set(update_fields)))

        return instance


class DoctorAppointmentActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['accept', 'reject', 'complete', 'cancel'])


class DoctorAppointmentRescheduleSerializer(serializers.Serializer):
    date = serializers.DateField()
    start_time = serializers.TimeField(input_formats=['%H:%M', '%H:%M:%S'])

    def validate(self, attrs):
        naive_dt = datetime.combine(attrs['date'], attrs['start_time'])
        appointment_dt = timezone.make_aware(naive_dt, timezone.get_current_timezone())

        if appointment_dt < timezone.now():
            raise serializers.ValidationError('Cannot reschedule an appointment to a past time.')

        return attrs

class DoctorDirectoryPublicSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    fullName = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    hospitals = serializers.SerializerMethodField()
    qualifications = serializers.SerializerMethodField()
    experience = serializers.SerializerMethodField()
    chatFee = serializers.SerializerMethodField()
    appointmentFee = serializers.SerializerMethodField()
    availableForChat = serializers.SerializerMethodField()
    nextAvailable = serializers.SerializerMethodField()
    languages = serializers.SerializerMethodField()


    class Meta:
        model = DoctorProfile
        fields = [
            'id',
            'fullName',
            'photo',
            'specialization',
            'hospitals',
            'qualifications',
            'experience',
            'chatFee',
            'appointmentFee',
            'availableForChat',
            'nextAvailable',
            'languages',
        ]

    def get_id(self, obj):
        return str(obj.id)

    def get_fullName(self, obj):
        return obj.full_name or obj.preferred_name or (obj.user.email if obj.user else 'Doctor')

    def get_specialization(self, obj):
        return obj.specialization or 'General'
    
    def get_photo(self, obj):
        if not obj.profile_picture:
            return '/images/user.png'

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.profile_picture.url)

        return obj.profile_picture.url
    
    def get_hospitals(self, obj):
        # Return the list of hospital names the doctor is verified with
        try:
            hospitals_qs = obj.verified_hospitals.all()
            return [h.name for h in hospitals_qs]
        except Exception:
            return []
    
    def get_qualifications(self, obj):
        if not obj.qualifications:
            return []
        return [qualification.strip() for qualification in obj.qualifications.split(',') if qualification.strip()]
    
    def get_experience(self, obj):
        years = obj.experience_years or 0
        return f'{years} years'
    
    def get_chatFee(self, obj):
        return f'Rs. {obj.chat_fee:,.2f}'

    def get_appointmentFee(self, obj):
        return f'Rs. {obj.appointment_fee:,.2f}'
    
    def get_availableForChat(self, obj):
        return bool(obj.availability)
    
    def get_nextAvailable(self, obj):
        if hasattr(obj, '_prefetched_objects_cache') and 'available_slots' in obj._prefetched_objects_cache:
            today = timezone.localdate()
            slots = sorted(
                [s for s in obj.available_slots.all() if s.date >= today],
                key=lambda s: (s.date, s.start_time)
            )
            next_slot = slots[0] if slots else None
        else:
            next_slot = obj.available_slots.filter(date__gte=timezone.localdate()).order_by('date', 'start_time').first()
        if not next_slot:
            return 'Not available'
        return f"{next_slot.date.strftime('%Y-%m-%d')}, {next_slot.start_time.strftime('%I:%M %p')}"
    
    def get_languages(self, obj):
        if not obj.languages_spoken:
            return []
        return [language.strip() for language in obj.languages_spoken.split(',') if language.strip()]
    

class DoctorDirectoryDetailSerializer(DoctorDirectoryPublicSerializer):
    contactNumber = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta(DoctorDirectoryPublicSerializer.Meta):
        fields = DoctorDirectoryPublicSerializer.Meta.fields + ['contactNumber', 'email']

    def get_contactNumber(self, obj):
        return obj.phone or ''

    def get_email(self, obj):
        return obj.user.email if obj.user else ''
    

# class DoctorDirectorySerializer(serializers.ModelSerializer):
#     id = serializers.SerializerMethodField()
#     fullName = serializers.SerializerMethodField()
#     slmcId = serializers.SerializerMethodField()
#     photo = serializers.SerializerMethodField()
#     specialization = serializers.SerializerMethodField()
#     hospitals = serializers.SerializerMethodField()
#     qualifications = serializers.SerializerMethodField()
#     experience = serializers.SerializerMethodField()
#     contactNumber = serializers.SerializerMethodField()
#     email = serializers.SerializerMethodField()
#     chatFee = serializers.SerializerMethodField()
#     appointmentFee = serializers.SerializerMethodField()
#     availableForChat = serializers.SerializerMethodField()
#     nextAvailable = serializers.SerializerMethodField()
#     languages = serializers.SerializerMethodField()

#     class Meta:
#         model = DoctorProfile
#         fields = [
#             'id',
#             'fullName',
#             'slmcId',
#             'photo',
#             'specialization',
#             'hospitals',
#             'qualifications',
#             'experience',
#             'contactNumber',
#             'email',
#             'chatFee',
#             'appointmentFee',
#             'availableForChat',
#             'nextAvailable',
#             'languages',
#         ]

#     @staticmethod
#     def _split_csv(value):
#         if not value:
#             return []
#         return [item.strip() for item in value.split(',') if item.strip()]

#     def get_id(self, obj):
#         return str(obj.id)

#     def get_fullName(self, obj):
#         return obj.full_name or obj.preferred_name or (obj.user.email if obj.user else 'Doctor')

#     def get_slmcId(self, obj):
#         return obj.license_number or ''

#     def get_photo(self, obj):
#         if not obj.profile_picture:
#             return '/images/user.png'

#         request = self.context.get('request')
#         if request:
#             return request.build_absolute_uri(obj.profile_picture.url)

#         return obj.profile_picture.url

#     def get_specialization(self, obj):
#         return obj.specialization or 'General'

#     def get_hospitals(self, obj):
#         return self._split_csv(obj.hospitals)

#     def get_qualifications(self, obj):
#         return self._split_csv(obj.qualifications)

#     def get_experience(self, obj):
#         years = obj.experience_years or 0
#         return f'{years} years'

#     def get_contactNumber(self, obj):
#         return obj.phone or ''

#     def get_email(self, obj):
#         return obj.user.email if obj.user else ''

#     def get_chatFee(self, obj):
#         return 'Rs. 500'

#     def get_appointmentFee(self, obj):
#         return 'Rs. 3,000'

#     def get_availableForChat(self, obj):
#         return bool(obj.availability)

#     def get_nextAvailable(self, obj):
#         next_slot = obj.available_slots.filter(date__gte=timezone.localdate()).order_by('date', 'start_time').first()
#         if not next_slot:
#             return 'Not available'

#         return f"{next_slot.date.strftime('%Y-%m-%d')}, {next_slot.start_time.strftime('%I:%M %p')}"

#     def get_languages(self, obj):
#         return self._split_csv(obj.languages_spoken)
