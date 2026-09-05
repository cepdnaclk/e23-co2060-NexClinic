import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from users.models import CustomUser
from patient.models import PatientProfile
from doctor.models import Appointment, DoctorProfile, AppointmentAvailableSlot
from notifications.tasks import process_notification_delivery
from notifications.models import Notification

user = CustomUser.objects.filter(email='dilithsamarakoon@gmail.com').first()
if user:
    print(f"User found: {user.email}")
    if hasattr(user, 'patient_profile'):
        print(f"Phone: {user.patient_profile.phone}")
        # Find a doctor
        doctor = DoctorProfile.objects.first()
        if doctor:
            print(f"Doctor found: {doctor.user.email}")
            # Get or create an appointment
            slot = AppointmentAvailableSlot.objects.filter(doctor=doctor).first()
            if not slot:
                from datetime import date, time, datetime
                from hospital.models import Hospital
                hosp = Hospital.objects.first()
                if not hosp:
                    hosp, _ = Hospital.objects.get_or_create(name="Test Hospital")
                slot, _ = AppointmentAvailableSlot.objects.get_or_create(
                    doctor=doctor,
                    date=date.today(),
                    start_time=time(10, 0),
                    end_time=time(11, 0),
                    hospital=hosp,
                    defaults={'date_start': datetime.now(), 'date_end': datetime.now()}
                )
            if slot:
                app, created = Appointment.objects.get_or_create(
                    patient=user.patient_profile,
                    doctor=doctor,
                    slot=slot,
                    defaults={'status': Appointment.Status.PENDING}
                )
                print(f"Appointment {'created' if created else 'found'}: ID={app.id}, Status={app.status}")
                
                # Ensure the status is PENDING first so the change to ACCEPTED triggers the signal
                if not created and app.status == Appointment.Status.ACCEPTED:
                    app.status = Appointment.Status.PENDING
                    app.save()
                    
                # Update status to ACCEPTED to trigger notification
                app.status = Appointment.Status.ACCEPTED
                app.save()
                print("Status updated to ACCEPTED. Signal should have fired.")
                
                # Process latest notification synchronously
                notif = Notification.objects.filter(recipient=user).order_by('-created_at').first()
                if notif:
                    print(f"Processing notification {notif.id}: {notif.title}")
                    result = process_notification_delivery(str(notif.id))
                    print(f"Result: {result}")
                else:
                    print("No notification found!")
            else:
                print("No slots available to test.")
        else:
            print("No doctors available.")
    else:
        print("No patient profile.")
else:
    print("User not found.")
