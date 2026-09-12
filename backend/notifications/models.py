import uuid
from django.db import models
from django.conf import settings
from main.validators import validate_public_file
from main.storage_backends import public_storage

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        SYSTEM_ALERT = "SYSTEM_ALERT", "System Alert"
        HOSPITAL_ANNOUNCEMENT = "HOSPITAL_ANNOUNCEMENT", "Hospital Announcement"
        APPOINTMENT_UPDATE = "APPOINTMENT_UPDATE", "Appointment Update"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications')
    announcement = models.ForeignKey('Announcement', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    
    notification_type = models.CharField(max_length=50, choices=NotificationType.choices, default=NotificationType.OTHER)
    title = models.CharField(max_length=255)
    message = models.TextField()
    attachment = models.FileField(
        upload_to='notifications/attachments/', null=True, blank=True,
        validators=[validate_public_file],
        storage=public_storage
    )
    
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=255, null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        return f"{self.title} -> {self.recipient.email}"


class Announcement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey('hospital.Hospital', on_delete=models.CASCADE, related_name='announcements')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='sent_campaigns')
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    attachment = models.FileField(
        upload_to='notifications/attachments/', null=True, blank=True,
        validators=[validate_public_file],
        storage=public_storage
    )
    
    target_specialization = models.CharField(max_length=100, null=True, blank=True, help_text="If set, announcement targets only this specialization")
    is_draft = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Announcement: {self.title} @ {self.hospital.name}"
