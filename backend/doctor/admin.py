from django.contrib import admin
from hospital.models import Hospital, HospitalAdmin as HospitalAdminRole, DoctorHospitalVerification, SlotTemplate
from .models import (
    DoctorProfile,
    Appointment,
    AppointmentAvailableSlot,
    DoctorAppointmentAvailability,
    DoctorOnlineAdviceAvailability,
)


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'doctor_email', 'preferred_name', 'full_name', 'specialization', 'license_number', 'is_verified')
    list_filter = ('is_verified', 'specialization')
    search_fields = ('user__email', 'full_name', 'preferred_name', 'specialization', 'license_number')
    actions = ['verify_doctors']

    @admin.action(description='Verify selected doctors')
    def verify_doctors(self, request, queryset):
        queryset.update(is_verified=True)

    @admin.display(description='Email')
    def doctor_email(self, obj):
        return obj.user.email if obj.user else ''


@admin.register(Hospital)
class HospitalAdminAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'email', 'contact_numbers')


@admin.register(HospitalAdminRole)
class HospitalAdminRoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'hospital', 'is_active', 'created_at')
    list_filter = ('is_active', 'hospital')
    search_fields = ('user__email', 'hospital__name')


@admin.register(DoctorHospitalVerification)
class DoctorHospitalVerificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'doctor', 'hospital', 'status', 'verified_by', 'verified_at', 'created_at')
    list_filter = ('status', 'hospital')
    search_fields = ('doctor__full_name', 'doctor__preferred_name', 'hospital__name', 'verified_by__email')


@admin.register(SlotTemplate)
class SlotTemplateAdmin(admin.ModelAdmin):
    list_display = ('id', 'doctor', 'hospital', 'day_of_week', 'start_time', 'end_time', 'slot_duration_minutes', 'default_patient_limit', 'is_active')
    list_filter = ('is_active', 'hospital', 'day_of_week')
    search_fields = ('doctor__full_name', 'doctor__preferred_name', 'hospital__name')


@admin.register(AppointmentAvailableSlot)
class AppointmentAvailableSlotAdmin(admin.ModelAdmin):
    list_display = (
        'doctor', 'date', 'day_of_week', 'hospital',
        'start_time', 'end_time',
        'booked_count', 'remaining_count',
    )
    list_filter = ('date', 'day_of_week', 'hospital', 'is_active')
    readonly_fields = ('booked_count', 'remaining_count')
    search_fields = ('doctor__full_name', 'doctor__preferred_name', 'doctor__user__email', 'hospital')


@admin.register(DoctorAppointmentAvailability)
class DoctorAppointmentAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'day_of_week', 'start_time', 'end_time')
    list_filter = ('day_of_week',)


@admin.register(DoctorOnlineAdviceAvailability)
class DoctorOnlineAdviceAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'day_of_week', 'start_time', 'end_time')
    list_filter = ('day_of_week',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'doctor', 'patient', 'slot', 'hospital', 'status', 'requested_at', 'updated_at')
    list_filter = ('status', 'doctor', 'hospital')
    search_fields = (
        'doctor__full_name',
        'doctor__preferred_name',
        'doctor__user__email',
        'patient__full_name',
        'patient__user__email',
        'slot__hospital',
    )