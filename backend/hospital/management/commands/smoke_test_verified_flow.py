from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.db.models import F

from rest_framework.test import APIRequestFactory, force_authenticate

from users.models import CustomUser
from patient.models import PatientProfile
from doctor.models import AppointmentAvailableSlot, Appointment
from patient.views import PatientAvailableAppointmentSlotsView, PatientAppointmentsView


class Command(BaseCommand):
    help = 'Run smoke tests for verified hospital flows (slots listing and booking)'

    def handle(self, *args, **options):
        factory = APIRequestFactory()

        # Ensure a patient exists
        patient_user, _ = CustomUser.objects.get_or_create(email='smoketest_patient@example.com', defaults={'role': CustomUser.Role.PATIENT, 'is_active': True})
        patient_profile, _ = PatientProfile.objects.get_or_create(user=patient_user, defaults={'full_name': 'Smoke Test Patient', 'date_of_birth': timezone.now().date(), 'gender': 'Other', 'phone': '000', 'address': 'Nowhere'})

        # Find a verified slot and an unverified slot
        verified_slot = AppointmentAvailableSlot.objects.filter(doctor__verified_hospitals__id=F('hospital_id')).first()
        unverified_slot = AppointmentAvailableSlot.objects.exclude(doctor__verified_hospitals__id=F('hospital_id')).first()

        self.stdout.write(f'Found verified_slot={getattr(verified_slot, "id", None)}, unverified_slot={getattr(unverified_slot, "id", None)}')

        # Call appointment-slots view
        req = factory.get('/api/patient/appointment-slots/')
        force_authenticate(req, user=patient_user)
        view = PatientAvailableAppointmentSlotsView.as_view()
        resp = view(req)
        slots = resp.data.get('slots') if hasattr(resp, 'data') else None
        self.stdout.write(f'Patient slot listing returned {len(slots) if slots is not None else "?"} slots')

        # Attempt booking an unverified slot (should fail)
        if unverified_slot:
            post_req = factory.post('/api/patient/appointments/', {'slot_id': unverified_slot.id}, format='json')
            force_authenticate(post_req, user=patient_user)
            post_view = PatientAppointmentsView.as_view()
            post_resp = post_view(post_req)
            self.stdout.write(f'Booking unverified slot response status: {getattr(post_resp, "status_code", None)}; data: {getattr(post_resp, "data", None)}')
        else:
            self.stdout.write('No unverified slot found to test booking rejection.')

        # Attempt booking a verified slot (should succeed)
        if verified_slot:
            post_req = factory.post('/api/patient/appointments/', {'slot_id': verified_slot.id}, format='json')
            force_authenticate(post_req, user=patient_user)
            post_view = PatientAppointmentsView.as_view()
            post_resp = post_view(post_req)
            self.stdout.write(f'Booking verified slot response status: {getattr(post_resp, "status_code", None)}; data: {getattr(post_resp, "data", None)}')
        else:
            self.stdout.write('No verified slot found to test booking success.')
