from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from patient.models import PatientProfile
from doctor.models import DoctorProfile

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'PATIENT':
            PatientProfile.objects.create(user=instance, full_name=instance.email)
        elif instance.role == 'DOCTOR':
            DoctorProfile.objects.create(user=instance, specialization="General")
