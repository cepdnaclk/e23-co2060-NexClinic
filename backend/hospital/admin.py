from django.contrib import admin
from .models import HospitalAdminProfile, HospitalAdmin, ActivityLog


@admin.register(HospitalAdminProfile)
class HospitalAdminProfileAdmin(admin.ModelAdmin):
	list_display = ('full_name', 'user', 'hospital_name', 'employee_id', 'designation', 'status_label', 'is_verified', 'created_at')
	list_filter = ('is_verified', 'user__is_active')
	search_fields = ('full_name', 'user__email', 'employee_id')
	actions = ('approve_hospital_admins', 'unapprove_hospital_admins')

	@admin.display(description='Hospital')
	def hospital_name(self, obj):
		role = HospitalAdmin.objects.filter(user=obj.user).select_related('hospital').first()
		return role.hospital.name if role else '-'

	@admin.display(description='Status')
	def status_label(self, obj):
		if not obj.user.is_active:
			return 'Rejected/Disabled'
		if obj.is_verified:
			return 'Verified'
		return 'Pending'

	@admin.action(description='Approve selected hospital admins')
	def approve_hospital_admins(self, request, queryset):
		approved = 0
		for profile in queryset.select_related('user'):
			profile.is_verified = True
			profile.save(update_fields=['is_verified'])

			if not profile.user.is_active:
				profile.user.is_active = True
				profile.user.save(update_fields=['is_active'])

			HospitalAdmin.objects.filter(user=profile.user).update(is_active=True)
			approved += 1

		self.message_user(request, f'Approved {approved} hospital admin account(s).', level='SUCCESS')

	@admin.action(description='Unapprove selected hospital admins')
	def unapprove_hospital_admins(self, request, queryset):
		unapproved = 0
		for profile in queryset.select_related('user'):
			profile.is_verified = False
			profile.save(update_fields=['is_verified'])

			profile.user.is_active = False
			profile.user.save(update_fields=['is_active'])

			HospitalAdmin.objects.filter(user=profile.user).update(is_active=False)
			unapproved += 1

		self.message_user(request, f'Unapproved {unapproved} hospital admin account(s).', level='WARNING')


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
	list_display = ('created_at', 'action', 'user', 'hospital')
