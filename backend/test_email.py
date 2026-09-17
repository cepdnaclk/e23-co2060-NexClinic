import os
import django
import time

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "main.settings")
django.setup()

from django.conf import settings
from django.core import mail
from django.utils import timezone
import datetime
from django.contrib.auth import get_user_model
User = get_user_model()
from patient.models import PatientProfile
from doctor.models import DoctorProfile, AppointmentAvailableSlot, Appointment
from hospital.models import Hospital

# Force email backend to locmem so we can inspect sent emails without actually sending them
settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

def run_test():
    email_to_test = "dilithsamarakoon@gmail.com"
    
    print(f"--- Testing Appointment Email for {email_to_test} ---")
    
    # 1. Get the patient user
    try:
        user = User.objects.get(email=email_to_test)
        patient = PatientProfile.objects.get(user=user)
        print(f"Found patient: {patient.full_name}")
    except User.DoesNotExist:
        print(f"ERROR: User with email {email_to_test} does not exist.")
        return
    except PatientProfile.DoesNotExist:
        print(f"ERROR: User exists but has no PatientProfile.")
        return

    # 2. Get or create a doctor for the test
    doctor = DoctorProfile.objects.first()
    if not doctor:
        print("ERROR: No doctors found in the database. Please create one first.")
        return
    print(f"Using doctor: {doctor.preferred_name}")

    # 3. Get or create a hospital
    hospital = Hospital.objects.first()

    # 4. Create an available slot for today
    today = timezone.localdate()
    slot, created = AppointmentAvailableSlot.objects.get_or_create(
        doctor=doctor,
        hospital=hospital,
        date=today,
        start_time=datetime.time(9, 0, 0),
        end_time=datetime.time(9, 30, 0)
    )

    # Clear the email outbox
    mail.outbox = []

    # 5. Create an Appointment
    print("Creating an ACCEPTED appointment (This triggers the email)...")
    
    # Patch send_templated_email to intercept calls
    from notifications import mail_utils
    original_send = mail_utils.send_templated_email
    
    sent_emails = []
    def mock_send(template_name, context, recipients, fail_silently=False):
        sent_emails.append({
            "template": template_name,
            "context": context,
            "recipients": recipients
        })
        return 1
        
    mail_utils.send_templated_email = mock_send

    appointment = Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        hospital=hospital,
        slot=slot,
        status=Appointment.Status.ACCEPTED,
        appointment_fee=100.00
    )

    # Wait a moment for the email thread to finish
    time.sleep(2)
    
    # Restore original
    mail_utils.send_templated_email = original_send

    # 6. Check the sent emails
    if len(sent_emails) > 0:
        print(f"\nSUCCESS: {len(sent_emails)} email(s) sent!")
        for i, email in enumerate(sent_emails):
            print(f"\n--- Email {i+1} ---")
            print(f"To: {email['recipients']}")
            print(f"Template: {email['template']}")
            print("Context:")
            for k, v in email['context'].items():
                print(f"  {k}: {v}")
            print("-------------------")
    else:
        print("\nFAILURE: No emails were sent. Check if the signal failed silently.")

    # Cleanup the test appointment and slot
    print("\nCleaning up test data...")
    appointment.delete()
    if created:
        slot.delete()
    print("Done!")

if __name__ == "__main__":
    run_test()
