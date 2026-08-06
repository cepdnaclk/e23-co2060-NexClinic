from django.conf import settings
from django.db import models
from django.utils import timezone


# Patient registration model
class PatientProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_profile",
    )

    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10)
    phone = models.CharField(max_length=15)
    address = models.CharField(max_length=100)
    city = models.CharField(max_length=100, blank=True, default="")
    postal_code = models.CharField(max_length=20, blank=True, default="")
    country = models.CharField(max_length=100, blank=True, default="")
    blood_type = models.CharField(max_length=10, blank=True, default="")
    allergies = models.TextField(blank=True, default="")
    medications = models.TextField(blank=True, default="")
    medical_history = models.TextField(blank=True, null=True)
    doctor_comments = models.TextField(blank=True, default="")
    prescriptions = models.TextField(blank=True, default="")
    emergency_contact_name = models.CharField(max_length=255, blank=True, default="")
    emergency_contact_phone = models.CharField(max_length=20, blank=True, default="")
    emergency_contact_relation = models.CharField(
        max_length=100, blank=True, default=""
    )
    emergency_contact_email = models.EmailField(blank=True, default="")
    insurance_provider = models.CharField(max_length=255, blank=True, default="")
    insurance_policy_number = models.CharField(max_length=100, blank=True, default="")
    profile_picture = models.ImageField(
        upload_to="patient_profiles/", null=True, blank=True
    )
    medical_reports = models.FileField(
        upload_to="patient_reports/", null=True, blank=True
    )
    medical_documents = models.FileField(
        upload_to="patient_documents/", null=True, blank=True
    )

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"


class PatientMedicalRecord(models.Model):
    patient = models.ForeignKey(
        PatientProfile, on_delete=models.CASCADE, related_name="medical_records"
    )
    doctor = models.ForeignKey(
        "doctor.DoctorProfile", on_delete=models.PROTECT, related_name="medical_records"
    )
    appointment = models.OneToOneField(
        "doctor.Appointment",
        on_delete=models.SET_NULL,
        related_name="medical_record",
        null=True,
        blank=True,
    )
    visit_date = models.DateField(default=timezone.localdate)
    hospital_name = models.CharField(max_length=255)
    doctor_name = models.CharField(max_length=255)
    observations = models.TextField(blank=True, default="")
    diagnosis = models.TextField(blank=True, default="")
    comments = models.TextField(blank=True, default="")
    prescriptions = models.TextField(blank=True, default="")
    recommended_tests = models.TextField(blank=True, default="")
    follow_up_date = models.DateField(null=True, blank=True)
    follow_up_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-visit_date", "-created_at"]

    def __str__(self):
        return f"{self.patient.full_name} - {self.visit_date} - {self.doctor_name}"


class Prescription(models.Model):
    medical_record = models.ForeignKey(
        PatientMedicalRecord,
        on_delete=models.CASCADE,
        related_name="prescription_items",
    )
    patient = models.ForeignKey(
        PatientProfile, on_delete=models.CASCADE, related_name="prescription_items"
    )
    doctor = models.ForeignKey(
        "doctor.DoctorProfile",
        on_delete=models.PROTECT,
        related_name="prescription_items",
    )
    appointment = models.ForeignKey(
        "doctor.Appointment",
        on_delete=models.CASCADE,
        related_name="prescription_items",
    )
    medicine_name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    unit = models.CharField(max_length=30, blank=True, default="")
    duration = models.CharField(max_length=100, blank=True, default="")
    frequency = models.CharField(max_length=100, blank=True, default="")
    timings = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.medicine_name} - {self.patient.full_name}"


class PatientMedication(models.Model):
    patient = models.ForeignKey(
        PatientProfile, on_delete=models.CASCADE, related_name="patient_medications"
    )
    name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=255)
    frequency = models.CharField(max_length=255)
    duration = models.CharField(max_length=255, blank=True, default="")
    prescribing_doctor = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.patient.full_name}"
