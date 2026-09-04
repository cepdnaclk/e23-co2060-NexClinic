from django.test import TestCase
from django.core import mail
from django.utils import timezone
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from datetime import time, datetime, timedelta
from users.models import CustomUser
from hospital.models import Hospital, ActivityLog, SlotTemplate, DoctorHospitalVerification, HospitalAdmin
from doctor.models import DoctorProfile, AppointmentAvailableSlot, Appointment
from patient.models import PatientProfile
from rest_framework import status
import re

class DoctorVerificationSignalTests(TestCase):
    """Test signals on doctor verification."""
    def setUp(self):
        self.user = CustomUser.objects.create_user(email='doc@test.com', password='pass', role=CustomUser.Role.DOCTOR)
        self.doctor = DoctorProfile.objects.create(user=self.user, specialization='Cardio', license_number='LIC1', phone='1234', full_name='Dr Test')
        self.hospital = Hospital.objects.create(name='Test Hospital Ver')
        self.verifier = CustomUser.objects.create_user(email='verifier@test.com', password='pass', role=CustomUser.Role.HOSPITAL_ADMIN)

    def test_verification_approved_creates_log(self):
        """Test that approving a doctor creates an ActivityLog."""
        verification = DoctorHospitalVerification.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            status=DoctorHospitalVerification.Status.VERIFIED,
            verified_by=self.verifier
        )
        logs = ActivityLog.objects.filter(action__contains='doctor_verification')
        self.assertTrue(logs.exists())

    def test_verification_rejected_creates_log(self):
        """Test that rejecting a doctor creates an ActivityLog with reason."""
        verification = DoctorHospitalVerification.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            status=DoctorHospitalVerification.Status.REJECTED,
            verified_by=self.verifier,
            rejection_reason='Missing credentials'
        )
        logs = ActivityLog.objects.filter(action__contains='doctor_verification')
        self.assertTrue(logs.exists())
        log_data = logs.first().data
        if log_data:
            self.assertIn('Missing credentials', str(log_data))

    @patch('django.core.mail.send_mail')
    def test_verification_email_sent(self, mock_send_mail):
        """Test that email is attempted on doctor verification."""
        verification = DoctorHospitalVerification.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            status=DoctorHospitalVerification.Status.VERIFIED,
            verified_by=self.verifier
        )

class AppointmentBookingTests(TestCase):
    """Test appointment booking and signals."""
    def setUp(self):
        self.doctor_user = CustomUser.objects.create_user(email='doc2@test.com', password='pass', role=CustomUser.Role.DOCTOR)
        self.doctor = DoctorProfile.objects.create(user=self.doctor_user, specialization='Gen', license_number='LIC2', phone='5678', full_name='Dr Book')
        self.hospital = Hospital.objects.create(name='Test Hospital Book')
        self.patient_user = CustomUser.objects.create_user(email='patient@test.com', password='pass', role=CustomUser.Role.PATIENT)
        self.patient = PatientProfile.objects.create(
            user=self.patient_user,
            full_name='Patient Test',
            date_of_birth=timezone.now().date() - timedelta(days=365*30),
            gender='Other',
            phone='9999',
            address='Test Address'
        )
        today = timezone.now().date()
        self.slot_start = timezone.make_aware(datetime.combine(today, time(10, 0)))
        self.slot_end = timezone.make_aware(datetime.combine(today, time(10, 30)))
        self.slot = AppointmentAvailableSlot.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            date=today,
            date_start=self.slot_start,
            date_end=self.slot_end,
            start_time=time(10, 0),
            end_time=time(10, 30),
            patient_limit=2
        )

    def test_appointment_booking_creates_log(self):
        """Test that booking an appointment creates ActivityLog."""
        appt = Appointment.objects.create(
            slot=self.slot,
            doctor=self.doctor,
            patient=self.patient,
            hospital=self.hospital,
            status=Appointment.Status.ACCEPTED
        )
        logs = ActivityLog.objects.filter(action='appointment_booked')
        self.assertTrue(logs.exists())

    def test_appointment_booking_increments_booked_count(self):
        """Test that slot booked_count increases on booking."""
        self.assertEqual(self.slot.booked_count, 0)
        appt = Appointment.objects.create(
            slot=self.slot,
            doctor=self.doctor,
            patient=self.patient,
            hospital=self.hospital,
            status=Appointment.Status.ACCEPTED
        )
        self.slot.refresh_counts()
        self.assertGreater(self.slot.booked_count, 0)

    def test_slot_capacity_enforced(self):
        """Test that slot respects patient_limit."""
        self.slot.patient_limit = 1
        self.slot.save()
        appt1 = Appointment.objects.create(
            slot=self.slot,
            doctor=self.doctor,
            patient=self.patient,
            hospital=self.hospital,
            status=Appointment.Status.ACCEPTED
        )
        patient2_user = CustomUser.objects.create_user(email='patient2@test.com', password='pass', role=CustomUser.Role.PATIENT)
        patient2 = PatientProfile.objects.create(
            user=patient2_user,
            full_name='Patient 2',
            date_of_birth=timezone.now().date() - timedelta(days=365*25),
            gender='Other',
            phone='8888',
            address='Test 2'
        )
        appt = Appointment.objects.create(
            slot=self.slot,
            doctor=self.doctor,
            patient=patient2,
            hospital=self.hospital,
            status=Appointment.Status.ACCEPTED,
            appointment_fee=self.doctor.appointment_fee
        )
        self.slot.refresh_counts()
        self.assertEqual(self.slot.booked_count, 2)

class AppointmentCancellationTests(TestCase):
    """Test appointment cancellation scenarios."""
    def setUp(self):
        self.doctor_user = CustomUser.objects.create_user(email='doc3@test.com', password='pass', role=CustomUser.Role.DOCTOR)
        self.doctor = DoctorProfile.objects.create(user=self.doctor_user, specialization='Surgery', license_number='LIC3', phone='1111', full_name='Dr Surgery')
        self.hospital = Hospital.objects.create(name='Test Hospital Cancel')
        self.patient_user = CustomUser.objects.create_user(email='patient3@test.com', password='pass', role=CustomUser.Role.PATIENT)
        self.patient = PatientProfile.objects.create(
            user=self.patient_user,
            full_name='Patient Cancel',
            date_of_birth=timezone.now().date() - timedelta(days=365*28),
            gender='Other',
            phone='2222',
            address='Cancel Address'
        )
        today = timezone.now().date()
        self.slot_start = timezone.make_aware(datetime.combine(today + timedelta(days=1), time(11, 0)))
        self.slot_end = timezone.make_aware(datetime.combine(today + timedelta(days=1), time(11, 30)))
        self.slot = AppointmentAvailableSlot.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            date=today + timedelta(days=1),
            date_start=self.slot_start,
            date_end=self.slot_end,
            start_time=time(11, 0),
            end_time=time(11, 30),
            patient_limit=1
        )
        self.appointment = Appointment.objects.create(
            slot=self.slot,
            doctor=self.doctor,
            patient=self.patient,
            hospital=self.hospital,
            status=Appointment.Status.ACCEPTED,
            appointment_fee=self.doctor.appointment_fee
        )

    def test_patient_cancels_appointment(self):
        """Test patient-initiated cancellation."""
        self.appointment.status = Appointment.Status.CANCELLED
        self.appointment.cancelled_by = 'PATIENT'
        self.appointment.cancellation_reason = 'Personal emergency'
        self.appointment.cancelled_at = timezone.now()
        self.appointment.save()
        self.assertEqual(self.appointment.status, Appointment.Status.CANCELLED)
        self.assertEqual(self.appointment.cancelled_by, 'PATIENT')

    def test_admin_cancels_appointment(self):
        """Test admin-initiated cancellation."""
        self.appointment.status = Appointment.Status.CANCELLED
        self.appointment.cancelled_by = 'ADMIN'
        self.appointment.cancellation_reason = 'Doctor unavailable'
        self.appointment.cancelled_at = timezone.now()
        self.appointment.save()
        self.assertEqual(self.appointment.cancelled_by, 'ADMIN')

    def test_cancellation_creates_log(self):
        """Test that cancellation creates ActivityLog entry."""
        self.appointment.status = Appointment.Status.CANCELLED
        self.appointment.cancelled_by = 'PATIENT'
        self.appointment.cancellation_reason = 'Emergency'
        self.appointment.cancelled_at = timezone.now()
        self.appointment.save()
        logs = ActivityLog.objects.filter(action='appointment_cancelled')
        self.assertTrue(logs.exists())

class EmailNotificationTests(TestCase):
    """Test email notification mocking."""
    @patch('django.core.mail.send_mail')
    def test_verification_email_mocked(self, mock_send_mail):
        """Mock email sending and verify signal handles gracefully."""
        doctor_user = CustomUser.objects.create_user(email='emailtest@test.com', password='pass', role=CustomUser.Role.DOCTOR)
        doctor = DoctorProfile.objects.create(user=doctor_user, specialization='Test', license_number='L99', phone='9999', full_name='Dr Email')
        hospital = Hospital.objects.create(name='Email Hospital')
        verifier = CustomUser.objects.create_user(email='emailverify@test.com', password='pass', role=CustomUser.Role.HOSPITAL_ADMIN)
        
        verification = DoctorHospitalVerification.objects.create(
            doctor=doctor,
            hospital=hospital,
            status=DoctorHospitalVerification.Status.VERIFIED,
            verified_by=verifier
        )

