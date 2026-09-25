from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from patient.models import (
    PatientProfile,
    PatientMedicalRecord,
    Prescription,
    PatientMedication,
    MedicationReminder,
    MedicationLog,
)
from users.models import CustomUser
from doctor.models import DoctorProfile

class PatientModelTests(TestCase):
    def setUp(self):
        self.patient_user = CustomUser.objects.create_user(
            email="patient1@example.com",
            password="pass",
            role=CustomUser.Role.PATIENT,
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            full_name="John Doe",
            date_of_birth=timezone.localdate() - timedelta(days=365*30),
            gender="male",
            phone="0771234567"
        )
        
        self.doctor_user = CustomUser.objects.create_user(
            email="doctor1@example.com",
            password="pass",
            role=CustomUser.Role.DOCTOR,
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            full_name="Dr. Smith"
        )

    def test_patient_profile_creation(self):
        self.assertEqual(self.patient_profile.user.email, "patient1@example.com")
        self.assertEqual(str(self.patient_profile), "John Doe (patient1@example.com)")

    def test_patient_medical_record_creation(self):
        record = PatientMedicalRecord.objects.create(
            patient=self.patient_profile,
            doctor=self.doctor_profile,
            visit_date=timezone.localdate(),
            hospital_name="General Hospital",
            doctor_name="Dr. Smith",
            diagnosis="Flu"
        )
        self.assertEqual(record.diagnosis, "Flu")
        self.assertIn("John Doe", str(record))

    def test_prescription_creation(self):
        record = PatientMedicalRecord.objects.create(
            patient=self.patient_profile,
            doctor=self.doctor_profile,
            visit_date=timezone.localdate(),
            hospital_name="General Hospital",
            doctor_name="Dr. Smith"
        )
        # Note: Prescription requires an appointment in the model. 
        # But appointment is ForeignKey. Let's create a dummy appointment.
        from doctor.models import Appointment, AppointmentAvailableSlot
        from hospital.models import Hospital
        hospital = Hospital.objects.create(name="Test Hospital")
        now = timezone.now()
        slot = AppointmentAvailableSlot.objects.create(
            doctor=self.doctor_profile,
            hospital=hospital,
            date=now.date(),
            date_start=now,
            date_end=now + timedelta(hours=1),
            start_time=now.time(),
            end_time=(now + timedelta(hours=1)).time(),
            patient_limit=5
        )
        appointment = Appointment.objects.create(
            slot=slot,
            doctor=self.doctor_profile,
            patient=self.patient_profile,
            hospital=hospital,
            status=Appointment.Status.COMPLETED
        )
        
        prescription = Prescription.objects.create(
            medical_record=record,
            patient=self.patient_profile,
            doctor=self.doctor_profile,
            appointment=appointment,
            medicine_name="Paracetamol",
            amount=500,
            unit="mg"
        )
        self.assertEqual(prescription.medicine_name, "Paracetamol")
        self.assertIn("Paracetamol", str(prescription))

    def test_patient_medication_creation(self):
        med = PatientMedication.objects.create(
            patient=self.patient_profile,
            name="Aspirin",
            dosage="100mg",
            frequency="Daily"
        )
        self.assertEqual(med.name, "Aspirin")
        self.assertIn("Aspirin", str(med))

    def test_medication_reminder_creation(self):
        reminder = MedicationReminder.objects.create(
            patient=self.patient_profile,
            medicine_name="Aspirin",
            start_date=timezone.localdate(),
            schedule_times=[{"time": "08:00", "days": [0,1,2,3,4,5,6], "is_active": True}]
        )
        self.assertEqual(reminder.medicine_name, "Aspirin")
        self.assertTrue(reminder.is_active)
        self.assertIn("Reminder for Aspirin", str(reminder))

    def test_medication_log_creation(self):
        reminder = MedicationReminder.objects.create(
            patient=self.patient_profile,
            medicine_name="Aspirin",
            start_date=timezone.localdate(),
        )
        log = MedicationLog.objects.create(
            reminder=reminder,
            patient=self.patient_profile,
            scheduled_for=timezone.now(),
            status=MedicationLog.Status.PENDING
        )
        self.assertEqual(log.status, MedicationLog.Status.PENDING)
        self.assertIn("Aspirin", str(log))
