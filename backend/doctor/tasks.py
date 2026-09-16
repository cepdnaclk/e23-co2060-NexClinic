from celery import shared_task
from django.utils import timezone
from .models import Appointment

@shared_task
def expire_past_appointments():
    """
    Marks PENDING or ACCEPTED appointments as EXPIRED
    if their slot end time has passed.
    """
    now = timezone.now().time()
    today = timezone.now().date()
    
    # We find appointments that are strictly in the past
    # and still pending or accepted
    # An appointment is in the past if:
    # 1. its date is strictly less than today
    # 2. its date is today, and its end_time is less than now

    appointments_to_expire = Appointment.objects.filter(
        status__in=[Appointment.Status.PENDING, Appointment.Status.ACCEPTED]
    ).filter(
        slot__date__lt=today
    ) | Appointment.objects.filter(
        status__in=[Appointment.Status.PENDING, Appointment.Status.ACCEPTED],
        slot__date=today,
        slot__end_time__lt=now
    )
    
    count = appointments_to_expire.update(status=Appointment.Status.EXPIRED)
    
    if count > 0:
        print(f"[EXPIRE APPOINTMENTS] Marked {count} appointments as EXPIRED.")
        
    return count
