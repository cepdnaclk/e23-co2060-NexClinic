from django.contrib import admin
from .models import PatientMedicalRecord, PatientProfile, Prescription


@admin.register(PatientProfile)
class PatientProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "phone")


@admin.register(PatientMedicalRecord)
class PatientMedicalRecordAdmin(admin.ModelAdmin):
    list_display = (
        "visit_date",
        "patient",
        "doctor_name",
        "hospital_name",
        "created_at",
    )
    search_fields = (
        "patient__full_name",
        "doctor_name",
        "hospital_name",
        "observations",
        "diagnosis",
    )
    list_filter = ("visit_date", "hospital_name")


@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = (
        "medicine_name",
        "amount",
        "unit",
        "patient",
        "doctor",
        "appointment",
        "updated_at",
    )
    search_fields = ("medicine_name", "patient__full_name", "doctor__full_name")
    list_filter = ("unit", "created_at")
