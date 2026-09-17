from celery import shared_task
from django.conf import settings
from .models import Notification
from .mail_utils import send_templated_email
from .email_templates import EMAIL_TEMPLATES
import requests

@shared_task
def process_notification_delivery(notification_id):
    try:
        notification = Notification.objects.get(id=notification_id)
        recipient = notification.recipient
        
        # Determine if critical
        is_critical = notification.notification_type in [
            Notification.NotificationType.SYSTEM_ALERT, 
            Notification.NotificationType.APPOINTMENT_UPDATE,
            Notification.NotificationType.MEDICATION_REMINDER
        ]
        
        # Check DND preferences
        if getattr(recipient, 'dnd_enabled', False) and not is_critical:
            return f"Notification {notification_id} delivery suppressed due to DND."
            
        context = {
            "title": notification.title,
            "message": notification.message
        }
        
        template_name = "general_notification"
        
        # Check if a specific template exists for this notification type
        type_mapping = {
            Notification.NotificationType.MEDICATION_REMINDER: "medication_reminder",
            Notification.NotificationType.SYSTEM_ALERT: "system_alert"
        }
        
        if notification.notification_type in type_mapping:
            if type_mapping[notification.notification_type] in EMAIL_TEMPLATES:
                template_name = type_mapping[notification.notification_type]
        
        # 1. Send Email
        try:
            send_templated_email(
                template_name=template_name,
                context=context,
                recipients=[recipient.email],
                fail_silently=True,
            )
            email_status = "Email sent"
        except Exception as e:
            email_status = f"Email failed ({e})"
            
        # 2. SMS Fallback for critical notifications
        sms_status = "Not applicable"
        if is_critical:
            phone = getattr(recipient, 'phone', 'Unknown')
            if hasattr(recipient, 'doctor_profile'):
                phone = recipient.doctor_profile.phone
            elif hasattr(recipient, 'patient_profile'):
                phone = recipient.patient_profile.phone
                
            if phone != 'Unknown' and getattr(settings, 'TEXT_LK_API_TOKEN', None):
                try:
                    url = "https://app.text.lk/api/http/sms/send"
                    headers = {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "api_token": settings.TEXT_LK_API_TOKEN,
                        "recipient": phone,
                        "sender_id": settings.TEXT_LK_SENDER_ID,
                        "type": "plain",
                        "message": f"NexClinic Notification:\n{notification.title}\n{notification.message}"
                    }
                    response = requests.post(url, headers=headers, json=payload)
                    response.raise_for_status()
                    sms_status = f"SMS sent to {phone}"
                    print(f"[SMS FALLBACK] Successfully sent SMS to {phone}")
                except Exception as e:
                    sms_status = f"SMS failed ({e})"
                    print(f"[SMS FALLBACK ERROR] Failed to send SMS to {phone}: {e}")
            else:
                sms_status = "SMS skipped (No phone/API token)"
                
        return f"{email_status} | {sms_status}"
        
    except Notification.DoesNotExist:
        return "Notification not found."
    except Exception as e:
        return f"Failed to process delivery: {str(e)}"
