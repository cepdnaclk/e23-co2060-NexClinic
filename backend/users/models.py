from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        PATIENT = "PATIENT", "Patient"
        DOCTOR = "DOCTOR", "Doctor"
        HOSPITAL_ADMIN = "HOSPITAL_ADMIN", "Hospital Admin"

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, blank=True, null=True) # Optional, strictly using email for auth
    role = models.CharField(max_length=50, choices=Role.choices, default=Role.PATIENT)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()
 
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

class PendingUser(models.Model):
    email = models.EmailField(unique=True)
    otp_code = models.CharField(max_length=6)
    otp_code_hash = models.CharField(max_length=128, blank=True, default="")
    otp_failed_attempts = models.PositiveSmallIntegerField(default=0)
    otp_locked_until = models.DateTimeField(null=True, blank=True)
    otp_last_sent_at = models.DateTimeField(null=True, blank=True)
    password = models.CharField(max_length=128) # Store hashed password
    role = models.CharField(max_length=50)
    profile_data = models.JSONField() # Store profile-specific fields
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Pending registration for {self.email}"


class UserActivityLog(models.Model):
    class ActionType(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"
        VIEW = "VIEW", "View"
        EXPORT = "EXPORT", "Export"
        OTHER = "OTHER", "Other"

    actor_user = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
    )
    actor_email = models.EmailField(blank=True, default="")
    actor_role = models.CharField(max_length=50, blank=True, default="")
    action_type = models.CharField(max_length=30, choices=ActionType.choices, default=ActionType.OTHER)

    entity_type = models.CharField(max_length=80, blank=True, default="")
    entity_id = models.CharField(max_length=64, blank=True, default="")

    endpoint = models.CharField(max_length=255, blank=True, default="")
    request_method = models.CharField(max_length=10, blank=True, default="")
    request_id = models.CharField(max_length=64, blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")

    status_code = models.PositiveSmallIntegerField(null=True, blank=True)
    success = models.BooleanField(default=True)
    change_summary = models.TextField(blank=True, default="")
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['action_type', 'created_at']),
            models.Index(fields=['actor_user', 'created_at']),
            models.Index(fields=['entity_type', 'entity_id']),
        ]

    def __str__(self):
        actor = self.actor_email or "anonymous"
        return f"{actor} {self.action_type} {self.entity_type}:{self.entity_id}"
