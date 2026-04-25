from django.contrib import admin
from .models import (
    DoctorProfile,
    Appointment,
    AppointmentAvailableSlot,
    DoctorAppointmentAvailability,
    DoctorOnlineAdviceAvailability,
)

@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'preferred_name', 'full_name', 'specialization', 'license_number', 'is_verified')
    list_filter = ('is_verified', 'specialization')
    actions = ['verify_doctors']

    @admin.action(description='Verify selected doctors')
    def verify_doctors(self, request, queryset):
        queryset.update(is_verified=True)


@admin.register(AppointmentAvailableSlot)
class AppointmentAvailableSlotAdmin(admin.ModelAdmin):
    list_display = (
        'doctor', 'date', 'day_of_week', 'hospital',
        'start_time', 'end_time',
        'booked_count', 'remaining_count',
    )
    list_filter = ('date', 'day_of_week', 'hospital')
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
    list_display = ('id', 'doctor', 'patient', 'slot', 'status', 'requested_at', 'updated_at')
    list_filter = ('status', 'slot__date', 'doctor')
    search_fields = (
        'doctor__full_name',
        'doctor__preferred_name',
        'doctor__user__email',
        'patient__full_name',
        'patient__user__email',
    )
