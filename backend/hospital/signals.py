from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import ActivityLog, DoctorHospitalVerification

# Import lazily to avoid circular imports

@receiver(post_save, sender=DoctorHospitalVerification)
def doctor_verification_handler(sender, instance, created, **kwargs):
    # Notify doctor when verification status changes
    try:
        doctor_user = instance.doctor.user
        subject = f"Your verification status at {instance.hospital.name} changed"
        if instance.status == DoctorHospitalVerification.Status.VERIFIED:
            message = f"Hello {doctor_user.email},\n\nYour profile has been verified for {instance.hospital.name}."
        elif instance.status == DoctorHospitalVerification.Status.REJECTED:
            message = f"Hello {doctor_user.email},\n\nYour verification was rejected for {instance.hospital.name}. Reason: {instance.rejection_reason}"
        else:
            return

        # Send email (best effort)
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [doctor_user.email])
        except Exception:
            pass

        # Log activity
        ActivityLog.objects.create(
            user=instance.verified_by,
            hospital=instance.hospital,
            action=f"doctor_verification_{instance.status.lower()}",
            model_name='DoctorHospitalVerification',
            object_id=str(instance.id),
            data={'doctor_id': instance.doctor.id, 'reason': instance.rejection_reason},
            created_at=timezone.now(),
        )
    except Exception:
        return


@receiver(post_save)
def appointment_notifications(sender, instance, created, **kwargs):
    # Only act on Appointment model from doctor app
    from doctor.models import Appointment
    if sender is not Appointment:
        return

    try:
        # Booking created and accepted
        if created and instance.status == Appointment.Status.ACCEPTED:
            patient_email = instance.patient.user.email
            subject = "Appointment confirmed"
            message = (
                f"Hello {instance.patient.full_name},\n\n"
                f"Your appointment with {instance.doctor.preferred_name} at {instance.slot.date} "
                f"{instance.slot.start_time} has been confirmed."
            )
            try:
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [patient_email])
            except Exception:
                pass

            ActivityLog.objects.create(
                user=instance.patient.user,
                hospital=instance.hospital,
                action='appointment_booked',
                model_name='Appointment',
                object_id=str(instance.id),
                data={'slot_id': instance.slot.id},
            )

        # Cancellation by admin or patient
        if not created and instance.status == Appointment.Status.CANCELLED:
            patient_email = instance.patient.user.email
            subject = "Appointment cancelled"
            message = (
                f"Hello {instance.patient.full_name},\n\n"
                f"Your appointment with {instance.doctor.preferred_name} on {instance.slot.date} "
                f"has been cancelled. Reason: {instance.cancellation_reason or 'Not provided'}"
            )
            try:
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [patient_email])
            except Exception:
                pass

            ActivityLog.objects.create(
                user=instance.cancelled_by and None,
                hospital=instance.hospital,
                action='appointment_cancelled',
                model_name='Appointment',
                object_id=str(instance.id),
                data={'cancelled_by': instance.cancelled_by, 'reason': instance.cancellation_reason},
            )
    except Exception:
        return
