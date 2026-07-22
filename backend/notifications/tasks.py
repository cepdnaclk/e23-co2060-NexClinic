from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification

@shared_task
def process_notification_delivery(notification_id):
    try:
        notification = Notification.objects.get(id=notification_id)
        recipient = notification.recipient
        
        # Determine if critical
        is_critical = notification.notification_type in [
            Notification.NotificationType.SYSTEM_ALERT, 
            Notification.NotificationType.APPOINTMENT_UPDATE
        ]
        
        # Check DND preferences
        if getattr(recipient, 'dnd_enabled', False) and not is_critical:
            return f"Notification {notification_id} delivery suppressed due to DND."
            
        subject = f"NexClinic Notification: {notification.title}"
        message = f"You have a new notification:\n\n{notification.title}\n{notification.message}\n\nLogin to NexClinic to view details."
        
        # 1. Send Email
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[recipient.email],
                fail_silently=True,
            )
            email_status = "Email sent"
        except Exception as e:
            email_status = f"Email failed ({e})"
            
        # 2. SMS Fallback for critical notifications
        sms_status = "Not applicable"
        if is_critical:
            # Mock SMS Delivery
            phone = getattr(recipient, 'phone', 'Unknown')
            if hasattr(recipient, 'doctor_profile'):
                phone = recipient.doctor_profile.phone
            elif hasattr(recipient, 'patient_profile'):
                phone = recipient.patient_profile.phone
                
            sms_status = f"Mock SMS sent to {phone}"
            print(f"[SMS FALLBACK] Sending SMS to {phone}: {notification.title}")
            
        return f"{email_status} | {sms_status}"
        
    except Notification.DoesNotExist:
        return "Notification not found."
    except Exception as e:
        return f"Failed to process delivery: {str(e)}"
