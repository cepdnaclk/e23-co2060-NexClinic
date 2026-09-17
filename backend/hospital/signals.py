from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from django.utils import timezone
from .models import ActivityLog, DoctorHospitalVerification
from notifications.mail_utils import send_templated_email

# Import lazily to avoid circular imports

@receiver(post_save, sender=DoctorHospitalVerification)
def doctor_verification_handler(sender, instance, created, **kwargs):
    # Notify doctor when verification status changes
    try:
        doctor_user = instance.doctor.user
        
        template_name = None
        context = {
            "hospital_name": instance.hospital.name,
            "doctor_email": doctor_user.email,
        }
        
        if instance.status == DoctorHospitalVerification.Status.VERIFIED:
            template_name = "doctor_verification_verified"
        elif instance.status == DoctorHospitalVerification.Status.REJECTED:
            template_name = "doctor_verification_rejected"
            context["rejection_reason"] = instance.rejection_reason
            
        if not template_name:
            return

        # Send email (best effort)
        import threading
        try:
            threading.Thread(
                target=send_templated_email, 
                args=(template_name, context, [doctor_user.email]),
                kwargs={"fail_silently": True}
            ).start()
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
        # Sync DoctorProfile.verified_hospitals M2M so the doctor's verified hospitals
        # reflect the current verification status for this hospital.
        try:
            doctor_profile = instance.doctor
            if instance.status == DoctorHospitalVerification.Status.VERIFIED:
                doctor_profile.verified_hospitals.add(instance.hospital)
            else:
                # For PENDING/REJECTED and other non-VERIFIED states remove association
                doctor_profile.verified_hospitals.remove(instance.hospital)
        except Exception:
            # Best-effort sync; do not break the signal on errors
            pass
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
            context = {
                "patient_name": instance.patient.full_name,
                "doctor_name": instance.doctor.preferred_name,
                "date": instance.slot.date,
                "time": instance.slot.start_time,
                "appointment_number": instance.id
            }
            import threading
            try:
                threading.Thread(
                    target=send_templated_email, 
                    args=("appointment_confirmed", context, [patient_email]),
                    kwargs={"fail_silently": True}
                ).start()
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
            context = {
                "patient_name": instance.patient.full_name,
                "doctor_name": instance.doctor.preferred_name,
                "date": instance.slot.date,
                "cancellation_reason": instance.cancellation_reason or 'Not provided'
            }
            import threading
            try:
                threading.Thread(
                    target=send_templated_email, 
                    args=("appointment_cancelled", context, [patient_email]),
                    kwargs={"fail_silently": True}
                ).start()
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
