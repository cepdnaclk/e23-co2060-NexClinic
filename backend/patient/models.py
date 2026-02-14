from django.db import models
from django.conf import settings

# Patient registration model
class PatientProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_profile')
    
    full_name = models.CharField(max_length=255)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10)
    phone = models.CharField(max_length=15)
    address = models.CharField(max_length=100)
    medical_history = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"
