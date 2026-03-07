from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, UserActivityLog

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('role',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'role'),
        }),
    )
    search_fields = ('email',)
    ordering = ('email',)

admin.site.register(CustomUser, CustomUserAdmin)

from .models import PendingUser

@admin.register(PendingUser)
class PendingUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'otp_code', 'created_at', 'expires_at')
    list_filter = ('role', 'created_at')
    search_fields = ('email',)


@admin.register(UserActivityLog)
class UserActivityLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'actor_email', 'actor_role', 'action_type', 'entity_type', 'entity_id', 'status_code', 'success')
    list_filter = ('action_type', 'actor_role', 'success', 'created_at')
    search_fields = ('actor_email', 'entity_type', 'entity_id', 'endpoint', 'request_id')
    readonly_fields = (
        'actor_user',
        'actor_email',
        'actor_role',
        'action_type',
        'entity_type',
        'entity_id',
        'endpoint',
        'request_method',
        'request_id',
        'ip_address',
        'user_agent',
        'status_code',
        'success',
        'change_summary',
        'old_values',
        'new_values',
        'metadata',
        'created_at',
    )
    ordering = ('-created_at',)
