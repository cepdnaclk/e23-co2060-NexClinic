from datetime import datetime, time, timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from doctor.models import Appointment, AppointmentAvailableSlot, DoctorProfile
from hospital.models import Hospital
from patient.models import PatientMedicalRecord, PatientProfile, Prescription
from users.models import CustomUser

class DoctorMedicalRecordViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.doctor_user = CustomUser.objects.create_user(
            email="doctor-record@example.com",
            password="pass",
            role=CustomUser.Role.DOCTOR,
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            specialization="General Medicine",
            license_number="SLMC/7777",
            phone="0711111111",
            full_name="Doctor Record",
            preferred_name="Dr. Record",
            is_verified=True,
        )
        self.hospital = Hospital.objects.create(
            name="NexClinic Central", address="Main Road"
        )
        self.doctor_profile.verified_hospitals.add(self.hospital)

        self.patient_user = CustomUser.objects.create_user(
            email="patient-record@example.com",
            password="pass",
            role=CustomUser.Role.PATIENT,
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            full_name="Patient Record",
            date_of_birth=timezone.localdate() - timedelta(days=365 * 29),
            gender="other",
            phone="0777777777",
            address="42 Clinic Street",
        )

        today = timezone.localdate()
        start_time = time(10, 0)
        end_time = time(10, 30)
        self.slot = AppointmentAvailableSlot.objects.create(
            doctor=self.doctor_profile,
            hospital=self.hospital,
            date=today,
            day_of_week=today.strftime("%A"),
            date_start=timezone.make_aware(datetime.combine(today, start_time)),
            date_end=timezone.make_aware(datetime.combine(today, end_time)),
            start_time=start_time,
            end_time=end_time,
            patient_limit=1,
            created_by=self.doctor_user,
        )
        self.appointment = Appointment.objects.create(
            slot=self.slot,
            doctor=self.doctor_profile,
            patient=self.patient_profile,
            hospital=self.hospital,
            status=Appointment.Status.ACCEPTED,
            appointment_fee=self.doctor_profile.appointment_fee
        )

    def test_doctor_can_save_medical_record_and_patient_can_view_it(self):
        self.client.force_authenticate(user=self.doctor_user)

        response = self.client.post(
            f"/api/doctor/appointments/{self.appointment.id}/medical-record/",
            {
                "observations": "Patient reports fever and cough.",
                "diagnosis": "Viral upper respiratory infection",
                "comments": "Rest and monitor symptoms.",
                "prescriptions": "Paracetamol 500mg twice daily",
                "prescriptionItems": [
                    {
                        "name": "Paracetamol",
                        "amount": "500",
                        "unit": "mg",
                        "duration": "5 days",
                        "frequency": "Twice daily",
                        "timings": ["After meals"],
                        "notes": "Drink plenty of water",
                    }
                ],
                "recommendedTests": "CBC if symptoms worsen",
                "followUpDate": (timezone.localdate() + timedelta(days=7)).isoformat(),
                "followUpNotes": "Return sooner if breathing difficulty develops.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            PatientMedicalRecord.objects.filter(appointment=self.appointment).exists()
        )
        prescription = Prescription.objects.get(appointment=self.appointment)
        self.assertEqual(prescription.medicine_name, "Paracetamol")
        self.assertEqual(str(prescription.amount), "500.000")
        self.assertEqual(prescription.unit, "mg")

        self.client.force_authenticate(user=self.patient_user)
        profile_response = self.client.get("/api/patient/profile/")

        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        records = profile_response.json()["health"]["medicalRecords"]
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["doctorName"], "Doctor Record")
        self.assertEqual(records[0]["hospitalName"], "NexClinic Central")
        self.assertEqual(records[0]["diagnosis"], "Viral upper respiratory infection")
