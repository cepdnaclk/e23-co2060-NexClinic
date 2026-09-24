import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from users.models import CustomUser
from doctor.models import AppointmentAvailableSlot, Appointment
from notifications.tasks import process_notification_delivery
from notifications.models import Notification

user = CustomUser.objects.filter(email='dilithsamarakoon@gmail.com').first()
print(f"User: {user.email}, Phone: {user.patient_profile.phone}")

app = Appointment.objects.filter(patient=user.patient_profile).first()
if app:
    from django.conf import settings
    settings.CELERY_TASK_ALWAYS_EAGER = True
    
    import notifications.tasks
    notifications.tasks.send_mail = lambda *args, **kwargs: print("Mock email sent")
    
    app.status = Appointment.Status.PENDING
    app.save()
    
    app.status = Appointment.Status.ACCEPTED
    app.save()
    print("Appointment set to ACCEPTED")
    
    notif = Notification.objects.filter(recipient=user).order_by('-created_at').first()
    if notif:
        print("Eager mode handled the task.")
else:
    print("No appointment found for this patient.")
