from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Notification
from doctor.models import Appointment
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .serializers import NotificationSerializer
from .tasks import process_notification_delivery


def _push_notification(instance):
    """Deliver optional notification side effects without breaking core requests."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"user_{instance.recipient.id}_notifications"
            serializer = NotificationSerializer(instance)
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'notify',
                    'message': serializer.data
                }
            )
    except Exception:
        # A WebSocket outage must not make appointment booking fail.
        pass

    try:
        import threading
        threading.Thread(
            target=lambda: process_notification_delivery.apply_async(
                args=[str(instance.id)],
                retry=False,
            )
        ).start()
    except Exception:
        # Email/SMS is best-effort and can be retried by an operational worker.
        pass


@receiver(pre_save, sender=Appointment)
def capture_old_appointment_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Appointment.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Appointment.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender=Appointment)
def trigger_appointment_notification(sender, instance, created, **kwargs):
    old_status = getattr(instance, '_old_status', None)
    
    if old_status != instance.status:
        if instance.status == Appointment.Status.ACCEPTED:
            Notification.objects.create(
                recipient=instance.patient.user,
                sender=instance.doctor.user,
                notification_type=Notification.NotificationType.APPOINTMENT_UPDATE,
                title="Appointment Confirmed",
                message=f"Your appointment with {instance.doctor.preferred_name} on {instance.slot.date} at {instance.slot.start_time.strftime('%I:%M %p')} has been confirmed.",
                metadata={"appointment_id": instance.id}
            )
            # Notify doctor
            Notification.objects.create(
                recipient=instance.doctor.user,
                sender=instance.patient.user,
                notification_type=Notification.NotificationType.APPOINTMENT_UPDATE,
                title="New Appointment Booked",
                message=f"Patient {instance.patient.full_name} has booked an appointment on {instance.slot.date} at {instance.slot.start_time.strftime('%I:%M %p')}.",
                metadata={"appointment_id": instance.id}
            )
        elif instance.status == Appointment.Status.CANCELLED:
            reason_text = f" Reason: {instance.cancellation_reason}" if instance.cancellation_reason else ""
            
            # Notify patient
            if instance.cancelled_by == 'ADMIN':
                msg = f"Your doctor cancelled the appointment with {instance.doctor.preferred_name} on {instance.slot.date} at {instance.slot.start_time.strftime('%I:%M %p')}.{reason_text}"
                Notification.objects.create(
                    recipient=instance.patient.user,
                    sender=instance.doctor.user,
                    notification_type=Notification.NotificationType.APPOINTMENT_UPDATE,
                    title="Appointment Cancelled",
                    message=msg.strip(),
                    metadata={"appointment_id": instance.id}
                )
            
            # Notify doctor
            patient_name = instance.patient.full_name
            canceler = "You/Admin" if instance.cancelled_by == 'ADMIN' else patient_name
            doc_msg = f"{canceler} cancelled the appointment on {instance.slot.date} at {instance.slot.start_time.strftime('%I:%M %p')}.{reason_text}"
            
            Notification.objects.create(
                recipient=instance.doctor.user,
                sender=instance.patient.user,
                notification_type=Notification.NotificationType.APPOINTMENT_UPDATE,
                title="Appointment Cancelled",
                message=doc_msg.strip(),
                metadata={"appointment_id": instance.id}
            )

@receiver(post_save, sender=Notification)
def push_notification_and_email(sender, instance, created, **kwargs):
    if created:
        _push_notification(instance)
