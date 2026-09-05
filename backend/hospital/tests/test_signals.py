from django.test import TestCase
from unittest.mock import patch
from django.utils import timezone
from users.models import CustomUser
from hospital.models import Hospital, DoctorHospitalVerification, ActivityLog, SlotTemplate
from doctor.models import DoctorProfile, AppointmentAvailableSlot, Appointment
from patient.models import PatientProfile
from datetime import time, datetime, timedelta


class SignalTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(email='doc@example.com', password='pass', role=CustomUser.Role.DOCTOR)
        self.doctor = DoctorProfile.objects.create(user=self.user, specialization='Cardiology', license_number='L1', phone='123', full_name='Dr A')
        self.hospital = Hospital.objects.create(name='Signal Hospital')

    def test_doctor_verification_creates_activitylog(self):
        verifier = CustomUser.objects.create_user(email='admin@example.com', password='pass', role=CustomUser.Role.HOSPITAL_ADMIN)
        verification = DoctorHospitalVerification.objects.create(doctor=self.doctor, hospital=self.hospital, status=DoctorHospitalVerification.Status.VERIFIED, verified_by=verifier)
        # Signal should create an ActivityLog entry
        self.assertTrue(ActivityLog.objects.filter(action__contains='doctor_verification').exists())

    def test_doctor_rejection_creates_activitylog(self):
        verifier = CustomUser.objects.create_user(email='admin2@example.com', password='pass', role=CustomUser.Role.HOSPITAL_ADMIN)
        DoctorHospitalVerification.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            status=DoctorHospitalVerification.Status.REJECTED,
            verified_by=verifier,
            rejection_reason='Missing documents',
        )
        self.assertTrue(ActivityLog.objects.filter(action='doctor_verification_rejected').exists())

    @patch('hospital.signals.send_mail')
    def test_doctor_verification_attempts_email(self, mock_send_mail):
        verifier = CustomUser.objects.create_user(email='admin3@example.com', password='pass', role=CustomUser.Role.HOSPITAL_ADMIN)
        DoctorHospitalVerification.objects.create(
            doctor=self.doctor,
            hospital=self.hospital,
            status=DoctorHospitalVerification.Status.VERIFIED,
            verified_by=verifier,
        )
        self.assertTrue(mock_send_mail.called)

    def test_appointment_booking_creates_activitylog(self):
        # create slot template and slot for today
        today = timezone.now().date()
        start = time(9, 0)
        end = time(9, 30)
        template = SlotTemplate.objects.create(doctor=self.doctor, hospital=self.hospital, day_of_week=today.weekday(), start_time=start, end_time=end, created_by=self.user)
        # create slot
        slot_start = timezone.make_aware(datetime.combine(today, start))
        slot_end = timezone.make_aware(datetime.combine(today, end))
        slot = AppointmentAvailableSlot.objects.create(doctor=self.doctor, hospital=self.hospital, date=today, date_start=slot_start, date_end=slot_end, start_time=start, end_time=end, slot_template=template, patient_limit=1, created_by=self.user)

        patient_user = CustomUser.objects.create_user(email='p@example.com', password='pass', role=CustomUser.Role.PATIENT)
        patient = PatientProfile.objects.create(
            user=patient_user,
            full_name='Patient',
            date_of_birth=today - timedelta(days=365 * 30),
            gender='Other',
            phone='0770000000',
            address='Test Address',
        )

        appt = Appointment.objects.create(slot=slot, doctor=self.doctor, patient=patient, hospital=self.hospital, status=Appointment.Status.ACCEPTED, appointment_fee=self.doctor.appointment_fee)
        self.assertTrue(ActivityLog.objects.filter(action='appointment_booked').exists())

    def test_appointment_cancellation_creates_activitylog(self):
        today = timezone.now().date()
        start = time(10, 0)
        end = time(10, 30)
        template = SlotTemplate.objects.create(doctor=self.doctor, hospital=self.hospital, day_of_week=today.weekday(), start_time=start, end_time=end, created_by=self.user)
        slot_start = timezone.make_aware(datetime.combine(today, start))
        slot_end = timezone.make_aware(datetime.combine(today, end))
        slot = AppointmentAvailableSlot.objects.create(doctor=self.doctor, hospital=self.hospital, date=today, date_start=slot_start, date_end=slot_end, start_time=start, end_time=end, slot_template=template, patient_limit=1, created_by=self.user)

        patient_user = CustomUser.objects.create_user(email='pc@example.com', password='pass', role=CustomUser.Role.PATIENT)
        patient = PatientProfile.objects.create(
            user=patient_user,
            full_name='Patient Cancel',
            date_of_birth=today - timedelta(days=365 * 25),
            gender='Other',
            phone='0771111111',
            address='Cancel Address',
        )

        appt = Appointment.objects.create(slot=slot, doctor=self.doctor, patient=patient, hospital=self.hospital, status=Appointment.Status.ACCEPTED, appointment_fee=self.doctor.appointment_fee)
        appt.status = Appointment.Status.CANCELLED
        appt.cancelled_by = 'PATIENT'
        appt.cancellation_reason = 'Personal emergency'
        appt.cancelled_at = timezone.now()
        appt.save()
        self.assertTrue(ActivityLog.objects.filter(action='appointment_cancelled').exists())
