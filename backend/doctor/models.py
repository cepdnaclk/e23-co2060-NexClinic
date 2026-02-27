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
    
    def __str__(self):
        return f"{self.preferred_name} ({self.specialization})"
