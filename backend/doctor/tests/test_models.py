from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import time, timedelta, datetime

from users.models import CustomUser
from hospital.models import Hospital
from doctor.models import (
    DoctorProfile,
    DoctorAppointmentAvailability,
    AppointmentAvailableSlot,
    DoctorOnlineAdviceAvailability,
    Appointment
)
from patient.models import PatientProfile

class DoctorModelTests(TestCase):
    def setUp(self):
        # Create a user for the doctor
        self.doctor_user = CustomUser.objects.create_user(
            email="doc_model@example.com",
            password="pass",
            role=CustomUser.Role.DOCTOR,
        )
        # Create a doctor profile
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            specialization="Cardiology",
            license_number="SLMC/123",
            phone="0711111111",
            full_name="Model Doctor",
            preferred_name="Dr. Model",
        )
        # Create a hospital
        self.hospital = Hospital.objects.create(
            name="Test Hospital", 
            address="123 Hospital Road"
        )
        
        # Create a patient for appointments
        self.patient_user = CustomUser.objects.create_user(
            email="pat_model@example.com",
            password="pass",
            role=CustomUser.Role.PATIENT,
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            full_name="Model Patient",
            phone="0777777777",
            date_of_birth=timezone.now().date() - timedelta(days=365*20)
        )

    def test_doctor_profile_str(self):
        self.assertEqual(str(self.doctor_profile), "Dr. Model (Cardiology)")

    def test_appointment_availability_creation(self):
        availability = DoctorAppointmentAvailability.objects.create(
            doctor=self.doctor_profile,
            day_of_week="Monday",
            start_time=time(9, 0),
            end_time=time(12, 0)
        )
        self.assertEqual(str(availability), "Dr. Model - Monday 09:00:00 to 12:00:00")

    def test_online_advice_availability_creation(self):
        availability = DoctorOnlineAdviceAvailability.objects.create(
            doctor=self.doctor_profile,
            day_of_week="Tuesday",
            start_time=time(14, 0),
            end_time=time(16, 0)
        )
        self.assertEqual(str(availability), "Dr. Model - Tuesday 14:00:00 to 16:00:00")

    def test_appointment_slot_refresh_counts(self):
        now = timezone.now()
        slot = AppointmentAvailableSlot.objects.create(
            doctor=self.doctor_profile,
            date=now.date(),
            date_start=now,
            date_end=now + timedelta(hours=1),
            start_time=now.time(),
            end_time=(now + timedelta(hours=1)).time(),
            hospital=self.hospital,
            patient_limit=3
        )
        
        # Initially 0 booked
        self.assertEqual(slot.booked_count, 0)
        self.assertEqual(slot.remaining_count, 0) # remaining_count is only updated by refresh_counts()

        slot.refresh_counts()
        self.assertEqual(slot.remaining_count, 3)

        # Create an appointment in PENDING status
        Appointment.objects.create(
            slot=slot,
            doctor=self.doctor_profile,
            patient=self.patient_profile,
            hospital=self.hospital,
            status=Appointment.Status.PENDING
        )
        
        slot.refresh_counts()
        self.assertEqual(slot.booked_count, 1)
        self.assertEqual(slot.remaining_count, 2)

        # Create an appointment in ACCEPTED status
        Appointment.objects.create(
            slot=slot,
            doctor=self.doctor_profile,
            patient=self.patient_profile,
            hospital=self.hospital,
            status=Appointment.Status.ACCEPTED
        )
        
        slot.refresh_counts()
        self.assertEqual(slot.booked_count, 2)
        self.assertEqual(slot.remaining_count, 1)
        
        # Create an appointment in CANCELLED status (should not affect count)
        Appointment.objects.create(
            slot=slot,
            doctor=self.doctor_profile,
            patient=self.patient_profile,
            hospital=self.hospital,
            status=Appointment.Status.CANCELLED
        )
        
        slot.refresh_counts()
        self.assertEqual(slot.booked_count, 2)
        self.assertEqual(slot.remaining_count, 1)

    def test_appointment_clean_validates_doctor_match(self):
        # Create another doctor
        other_user = CustomUser.objects.create_user(
            email="other_doc@example.com",
            password="pass",
            role=CustomUser.Role.DOCTOR,
        )
        other_doctor = DoctorProfile.objects.create(
            user=other_user,
            specialization="Neurology",
            license_number="SLMC/456",
        )
        
        now = timezone.now()
        slot = AppointmentAvailableSlot.objects.create(
            doctor=self.doctor_profile, # belongs to self.doctor_profile
            date=now.date(),
            date_start=now,
            date_end=now + timedelta(hours=1),
            start_time=now.time(),
            end_time=(now + timedelta(hours=1)).time(),
            hospital=self.hospital,
        )
        
        appointment = Appointment(
            slot=slot,
            doctor=other_doctor, # Mismatch here
            patient=self.patient_profile,
            hospital=self.hospital,
        )
        
        with self.assertRaises(ValidationError) as context:
            appointment.clean()
        
        self.assertIn("The doctor for the appointment must match the doctor of the slot.", str(context.exception))
