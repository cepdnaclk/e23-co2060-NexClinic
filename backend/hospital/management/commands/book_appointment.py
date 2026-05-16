from django.core.management.base import BaseCommand, CommandError
from users.models import CustomUser
from patient.models import PatientProfile
from doctor.models import DoctorProfile, AppointmentAvailableSlot, Appointment
from hospital.models import Hospital
from datetime import datetime, date, time
from django.utils import timezone


class Command(BaseCommand):
    help = "Book an appointment for a patient with a doctor at a hospital."

    def add_arguments(self, parser):
        parser.add_argument('--patient-email', type=str, required=True, help='Patient email')
        parser.add_argument('--doctor-email', type=str, required=True, help='Doctor email')
        parser.add_argument('--hospital', type=str, required=True, help='Hospital name')
        parser.add_argument('--date', type=str, help='Appointment date (YYYY-MM-DD), default: today')
        parser.add_argument('--time', type=str, help='Appointment time (HH:MM), default: 09:00')
        parser.add_argument('--reason', type=str, default='General consultation', help='Reason for appointment')

    def handle(self, *args, **options):
        patient_email = options['patient_email']
        doctor_email = options['doctor_email']
        hospital_name = options['hospital']
        date_str = options.get('date')
        time_str = options.get('time')
        reason = options['reason']

        # Parse date
        if date_str:
            try:
                appt_date = date.fromisoformat(date_str)
            except ValueError:
                raise CommandError(f"Invalid date format: {date_str}. Use YYYY-MM-DD")
        else:
            appt_date = timezone.now().date()

        # Parse time
        if time_str:
            try:
                hour, minute = map(int, time_str.split(':'))
                appt_time = time(hour, minute)
            except (ValueError, IndexError):
                raise CommandError(f"Invalid time format: {time_str}. Use HH:MM")
        else:
            appt_time = time(9, 0)

        # Fetch patient
        try:
            patient_user = CustomUser.objects.get(email=patient_email)
            patient = PatientProfile.objects.get(user=patient_user)
        except CustomUser.DoesNotExist:
            raise CommandError(f"Patient user with email {patient_email} not found")
        except PatientProfile.DoesNotExist:
            raise CommandError(f"Patient profile for {patient_email} not found")

        # Fetch doctor
        try:
            doctor_user = CustomUser.objects.get(email=doctor_email)
            doctor = DoctorProfile.objects.get(user=doctor_user)
        except CustomUser.DoesNotExist:
            raise CommandError(f"Doctor user with email {doctor_email} not found")
        except DoctorProfile.DoesNotExist:
            raise CommandError(f"Doctor profile for {doctor_email} not found")

        # Fetch hospital
        try:
            hospital = Hospital.objects.get(name=hospital_name)
        except Hospital.DoesNotExist:
            raise CommandError(f"Hospital '{hospital_name}' not found")

        # Find available slot
        dt_start = timezone.make_aware(datetime.combine(appt_date, appt_time))
        slot = AppointmentAvailableSlot.objects.filter(
            doctor=doctor,
            hospital=hospital,
            date_start__date=appt_date,
            start_time=appt_time,
            is_active=True
        ).first()

        if not slot:
            raise CommandError(
                f"No available slot found for {doctor.preferred_name} at {hospital_name} "
                f"on {appt_date} at {appt_time.strftime('%H:%M')}"
            )

        # Check capacity
        if slot.booked_count >= slot.patient_limit:
            raise CommandError(f"Slot is full (booked: {slot.booked_count}/{slot.patient_limit})")

        # Create appointment
        appointment = Appointment.objects.create(
            slot=slot,
            doctor=doctor,
            patient=patient,
            hospital=hospital,
            reason=reason,
            status=Appointment.Status.ACCEPTED
        )

        self.stdout.write(self.style.SUCCESS(
            f"\n✓ Appointment booked successfully!\n"
            f"  Patient: {patient.full_name}\n"
            f"  Doctor: {doctor.preferred_name}\n"
            f"  Hospital: {hospital.name}\n"
            f"  Date: {appt_date}\n"
            f"  Time: {appt_time.strftime('%H:%M')}\n"
            f"  Reason: {reason}\n"
            f"  Status: ACCEPTED\n"
            f"  Appointment ID: {appointment.id}"
        ))
