from django.contrib import admin
from .models import (
    DoctorProfile,
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
    list_display = ('doctor', 'date', 'day_of_week', 'start_time', 'end_time')
    list_filter = ('date', 'day_of_week')


@admin.register(DoctorAppointmentAvailability)
class DoctorAppointmentAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'day_of_week', 'start_time', 'end_time')
    list_filter = ('day_of_week',)


@admin.register(DoctorOnlineAdviceAvailability)
class DoctorOnlineAdviceAvailabilityAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'day_of_week', 'start_time', 'end_time')
    list_filter = ('day_of_week',)
