from datetime import datetime

from django.utils import timezone
from rest_framework import serializers

from doctor.models import Appointment, AppointmentAvailableSlot


class PatientAppointmentSerializer(serializers.ModelSerializer):
    slotId = serializers.SerializerMethodField()
    doctorId = serializers.SerializerMethodField()
    doctorName = serializers.SerializerMethodField()
    hospital = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    requestedAt = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'slotId',
            'doctorId',
            'doctorName',
            'hospital',
            'date',
            'time',
            'reason',
            'status',
            'requestedAt',
            'category',
        ]

    def get_slotId(self, obj):
        return str(obj.slot_id)

    def get_doctorId(self, obj):
        return str(obj.doctor_id)

    def get_doctorName(self, obj):
        if obj.doctor and obj.doctor.full_name:
            return obj.doctor.full_name
        if obj.doctor and obj.doctor.preferred_name:
            return obj.doctor.preferred_name

        doctor_user = getattr(obj.doctor, 'user', None)
        if doctor_user:
            return doctor_user.email

        return 'Doctor'

    def get_hospital(self, obj):
        if obj.slot and obj.slot.hospital:
            return obj.slot.hospital
        return obj.doctor.location or 'NexClinic'

    def get_date(self, obj):
        return obj.slot.date.isoformat()

    def get_time(self, obj):
        return obj.slot.start_time.strftime('%H:%M')

    def get_status(self, obj):
        mapping = {
            Appointment.Status.PENDING: 'Pending',
            Appointment.Status.ACCEPTED: 'Confirmed',
            Appointment.Status.REJECTED: 'Rejected',
            Appointment.Status.COMPLETED: 'Completed',
            Appointment.Status.CANCELLED: 'Cancelled',
        }
        return mapping.get(obj.status, obj.status)

    def get_requestedAt(self, obj):
        return timezone.localtime(obj.requested_at).strftime('%Y-%m-%d %H:%M')

    def get_category(self, obj):
        if obj.status == Appointment.Status.PENDING:
            return 'request'

        if obj.status == Appointment.Status.ACCEPTED:
            naive_dt = datetime.combine(obj.slot.date, obj.slot.start_time)
            appointment_dt = timezone.make_aware(naive_dt, timezone.get_current_timezone())
            return 'upcoming' if appointment_dt >= timezone.now() else 'previous'

        return 'previous'


class PatientAppointmentCreateSerializer(serializers.Serializer):
    slot_id = serializers.IntegerField(min_value=1)
    reason = serializers.CharField(required=False, allow_blank=True, default='')


class PatientAvailableSlotSerializer(serializers.ModelSerializer):
    doctorId = serializers.SerializerMethodField()
    doctorName = serializers.SerializerMethodField()
    hospital = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    time = serializers.SerializerMethodField()
    bookedCount = serializers.SerializerMethodField()
    patientLimit = serializers.SerializerMethodField()
    remainingCount = serializers.SerializerMethodField()
    isFull = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentAvailableSlot
        fields = [
            'id',
            'doctorId',
            'doctorName',
            'hospital',
            'date',
            'time',
            'bookedCount',
            'patientLimit',
            'remainingCount',
            'isFull',
        ]

    def get_doctorId(self, obj):
        return str(obj.doctor_id)

    def get_doctorName(self, obj):
        if obj.doctor and obj.doctor.full_name:
            return obj.doctor.full_name
        if obj.doctor and obj.doctor.preferred_name:
            return obj.doctor.preferred_name
        doctor_user = getattr(obj.doctor, 'user', None)
        return doctor_user.email if doctor_user else 'Doctor'

    def get_hospital(self, obj):
        return obj.hospital or obj.doctor.location or 'NexClinic'

    def get_date(self, obj):
        return obj.date.isoformat()

    def get_time(self, obj):
        return obj.start_time.strftime('%H:%M')

    def get_bookedCount(self, obj):
        return obj.booked_count if obj.booked_count is not None else obj.appointments.count()

    def get_patientLimit(self, obj):
        return obj.patient_limit

    def get_remainingCount(self, obj):
        booked = obj.booked_count if obj.booked_count is not None else obj.appointments.count()
        return max(obj.patient_limit - booked, 0)

    def get_isFull(self, obj):
        booked = obj.booked_count if obj.booked_count is not None else obj.appointments.count()
        return booked >= obj.patient_limit

class PatientAppointmentCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, allow_blank=True)
    # reason = serializers.CharField(required=False, allow_blank=True, default='')


def is_slot_in_past(slot_obj):
    naive_dt = datetime.combine(slot_obj.date, slot_obj.start_time)
    slot_dt = timezone.make_aware(naive_dt, timezone.get_current_timezone())
    return slot_dt < timezone.now()
