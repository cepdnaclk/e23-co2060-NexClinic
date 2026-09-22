from celery import shared_task
from django.utils import timezone
from datetime import datetime, timedelta
from .models import MedicationReminder, MedicationLog
from notifications.models import Notification

@shared_task
def generate_medication_logs_and_notify():
    """
    Background task to generate medication logs for today and send notifications 
    for medications scheduled within the next 30 minutes.
    """
    now = timezone.now()
    target_date = now.date()

    # 1. Generate logs for today if they don't exist
    active_reminders = MedicationReminder.objects.filter(
        is_active=True,
        start_date__lte=target_date
    )

    for reminder in active_reminders:
        if reminder.end_date and reminder.end_date < target_date:
            continue
            
        for schedule in reminder.schedule_times:
            if not isinstance(schedule, dict):
                # Backward compatibility for old string-based schedule_times
                if isinstance(schedule, str):
                    schedule = {"time": schedule, "days": [0, 1, 2, 3, 4, 5, 6], "is_active": True}
                else:
                    continue
                    
            if not schedule.get("is_active", True):
                continue
                
            days = schedule.get("days", [0, 1, 2, 3, 4, 5, 6])
            if target_date.weekday() not in days:
                continue
                
            time_str = schedule.get("time")
            if not time_str:
                continue
                
            try:
                time_obj = datetime.strptime(time_str, "%H:%M").time()
                dt = timezone.make_aware(datetime.combine(target_date, time_obj))
                
                # We do get_or_create to ensure log exists for this scheduled time
                MedicationLog.objects.get_or_create(
                    reminder=reminder,
                    patient=reminder.patient,
                    scheduled_for=dt,
                )
            except ValueError:
                pass

    # 2. Check for upcoming pending medications within the next 60 minutes
    time_threshold = now + timedelta(minutes=60)
    
    upcoming_logs = MedicationLog.objects.filter(
        status=MedicationLog.Status.PENDING,
        notification_sent=False,
        scheduled_for__lte=time_threshold,
        scheduled_for__gte=now - timedelta(hours=1) # Don't notify for logs that are too old (e.g., > 1 hr past due)
    ).select_related('patient__user', 'reminder')

    for log in upcoming_logs:
        patient_user = log.patient.user
        medicine_name = log.medicine_name or (log.reminder.medicine_name if log.reminder else "Unknown")
        scheduled_time = log.scheduled_for.strftime("%I:%M %p")
        
        # Create notification
        Notification.objects.create(
            recipient=patient_user,
            notification_type=Notification.NotificationType.MEDICATION_REMINDER,
            title="Time for your Medication",
            message=f"Reminder: It's almost time to take your {medicine_name} at {scheduled_time}.",
            action_url="/patient/dashboard/medications"
        )
        
        # Mark as notified
        log.notification_sent = True
        log.save(update_fields=['notification_sent'])

    return f"Processed notifications for {upcoming_logs.count()} medication logs."
