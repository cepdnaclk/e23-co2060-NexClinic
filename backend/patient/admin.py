from django.contrib import admin
from .models import PatientMedicalRecord, PatientProfile, Prescription, PatientMedication, MedicationReminder


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


@admin.register(PatientMedication)
class PatientMedicationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "dosage",
        "frequency",
        "patient",
        "created_at",
    )
    search_fields = ("name", "patient__full_name")


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


@admin.register(MedicationReminder)
class MedicationReminderAdmin(admin.ModelAdmin):
    list_display = (
        "medicine_name",
        "patient",
        "start_date",
        "end_date",
        "is_active",
        "created_at",
    )
    search_fields = ("medicine_name", "patient__full_name")
    list_filter = ("is_active", "start_date")


# @admin.register(MedicationLog)
# class MedicationLogAdmin(admin.ModelAdmin):
#     list_display = (
#         "reminder",
#         "patient",
#         "scheduled_for",
#         "status",
#         "taken_at",
#     )
#     search_fields = ("reminder__medicine_name", "patient__full_name")
#     list_filter = ("status", "scheduled_for")
