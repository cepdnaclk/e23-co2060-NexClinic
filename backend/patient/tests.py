from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from patient.models import PatientProfile
from users.models import CustomUser


class PatientProfileViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(
            email="patient@example.com",
            password="pass",
            role=CustomUser.Role.PATIENT,
        )
        self.profile = PatientProfile.objects.create(
            user=self.user,
            full_name="Patient Example",
            date_of_birth=timezone.localdate() - timedelta(days=365 * 25),
            gender="other",
            phone="0712345678",
            address="42 Main Street",
        )

    def test_patient_can_update_profile_details(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/patient/profile/",
            {
                "fullName": "Patient Updated",
                "email": "patient.updated@example.com",
                "city": "Colombo",
                "country": "Sri Lanka",
                "bloodType": "O+",
                "allergies": "Pollen",
                "emergencyContactName": "Alex",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.profile.refresh_from_db()

        self.assertEqual(self.user.email, "patient.updated@example.com")
        self.assertEqual(self.profile.full_name, "Patient Updated")
        self.assertEqual(self.profile.city, "Colombo")
        self.assertEqual(self.profile.country, "Sri Lanka")
        self.assertEqual(self.profile.blood_type, "O+")
        self.assertEqual(self.profile.allergies, "Pollen")
        self.assertEqual(self.profile.emergency_contact_name, "Alex")

    def test_patient_profile_update_rejects_duplicate_email(self):
        CustomUser.objects.create_user(
            email="taken@example.com",
            password="pass",
            role=CustomUser.Role.PATIENT,
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            "/api/patient/profile/",
            {"email": "taken@example.com"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.json())
