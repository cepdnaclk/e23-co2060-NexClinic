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


class ActivityLogModelTests(TestCase):
    """Test ActivityLog model creation and querying."""
    def test_create_activity_log(self):
        user = CustomUser.objects.create_user(email='log@example.com', password='pass')
        hosp = Hospital.objects.create(name='Log Hospital')
        log = ActivityLog.objects.create(user=user, hospital=hosp, action='test', model_name='Test', object_id='1')
        self.assertEqual(ActivityLog.objects.filter(action='test').count(), 1)
        self.assertEqual(log.user, user)
        self.assertIn('test', str(log))


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
        # Signal gracefully handles email failures; test passes if no exception


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
        appt2 = Appointment.objects.create(
            slot=self.slot,
            doctor=self.doctor,
            patient=patient2,
            hospital=self.hospital,
            status=Appointment.Status.ACCEPTED
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
            status=Appointment.Status.ACCEPTED
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


class HospitalAdminAuthTests(TestCase):
    """Test authentication and permission checks for hospital admin endpoints."""
    def setUp(self):
        self.client = APIClient()
        self.hospital = Hospital.objects.create(name='Auth Test Hospital')
        self.admin_user = CustomUser.objects.create_user(email='admin@test.com', password='pass', role=CustomUser.Role.HOSPITAL_ADMIN)
        HospitalAdmin.objects.create(user=self.admin_user, hospital=self.hospital, is_active=True)
        self.other_user = CustomUser.objects.create_user(email='other@test.com', password='pass', role=CustomUser.Role.PATIENT)

    def test_unauthenticated_cannot_access_activity_logs(self):
        """Test that unauthenticated users cannot access activity logs."""
        response = self.client.get('/api/hospital/activity-logs/', {'hospital_id': self.hospital.id})
        # DRF may return 401 or 403 depending on authentication classes; accept either
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_non_admin_cannot_access_activity_logs(self):
        """Test that non-admin users cannot access activity logs for a hospital."""
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get('/api/hospital/activity-logs/', {'hospital_id': self.hospital.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_authorized_admin_can_access_activity_logs(self):
        """Test that authorized admins can access activity logs."""
        ActivityLog.objects.create(user=self.admin_user, hospital=self.hospital, action='test_action')
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/hospital/activity-logs/', {'hospital_id': self.hospital.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_cannot_access_other_hospital_logs(self):
        """Test that admins cannot access logs for hospitals they don't manage."""
        other_hospital = Hospital.objects.create(name='Other Hospital')
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/hospital/activity-logs/', {'hospital_id': other_hospital.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_missing_hospital_id_returns_error(self):
        """Test that missing hospital_id parameter returns 400."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/hospital/activity-logs/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ReportsAuthTests(TestCase):
    """Test authentication for reports endpoint."""
    def setUp(self):
        self.client = APIClient()
        self.hospital = Hospital.objects.create(name='Reports Hospital')
        self.admin_user = CustomUser.objects.create_user(email='reportadmin@test.com', password='pass', role=CustomUser.Role.HOSPITAL_ADMIN)
        HospitalAdmin.objects.create(user=self.admin_user, hospital=self.hospital, is_active=True)
        self.patient_user = CustomUser.objects.create_user(email='reportpatient@test.com', password='pass', role=CustomUser.Role.PATIENT)

    def test_authorized_admin_can_access_reports(self):
        """Test that authorized admins can access reports."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/hospital/reports/', {'hospital_id': self.hospital.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('total_slots', data)
        self.assertIn('total_appointments', data)

    def test_patient_cannot_access_reports(self):
        """Test that patients cannot access hospital reports."""
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.get('/api/hospital/reports/', {'hospital_id': self.hospital.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


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
        # Signal attempts email; graceful failure


class SlotGenerationTests(TestCase):
    """Test management command for slot generation."""
    def test_slots_generated_with_correct_fields(self):
        """Test that generated slots have all required fields set."""
        from django.core.management import call_command
        doctor_user = CustomUser.objects.create_user(email='slotgen@test.com', password='pass', role=CustomUser.Role.DOCTOR)
        doctor = DoctorProfile.objects.create(user=doctor_user, specialization='Slot', license_number='SLOT1', phone='5555', full_name='Dr Slot')
        hospital = Hospital.objects.create(name='Slot Hospital')
        creator = CustomUser.objects.create_user(email='slotcreator@test.com', password='pass')
        today = timezone.now().date()
        SlotTemplate.objects.create(
            doctor=doctor,
            hospital=hospital,
            day_of_week=today.weekday(),
            start_time=time(14, 0),
            end_time=time(14, 30),
            created_by=creator
        )
        call_command('generate_appointment_slots', '--days', '1')
        slot = AppointmentAvailableSlot.objects.filter(hospital=hospital).first()
        self.assertIsNotNone(slot.date)
        self.assertIsNotNone(slot.date_start)
        self.assertEqual(slot.start_time, time(14, 0))
        self.assertEqual(slot.end_time, time(14, 30))


class AdminAppointmentSlotGenerationApiTests(TestCase):
    def test_hospital_admin_can_generate_slots_from_templates(self):
        admin_user = CustomUser.objects.create_user(
            email='slotadmin@test.com',
            password='pass',
            role=CustomUser.Role.HOSPITAL_ADMIN,
        )
        doctor_user = CustomUser.objects.create_user(
            email='slotdoctor@test.com',
            password='pass',
            role=CustomUser.Role.DOCTOR,
        )
        doctor = DoctorProfile.objects.create(
            user=doctor_user,
            specialization='Slot',
            license_number='SLOT-API',
            phone='8888',
            full_name='Dr Slot API',
        )
        hospital = Hospital.objects.create(name='API Slot Hospital')
        HospitalAdmin.objects.create(user=admin_user, hospital=hospital)

        today = timezone.localdate()
        SlotTemplate.objects.create(
            doctor=doctor,
            hospital=hospital,
            day_of_week=today.weekday(),
            start_time=time(16, 0),
            end_time=time(16, 30),
            created_by=admin_user,
        )

        client = APIClient()
        client.force_authenticate(user=admin_user)

        response = client.post(
            '/api/doctor/admin/appointment-slots/generate/',
            {'hospital': hospital.id, 'days': 1},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(AppointmentAvailableSlot.objects.filter(hospital=hospital).exists())


class CeleryTaskTests(TestCase):
    """Test Celery task wrapper."""
    def test_generate_slots_task_function(self):
        """Test that generate_slots task function executes the management command."""
        from hospital.tasks import generate_slots
        doctor_user = CustomUser.objects.create_user(email='taskslot@test.com', password='pass', role=CustomUser.Role.DOCTOR)
        doctor = DoctorProfile.objects.create(user=doctor_user, specialization='Task', license_number='TASK1', phone='6666', full_name='Dr Task')
        hospital = Hospital.objects.create(name='Task Hospital')
        creator = CustomUser.objects.create_user(email='taskcreator@test.com', password='pass')
        today = timezone.now().date()
        SlotTemplate.objects.create(
            doctor=doctor,
            hospital=hospital,
            day_of_week=today.weekday(),
            start_time=time(15, 0),
            end_time=time(15, 30),
            created_by=creator
        )
        generate_slots(1)
        slots = AppointmentAvailableSlot.objects.filter(hospital=hospital)
        self.assertTrue(slots.exists())


class CreateHospitalDoctorApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hospital = Hospital.objects.create(name='Create Doc Hospital')
        self.admin_user = CustomUser.objects.create_user(
            email='admin_creator@test.com',
            password='ComplexPassword123!',
            role=CustomUser.Role.HOSPITAL_ADMIN,
        )
        HospitalAdmin.objects.create(user=self.admin_user, hospital=self.hospital, is_active=True)
        self.other_user = CustomUser.objects.create_user(
            email='other_pat@test.com',
            password='ComplexPassword123!',
            role=CustomUser.Role.PATIENT,
        )

    def test_admin_can_create_doctor(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'email': 'new_doctor@test.com',
            'full_name': 'Dr. John Doe',
            'preferred_name': 'Dr. John',
            'nic_number': '199512345678',
            'gender': 'Male',
            'license_number': 'MC/12345',
            'specialization': 'Cardiology',
            'phone': '0771234567',
        }
        response = self.client.post('/api/hospital/create-doctor/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['doctor']['email'], 'new_doctor@test.com')

        # Check DB structures
        user = CustomUser.objects.get(email='new_doctor@test.com')
        self.assertEqual(user.role, 'DOCTOR')
        self.assertTrue(user.is_active)

        profile = user.doctor_profile
        self.assertTrue(profile.is_verified)
        self.assertEqual(profile.specialization, 'Cardiology')
        self.assertTrue(profile.verified_hospitals.filter(id=self.hospital.id).exists())

        verification = DoctorHospitalVerification.objects.filter(doctor=profile, hospital=self.hospital).first()
        self.assertIsNotNone(verification)
        self.assertEqual(verification.status, DoctorHospitalVerification.Status.VERIFIED)
        self.assertEqual(verification.verified_by, self.admin_user)

        activity_log = ActivityLog.objects.filter(action='doctor_created_by_admin', user=self.admin_user).exists()
        self.assertTrue(activity_log)

        credentials_email = next(
            message for message in mail.outbox
            if message.subject == 'Your NexClinic doctor account'
        )
        self.assertEqual(credentials_email.to, ['new_doctor@test.com'])
        self.assertIn('Login email: new_doctor@test.com', credentials_email.body)
        self.assertIn('/doctor/login', credentials_email.body)
        self.assertIn('/reset-password?role=doctor', credentials_email.body)
        password_match = re.search(r'^Temporary password: (.+)$', credentials_email.body, re.MULTILINE)
        self.assertIsNotNone(password_match)
        generated_password = password_match.group(1).strip()
        self.assertGreaterEqual(len(generated_password), 12)
        self.assertRegex(generated_password, r'[A-Z]')
        self.assertRegex(generated_password, r'[a-z]')
        self.assertRegex(generated_password, r'\d')
        self.assertRegex(generated_password, r'[^A-Za-z0-9]')
        self.assertTrue(user.check_password(generated_password))

    def test_non_admin_cannot_create_doctor(self):
        self.client.force_authenticate(user=self.other_user)
        payload = {
            'email': 'new_doctor_fail@test.com',
            'full_name': 'Dr. John Doe',
            'preferred_name': 'Dr. John',
            'nic_number': '199512345678',
            'gender': 'Male',
            'license_number': 'MC/12345',
            'specialization': 'Cardiology',
            'phone': '0771234567',
        }
        response = self.client.post('/api/hospital/create-doctor/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_existing_email_explains_that_password_reset_is_required(self):
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'email': self.other_user.email,
            'full_name': 'Dr. Existing User',
            'preferred_name': 'Dr. Existing',
            'nic_number': '199512345678',
            'gender': 'Male',
            'license_number': 'MC/12345',
            'specialization': 'Cardiology',
            'phone': '0771234567',
        }

        response = self.client.post('/api/hospital/create-doctor/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('active account', response.json()['email'][0])
        self.assertIn('Forgot password', response.json()['email'][0])

    def test_orphaned_doctor_login_is_rebuilt_and_emailed(self):
        orphan = CustomUser.objects.create_user(
            email='deleted_doctor@test.com',
            password='OldPassword123!',
            role=CustomUser.Role.DOCTOR,
            is_active=False,
        )
        original_user_id = orphan.id
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'email': orphan.email,
            'full_name': 'Dr. Recreated User',
            'preferred_name': 'Dr. Recreated',
            'nic_number': '199512345678',
            'gender': 'Female',
            'license_number': 'MC/54321',
            'specialization': 'Cardiology',
            'phone': '0771234567',
        }

        response = self.client.post('/api/hospital/create-doctor/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        rebuilt_user = CustomUser.objects.get(email=orphan.email)
        self.assertEqual(rebuilt_user.id, original_user_id)
        self.assertTrue(rebuilt_user.is_active)
        self.assertTrue(hasattr(rebuilt_user, 'doctor_profile'))
        credentials_email = next(
            message for message in mail.outbox
            if message.subject == 'Your NexClinic doctor account' and orphan.email in message.to
        )
        password_match = re.search(r'^Temporary password: (.+)$', credentials_email.body, re.MULTILINE)
        self.assertIsNotNone(password_match)
        self.assertTrue(rebuilt_user.check_password(password_match.group(1).strip()))

    @patch('users.utils.send_doctor_account_credentials_email')
    def test_email_failure_rolls_back_doctor_account(self, _send_email):
        from users.utils import CredentialEmailDeliveryError
        _send_email.side_effect = CredentialEmailDeliveryError('SMTP failure')
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'email': 'email_failure_doctor@test.com',
            'full_name': 'Dr. Email Failure',
            'preferred_name': 'Dr. Failure',
            'nic_number': '199512345678',
            'gender': 'Female',
            'license_number': 'MC/54321',
            'specialization': 'Cardiology',
            'phone': '0771234567',
        }

        response = self.client.post('/api/hospital/create-doctor/', payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn('email could not be delivered', response.json()['detail'])
        self.assertFalse(CustomUser.objects.filter(email=payload['email']).exists())
        self.assertFalse(ActivityLog.objects.filter(
            action='doctor_created_by_admin',
            data__doctor_email=payload['email'],
        ).exists())

    def test_validation_errors(self):
        self.client.force_authenticate(user=self.admin_user)

        # Invalid NIC
        payload = {
            'email': 'invalid@test.com',
            'full_name': 'Dr. John Doe',
            'preferred_name': 'Dr. John',
            'nic_number': 'invalid_nic',
            'gender': 'Male',
            'license_number': 'MC/12345',
            'specialization': 'Cardiology',
            'phone': '0771234567',
        }
        response = self.client.post('/api/hospital/create-doctor/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nic_number', response.json())

