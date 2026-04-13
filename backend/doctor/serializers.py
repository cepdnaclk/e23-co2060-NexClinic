from rest_framework import serializers
from django.utils import timezone
from datetime import datetime

from .models import AppointmentAvailableSlot, DoctorOnlineAdviceAvailability, Appointment, DoctorProfile


VALID_WEEK_DAYS = {
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday',
}


class AppointmentAvailableSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentAvailableSlot
        fields = ['id', 'date', 'day_of_week', 'start_time', 'end_time']


class AppointmentSlotInputSerializer(serializers.Serializer):
    date = serializers.DateField()
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


class DoctorDirectorySerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    fullName = serializers.SerializerMethodField()
    slmcId = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    specialization = serializers.SerializerMethodField()
    hospitals = serializers.SerializerMethodField()
    qualifications = serializers.SerializerMethodField()
    experience = serializers.SerializerMethodField()
    contactNumber = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
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
            'slmcId',
            'photo',
            'specialization',
            'hospitals',
            'qualifications',
            'experience',
            'contactNumber',
            'email',
            'chatFee',
            'appointmentFee',
            'availableForChat',
            'nextAvailable',
            'languages',
        ]

    @staticmethod
    def _split_csv(value):
        if not value:
            return []
        return [item.strip() for item in value.split(',') if item.strip()]

    def get_id(self, obj):
        return str(obj.id)

    def get_fullName(self, obj):
        return obj.full_name or obj.preferred_name or (obj.user.email if obj.user else 'Doctor')

    def get_slmcId(self, obj):
        return obj.license_number or ''

    def get_photo(self, obj):
        if not obj.profile_picture:
            return '/images/user.png'

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.profile_picture.url)

        return obj.profile_picture.url

    def get_specialization(self, obj):
        return obj.specialization or 'General'

    def get_hospitals(self, obj):
        return self._split_csv(obj.hospitals)

    def get_qualifications(self, obj):
        return self._split_csv(obj.qualifications)

    def get_experience(self, obj):
        years = obj.experience_years or 0
        return f'{years} years'

    def get_contactNumber(self, obj):
        return obj.phone or ''

    def get_email(self, obj):
        return obj.user.email if obj.user else ''

    def get_chatFee(self, obj):
        return 'Rs. 500'

    def get_appointmentFee(self, obj):
        return 'Rs. 3,000'

    def get_availableForChat(self, obj):
        return bool(obj.availability)

    def get_nextAvailable(self, obj):
        next_slot = obj.available_slots.filter(date__gte=timezone.localdate()).order_by('date', 'start_time').first()
        if not next_slot:
            return 'Not available'

        return f"{next_slot.date.strftime('%Y-%m-%d')}, {next_slot.start_time.strftime('%I:%M %p')}"

    def get_languages(self, obj):
        return self._split_csv(obj.languages_spoken)
