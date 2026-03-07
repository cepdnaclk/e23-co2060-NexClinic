from django.db import models
from django.conf import settings

class DoctorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile')
    
    specialization = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50)
    phone = models.CharField(max_length=15)
    full_name = models.CharField(max_length=255, default="Doctor")
    preferred_name = models.CharField(max_length=100, default="Dr.")
    nic_number = models.CharField(max_length=20, default="")
    is_verified = models.BooleanField(default=False)
    experience_years = models.IntegerField(default=0)
    profile_picture = models.ImageField(upload_to='doctor_profiles/', null=True, blank=True)
    location = models.CharField(max_length=255, default="")
    qualifications = models.TextField(default="")
    hospitals = models.CharField(max_length=255, default="")
    languages_spoken = models.CharField(max_length=255, default="")
    availability = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.preferred_name} ({self.specialization})"


class DoctorAppointmentAvailability(models.Model):
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name='appointment_availabilities'
    )
    day_of_week = models.CharField(max_length=12)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'day_of_week', 'start_time', 'end_time'],
                name='unique_doctor_appointment_availability_window',
            )
        ]

    def __str__(self):
        return f"{self.doctor.preferred_name} - {self.day_of_week} {self.start_time} to {self.end_time}"


class AppointmentAvailableSlot(models.Model):
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='available_slots')
    date = models.DateField()
    day_of_week = models.CharField(max_length=12, blank=True, default='')
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'date', 'start_time', 'end_time'],
                name='unique_doctor_appointment_slot',
            )
        ]

    def save(self, *args, **kwargs):
        # Keep day_of_week consistent even if the client does not send it.
        if not self.day_of_week:
            self.day_of_week = self.date.strftime('%A')
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.doctor.preferred_name} - {self.date} {self.start_time} to {self.end_time}"


class DoctorOnlineAdviceAvailability(models.Model):
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='online_advice_availabilities')
    day_of_week = models.CharField(max_length=12)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'day_of_week', 'start_time', 'end_time'],
                name='unique_doctor_online_advice_availability_window',
            )
        ]
    
    def __str__(self):
        return f"{self.doctor.preferred_name} - {self.day_of_week} {self.start_time} to {self.end_time}"
