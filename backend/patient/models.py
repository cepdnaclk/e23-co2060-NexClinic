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
    city = models.CharField(max_length=100, blank=True, default="")
    postal_code = models.CharField(max_length=20, blank=True, default="")
    country = models.CharField(max_length=100, blank=True, default="")
    blood_type = models.CharField(max_length=10, blank=True, default="")
    allergies = models.TextField(blank=True, default="")
    medications = models.TextField(blank=True, default="")
    medical_history = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=255, blank=True, default="")
    emergency_contact_phone = models.CharField(max_length=20, blank=True, default="")
    emergency_contact_relation = models.CharField(max_length=100, blank=True, default="")
    insurance_provider = models.CharField(max_length=255, blank=True, default="")
    insurance_policy_number = models.CharField(max_length=100, blank=True, default="")
    profile_picture = models.ImageField(upload_to='patient_profiles/', null=True, blank=True)

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"
 
