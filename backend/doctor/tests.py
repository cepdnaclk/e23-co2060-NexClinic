from datetime import datetime, time, timedelta

from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from doctor.models import Appointment, AppointmentAvailableSlot, DoctorProfile
from hospital.models import Hospital
from patient.models import PatientMedicalRecord, PatientProfile
from users.models import CustomUser

SMALL_GIF = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
    b"\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00"
    b"\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
)


class DoctorProfileViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email="doctor@example.com",
            password="pass",
            role=CustomUser.Role.DOCTOR,
        )
        self.profile = DoctorProfile.objects.create(
            user=self.user,
            specialization="Cardiology",
            license_number="SLMC/1234",
            phone="0712345678",
            full_name="Doctor Example",
            preferred_name="Dr. Example",
        )

    def test_doctor_can_update_profile_details(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/doctor/profile/",
            {
                "fullName": "Doctor Updated",
                "email": "doctor.updated@example.com",
                "specialization": "Neurology",
                "experienceYears": 8,
                "languages": "English, Sinhala",
                "chatFee": 2500,
                "appointmentFee": 5000,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.profile.refresh_from_db()

        self.assertEqual(self.user.email, "doctor.updated@example.com")
        self.assertEqual(self.profile.full_name, "Doctor Updated")
        self.assertEqual(self.profile.specialization, "Neurology")
        self.assertEqual(self.profile.experience_years, 8)
        self.assertEqual(self.profile.languages_spoken, "English, Sinhala")
        self.assertEqual(float(self.profile.chat_fee), 2500.0)
        self.assertEqual(float(self.profile.appointment_fee), 5000.0)

    def test_doctor_profile_update_ignores_hospitals_payload_without_crashing(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/doctor/profile/",
            {
                "fullName": "Doctor Updated",
                "hospitals": ["General Hospital", "City Hospital"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.full_name, "Doctor Updated")

    def test_doctor_profile_update_rejects_duplicate_email(self):
        CustomUser.objects.create_user(
            email="taken@example.com",
            password="pass",
            role=CustomUser.Role.DOCTOR,
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/doctor/profile/",
            {"email": "taken@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["detail"], "A user with this email already exists."
        )

    def test_doctor_can_upload_profile_image(self):
        self.client.force_authenticate(user=self.user)
        image = SimpleUploadedFile(
            "doctor.jpg",
            SMALL_GIF,
            content_type="image/gif",
        )

        response = self.client.patch(
            "/api/doctor/profile/",
            {"profileImage": image},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertTrue(bool(self.profile.profile_picture))
        self.assertIn(
            "/media/doctor_profiles/", response.json()["doctor"]["profileImage"]
        )


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

        self.client.force_authenticate(user=self.patient_user)
        profile_response = self.client.get("/api/patient/profile/")

        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        records = profile_response.json()["health"]["medicalRecords"]
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["doctorName"], "Doctor Record")
        self.assertEqual(records[0]["hospitalName"], "NexClinic Central")
        self.assertEqual(records[0]["diagnosis"], "Viral upper respiratory infection")
