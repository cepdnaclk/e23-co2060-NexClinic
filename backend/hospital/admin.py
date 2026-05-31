from django.contrib import admin
from .models import HospitalAdminProfile, ActivityLog


@admin.register(HospitalAdminProfile)
class HospitalAdminProfileAdmin(admin.ModelAdmin):
	list_display = ('full_name', 'user', 'employee_id', 'designation', 'is_verified', 'created_at')
	list_filter = ('is_verified',)
	search_fields = ('full_name', 'user__email', 'employee_id')


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
	list_display = ('created_at', 'action', 'user', 'hospital')
