from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from users.models import CustomUser
from doctor.models import DoctorProfile
from hospital.models import Hospital, DoctorHospitalVerification

class DoctorDirectoryViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.patient_user = CustomUser.objects.create_user(
            email="dir_patient@example.com",
            password="pass",
            role=CustomUser.Role.PATIENT,
        )
        self.doctor_user = CustomUser.objects.create_user(
            email="dir_doc@example.com",
            password="pass",
            role=CustomUser.Role.DOCTOR,
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            specialization="Dermatology",
            full_name="Doctor Directory",
        )
        self.hospital = Hospital.objects.create(name="Dir Hospital", is_active=True)
        # Verify the doctor so they appear in directory
        DoctorHospitalVerification.objects.create(
            doctor=self.doctor_profile,
            hospital=self.hospital,
            status=DoctorHospitalVerification.Status.VERIFIED
        )

    def test_authenticated_user_can_view_directory(self):
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.get("/api/doctor/directory/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("doctors", response.data)
        self.assertEqual(len(response.data["doctors"]), 1)
        self.assertEqual(response.data["doctors"][0]["fullName"], "Doctor Directory")

    def test_unauthenticated_user_cannot_view_directory(self):
        response = self.client.get("/api/doctor/directory/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_view_doctor_detail(self):
        self.client.force_authenticate(user=self.patient_user)
        response = self.client.get(f"/api/doctor/directory/{self.doctor_profile.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("doctor", response.data)
        self.assertEqual(response.data["doctor"]["fullName"], "Doctor Directory")
