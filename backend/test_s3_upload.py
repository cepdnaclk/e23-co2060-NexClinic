import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from patient.models import PatientProfile

p = PatientProfile.objects.first()
p.profile_picture = 'patient_profiles/man.jpg'
p.save(update_fields=['profile_picture'])
print("Updated to man.jpg")
