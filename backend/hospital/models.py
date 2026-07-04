from django.conf import settings
from django.db import models


class Hospital(models.Model):
    name = models.CharField(max_length=255, unique=True)
    address = models.TextField(blank=True, default="")
    contact_numbers = models.CharField(max_length=255, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class HospitalAdmin(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hospital_app_admin_roles",
    )
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name="admins",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "hospital")

    def __str__(self):
        return f"{self.user} @ {self.hospital}"


class HospitalAdminProfile(models.Model):
    """Stores profile details for hospital admin users. Similar to PatientProfile/DoctorProfile.
    System admins must verify this profile (`is_verified=True`) before the admin can operate.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hospital_admin_profile'
    )

    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, default='Other')
    nic_number = models.CharField(max_length=20, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    employee_id = models.CharField(max_length=100, blank=True, default='')
    designation = models.CharField(max_length=100, blank=True, default='')
    date_of_joining = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"


class DoctorHospitalVerification(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"

    doctor = models.ForeignKey(
        "doctor.DoctorProfile",
        on_delete=models.CASCADE,
        related_name="hospital_app_verifications",
    )
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name="doctor_verifications",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="hospital_app_verifications_done",
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("doctor", "hospital")

    def __str__(self):
        return f"{self.doctor} - {self.hospital} ({self.status})"


class SlotTemplate(models.Model):
    doctor = models.ForeignKey(
        "doctor.DoctorProfile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="hospital_app_slot_templates",
    )
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name="slot_templates",
    )
    day_of_week = models.IntegerField(help_text="0=Monday .. 6=Sunday")
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveIntegerField(default=30)
    default_patient_limit = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="hospital_app_created_slot_templates",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["doctor", "hospital", "day_of_week"]),
        ]

    def __str__(self):
        return f"Template: {self.doctor} @ {self.hospital} on {self.day_of_week} {self.start_time}-{self.end_time}"


class DoctorSlotTemplateAssignment(models.Model):
    doctor = models.ForeignKey(
        "doctor.DoctorProfile",
        on_delete=models.CASCADE,
        related_name="template_assignments",
    )
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name="doctor_template_assignments",
    )
    slot_template = models.ForeignKey(
        SlotTemplate,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_template_assignments",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["doctor", "hospital"]),
        ]

    def __str__(self):
        return f"Assignment: {self.doctor} - {self.slot_template} ({self.start_date} to {self.end_date})"



class ActivityLog(models.Model):
    """Audit log for admin actions and important events."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='hospital_activity_logs'
    )
    hospital = models.ForeignKey(Hospital, null=True, blank=True, on_delete=models.SET_NULL, related_name='activity_logs')
    action = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100, blank=True, default='')
    object_id = models.CharField(max_length=64, blank=True, default='')
    data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['hospital', 'action', 'created_at'])]

    def __str__(self):
        return f"{self.created_at}: {self.action} by {self.user}"