from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .activity_log_settings import ACTIVITY_LOG_EVENT_CATEGORY_PREFIXES
from .models import CustomUser, UserActivityLog

from django import forms
from django.contrib.auth.forms import UserChangeForm
from hospital.models import HospitalAdmin, HospitalAdminProfile

class HospitalAdminInline(admin.StackedInline):
    model = HospitalAdmin
    extra = 1

class HospitalAdminProfileInline(admin.StackedInline):
    model = HospitalAdminProfile
    extra = 1


class CustomUserCreationForm(forms.ModelForm):
    password1 = forms.CharField(
        label="Password",
        widget=forms.PasswordInput,
        help_text="Enter a strong password."
    )
    password2 = forms.CharField(
        label="Password confirmation",
        widget=forms.PasswordInput,
        help_text="Enter the same password as before, for verification."
    )

    class Meta:
        model = CustomUser
        fields = ('email', 'role', 'is_active', 'is_staff', 'is_superuser')

    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = CustomUser
        fields = '__all__'


class CustomUserAdmin(UserAdmin):
    model = CustomUser
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    list_display = ('display_name', 'email', 'role', 'is_staff', 'is_active')
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
            'fields': ('email', 'role', 'password1', 'password2', 'is_active', 'is_staff', 'is_superuser'),
        }),
    )
    search_fields = ('email', 'username', 'role', 'doctor_profile__full_name', 'patient_profile__full_name')
    ordering = ('email',)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('doctor_profile', 'patient_profile', 'hospital_admin_profile')

    def get_inlines(self, request, obj=None):
        if obj and obj.role == 'hospital_admin':
            return [HospitalAdminInline, HospitalAdminProfileInline]
        return super().get_inlines(request, obj)

    @admin.display(description='Name')
    def display_name(self, obj):
        doctor_profile = getattr(obj, 'doctor_profile', None)
        if doctor_profile and doctor_profile.full_name:
            return doctor_profile.full_name

        patient_profile = getattr(obj, 'patient_profile', None)
        if patient_profile and patient_profile.full_name:
            return patient_profile.full_name

        hospital_admin_profile = getattr(obj, 'hospital_admin_profile', None)
        if hospital_admin_profile and hospital_admin_profile.full_name:
            return hospital_admin_profile.full_name

        if obj.username:
            return obj.username

        return obj.email

admin.site.register(CustomUser, CustomUserAdmin)

from .models import PendingUser

@admin.register(PendingUser)
class PendingUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'otp_code', 'created_at', 'expires_at')
    list_filter = ('role', 'created_at')
    search_fields = ('email',)


class EventCategoryFilter(admin.SimpleListFilter):
    title = 'event category'
    parameter_name = 'event_category'

    def lookups(self, request, model_admin):
        categories = sorted({category for _, category in ACTIVITY_LOG_EVENT_CATEGORY_PREFIXES})
        return [(category, category.replace('_', ' ').title()) for category in categories]

    def queryset(self, request, queryset):
        value = self.value()
        if not value:
            return queryset
        return queryset.filter(metadata__event_category=value)


@admin.register(UserActivityLog)
class UserActivityLogAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'event_category_display',
        'actor_email',
        'actor_role',
        'action_type',
        'entity_type',
        'entity_id',
        'status_code',
        'success',
    )
    list_filter = ('action_type', EventCategoryFilter, 'actor_role', 'success', 'created_at')
    search_fields = ('actor_email', 'entity_type', 'entity_id', 'endpoint', 'request_id')
    readonly_fields = (
        'event_category_display',
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

    @admin.display(description='Event category')
    def event_category_display(self, obj):
        if isinstance(obj.metadata, dict):
            return obj.metadata.get('event_category', '')
        return ''
