from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import time, timedelta

from rest_framework.test import APIRequestFactory, force_authenticate

from users.models import CustomUser
from doctor.models import DoctorProfile, AppointmentAvailableSlot
from patient.models import PatientProfile
from patient.views import PatientAvailableAppointmentSlotsView, PatientAppointmentsView


class Command(BaseCommand):
    help = 'Create a future slot for a verified doctor and attempt booking via API views.'

    def handle(self, *args, **options):
        # Find a doctor with at least one verified hospital
        doctor = DoctorProfile.objects.filter(verified_hospitals__isnull=False).distinct().first()
        if not doctor:
            self.stdout.write('No verified doctor found. Aborting.')
            return

        hospital = doctor.verified_hospitals.first()
        if not hospital:
            self.stdout.write('Doctor has no verified hospital. Aborting.')
            return

        # Create a future slot (2 days from today)
        slot_date = timezone.localdate() + timedelta(days=2)
        start = time(9, 0)
        end = time(9, 30)

        slot = AppointmentAvailableSlot.objects.create(
            doctor=doctor,
            hospital=hospital,
            date=slot_date,
            date_start=timezone.make_aware(timezone.datetime.combine(slot_date, start)),
            date_end=timezone.make_aware(timezone.datetime.combine(slot_date, end)),
            start_time=start,
            end_time=end,
            patient_limit=1,
            is_active=True,
        )

        self.stdout.write(f'Created slot id={slot.id} for doctor id={doctor.id} at hospital id={hospital.id} on {slot_date}')

        # Prepare test patient
        patient_user, _ = CustomUser.objects.get_or_create(email='e2e_patient@example.com', defaults={'role': CustomUser.Role.PATIENT, 'is_active': True})
        patient_profile, _ = PatientProfile.objects.get_or_create(user=patient_user, defaults={'full_name': 'E2E Patient', 'date_of_birth': timezone.now().date(), 'gender': 'Other', 'phone': '000', 'address': 'Nowhere'})

        factory = APIRequestFactory()

        # Check slot is visible in patient slot listing
        req = factory.get('/api/patient/appointment-slots/', {'doctor_id': doctor.id})
        force_authenticate(req, user=patient_user)
        resp = PatientAvailableAppointmentSlotsView.as_view()(req)
        slots = resp.data.get('slots') if hasattr(resp, 'data') else None
        self.stdout.write(f'Patient listing returned {len(slots) if slots is not None else "?"} slots for doctor_id={doctor.id}')

        # Attempt booking
        post_req = factory.post('/api/patient/appointments/', {'slot_id': slot.id}, format='json')
        force_authenticate(post_req, user=patient_user)
        post_resp = PatientAppointmentsView.as_view()(post_req)
        status = getattr(post_resp, 'status_code', None)
        data = getattr(post_resp, 'data', None)
        self.stdout.write(f'Booking response status: {status}; data: {data}')
