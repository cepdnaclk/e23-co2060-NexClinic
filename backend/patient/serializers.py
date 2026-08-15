from datetime import datetime

from django.utils import timezone
from rest_framework import serializers

from doctor.models import Appointment, AppointmentAvailableSlot
from patient.models import PatientMedicalRecord, PatientProfile, Prescription
from users.models import CustomUser


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
            "id",
            "slotId",
            "doctorId",
            "doctorName",
            "hospital",
            "date",
            "time",
            "reason",
            "status",
            "requestedAt",
            "category",
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

        doctor_user = getattr(obj.doctor, "user", None)
        if doctor_user:
            return doctor_user.email

        return "Doctor"

    def get_hospital(self, obj):
        if obj.slot and obj.slot.hospital:
            return (
                obj.slot.hospital.name
                if hasattr(obj.slot.hospital, "name")
                else str(obj.slot.hospital)
            )
        return obj.doctor.location or "NexClinic"

    def get_date(self, obj):
        return obj.slot.date.isoformat()

    def get_time(self, obj):
        return obj.slot.start_time.strftime("%H:%M")

    def get_status(self, obj):
        mapping = {
            Appointment.Status.PENDING: "Confirmed",
            Appointment.Status.ACCEPTED: "Confirmed",
            Appointment.Status.REJECTED: "Rejected",
            Appointment.Status.COMPLETED: "Completed",
            Appointment.Status.CANCELLED: "Cancelled",
        }
        return mapping.get(obj.status, obj.status)

    def get_requestedAt(self, obj):
        return timezone.localtime(obj.requested_at).strftime("%Y-%m-%d %H:%M")

    def get_category(self, obj):
        if obj.status in {Appointment.Status.PENDING, Appointment.Status.ACCEPTED}:
            naive_dt = datetime.combine(obj.slot.date, obj.slot.start_time)
            appointment_dt = timezone.make_aware(
                naive_dt, timezone.get_current_timezone()
            )
            return "upcoming" if appointment_dt >= timezone.now() else "previous"

        return "previous"


class PatientAppointmentCreateSerializer(serializers.Serializer):
    slot_id = serializers.IntegerField(min_value=1)
    reason = serializers.CharField(required=False, allow_blank=True, default="")


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
    appointmentFee = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentAvailableSlot
        fields = [
            "id",
            "doctorId",
            "doctorName",
            "hospital",
            "date",
            "time",
            "bookedCount",
            "patientLimit",
            "remainingCount",
            "isFull",
            "appointmentFee",
        ]

    def get_doctorId(self, obj):
        return str(obj.doctor_id)

    def get_doctorName(self, obj):
        if obj.doctor and obj.doctor.full_name:
            return obj.doctor.full_name
        if obj.doctor and obj.doctor.preferred_name:
            return obj.doctor.preferred_name
        doctor_user = getattr(obj.doctor, "user", None)
        return doctor_user.email if doctor_user else "Doctor"

    def get_hospital(self, obj):
        if obj.hospital:
            return (
                obj.hospital.name
                if hasattr(obj.hospital, "name")
                else str(obj.hospital)
            )
        return obj.doctor.location or "NexClinic"

    def get_date(self, obj):
        return obj.date.isoformat()

    def get_time(self, obj):
        return obj.start_time.strftime("%H:%M")

    def get_bookedCount(self, obj):
        return (
            obj.booked_count
            if obj.booked_count is not None
            else obj.appointments.count()
        )

    def get_patientLimit(self, obj):
        return obj.patient_limit

    def get_remainingCount(self, obj):
        booked = (
            obj.booked_count
            if obj.booked_count is not None
            else obj.appointments.count()
        )
        return max(obj.patient_limit - booked, 0)

    def get_isFull(self, obj):
        booked = (
            obj.booked_count
            if obj.booked_count is not None
            else obj.appointments.count()
        )
        return booked >= obj.patient_limit

    def get_appointmentFee(self, obj):
        if obj.doctor:
            return float(obj.doctor.appointment_fee)
        return 3500.00


class PatientAppointmentCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, allow_blank=True)
    # reason = serializers.CharField(required=False, allow_blank=True, default='')


class PatientProfileUpdateSerializer(serializers.Serializer):
    fullName = serializers.CharField(max_length=255, required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=15, required=False)
    dateOfBirth = serializers.DateField(required=False)
    # Accept free-form input and validate/normalize in `validate_gender`
    gender = serializers.CharField(required=False)
    address = serializers.CharField(max_length=100, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    postalCode = serializers.CharField(max_length=20, required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bloodType = serializers.CharField(max_length=10, required=False, allow_blank=True)
    allergies = serializers.CharField(required=False, allow_blank=True)
    medications = serializers.CharField(required=False, allow_blank=True)
    medicalHistory = serializers.CharField(required=False, allow_blank=True)
    emergencyContactName = serializers.CharField(
        max_length=255, required=False, allow_blank=True
    )
    emergencyContactPhone = serializers.CharField(
        max_length=20, required=False, allow_blank=True
    )
    emergencyContactRelation = serializers.CharField(
        max_length=100, required=False, allow_blank=True
    )
    emergencyContactEmail = serializers.EmailField(required=False, allow_blank=True)
    profileImage = serializers.ImageField(required=False)
    medicalReports = serializers.FileField(required=False)
    medicalDocuments = serializers.FileField(required=False)
    clearProfilePicture = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "At least one field must be provided for update."
            )
        return attrs

    def validate_gender(self, value):
        if not isinstance(value, str):
            raise serializers.ValidationError("Invalid gender value.")
        normalized = value.strip().lower()
        allowed = {"male", "female", "other"}
        if normalized not in allowed:
            raise serializers.ValidationError("Invalid gender choice.")
        return normalized

    def validate_email(self, value):
        patient_profile = self.context.get("patient_profile")
        queryset = CustomUser.objects.filter(email__iexact=value)
        if patient_profile is not None:
            queryset = queryset.exclude(id=patient_profile.user_id)
        if queryset.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def update(self, instance: PatientProfile, validated_data):
        user = instance.user

        field_map = {
            "fullName": "full_name",
            "phone": "phone",
            "dateOfBirth": "date_of_birth",
            "gender": "gender",
            "address": "address",
            "city": "city",
            "postalCode": "postal_code",
            "country": "country",
            "bloodType": "blood_type",
            "allergies": "allergies",
            "medications": "medications",
            "medicalHistory": "medical_history",
            "emergencyContactName": "emergency_contact_name",
            "emergencyContactPhone": "emergency_contact_phone",
            "emergencyContactRelation": "emergency_contact_relation",
            "emergencyContactEmail": "emergency_contact_email",
            "profileImage": "profile_picture",
            "medicalReports": "medical_reports",
            "medicalDocuments": "medical_documents",
        }

        update_fields = []
        for serializer_field, model_field in field_map.items():
            if serializer_field in validated_data:
                setattr(instance, model_field, validated_data[serializer_field])
                update_fields.append(model_field)

        if "email" in validated_data:
            user.email = validated_data["email"]
            user.save(update_fields=["email"])

        if validated_data.get("clearProfilePicture"):
            instance.profile_picture = None
            if "profile_picture" not in update_fields:
                update_fields.append("profile_picture")

        if update_fields:
            instance.save(update_fields=sorted(set(update_fields)))

        return instance


class PrescriptionSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="medicine_name")

    class Meta:
        model = Prescription
        fields = ["id", "name", "amount", "unit", "duration", "frequency", "timings", "notes"]


class PatientMedicalRecordSerializer(serializers.ModelSerializer):
    appointmentId = serializers.SerializerMethodField()
    doctorName = serializers.SerializerMethodField()
    hospitalName = serializers.SerializerMethodField()
    createdAt = serializers.SerializerMethodField()
    updatedAt = serializers.SerializerMethodField()
    followUpDate = serializers.SerializerMethodField()
    prescriptionItems = PrescriptionSerializer(source="prescription_items", many=True, read_only=True)

    class Meta:
        model = PatientMedicalRecord
        fields = [
            "id",
            "appointmentId",
            "visit_date",
            "doctorName",
            "hospitalName",
            "observations",
            "diagnosis",
            "comments",
            "prescriptions",
            "prescriptionItems",
            "recommended_tests",
            "followUpDate",
            "follow_up_notes",
            "createdAt",
            "updatedAt",
        ]

    def get_appointmentId(self, obj):
        return str(obj.appointment_id) if obj.appointment_id else ""

    def get_doctorName(self, obj):
        return obj.doctor_name or (obj.doctor.full_name if obj.doctor else "Doctor")

    def get_hospitalName(self, obj):
        return obj.hospital_name or "NexClinic"

    def get_createdAt(self, obj):
        return timezone.localtime(obj.created_at).strftime("%Y-%m-%d %H:%M")

    def get_updatedAt(self, obj):
        return timezone.localtime(obj.updated_at).strftime("%Y-%m-%d %H:%M")

    def get_followUpDate(self, obj):
        return obj.follow_up_date.isoformat() if obj.follow_up_date else ""


class PatientMedicalRecordUpsertSerializer(serializers.Serializer):
    observations = serializers.CharField(required=False, allow_blank=True)
    diagnosis = serializers.CharField(required=False, allow_blank=True)
    comments = serializers.CharField(required=False, allow_blank=True)
    prescriptions = serializers.CharField(required=False, allow_blank=True)
    prescriptionItems = serializers.ListField(
        child=serializers.DictField(), required=False, allow_empty=True
    )
    recommendedTests = serializers.CharField(required=False, allow_blank=True)
    followUpDate = serializers.DateField(required=False)
    followUpNotes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "At least one medical record field must be provided."
            )
        return attrs

    def validate_prescriptionItems(self, items):
        serializer = PrescriptionItemUpsertSerializer(data=items, many=True)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data


class PrescriptionItemUpsertSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    amount = serializers.DecimalField(
        max_digits=10, decimal_places=3, required=False, allow_null=True
    )
    unit = serializers.CharField(max_length=30, required=False, allow_blank=True)
    duration = serializers.CharField(max_length=100, required=False, allow_blank=True)
    frequency = serializers.CharField(max_length=100, required=False, allow_blank=True)
    timings = serializers.ListField(
        child=serializers.CharField(max_length=30), required=False, allow_empty=True
    )
    notes = serializers.CharField(required=False, allow_blank=True)


def is_slot_in_past(slot_obj):
    naive_dt = datetime.combine(slot_obj.date, slot_obj.start_time)
    slot_dt = timezone.make_aware(naive_dt, timezone.get_current_timezone())
    return slot_dt < timezone.now()
