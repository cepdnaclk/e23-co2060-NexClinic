from rest_framework import serializers
from django.utils import timezone
from datetime import datetime

from .models import AppointmentAvailableSlot, DoctorOnlineAdviceAvailability, Appointment


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
