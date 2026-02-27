from django.contrib import admin
from .models import DoctorProfile

@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'preferred_name', 'full_name', 'specialization', 'license_number', 'is_verified')
    list_filter = ('is_verified', 'specialization')
    actions = ['verify_doctors']

    @admin.action(description='Verify selected doctors')
    def verify_doctors(self, request, queryset):
        queryset.update(is_verified=True)
