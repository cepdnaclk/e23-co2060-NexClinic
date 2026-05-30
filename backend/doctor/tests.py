from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient

from doctor.models import DoctorProfile
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
        self.assertEqual(response.json()["detail"], "A user with this email already exists.")

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
        self.assertIn("/media/doctor_profiles/", response.json()["doctor"]["profileImage"])
