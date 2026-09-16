from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from users.models import CustomUser
from hospital.models import Hospital, HospitalAdmin
from doctor.models import DoctorProfile

class AdminHospitalListViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = CustomUser.objects.create_user(
            email="admin_hosp@example.com",
            password="pass",
            role=CustomUser.Role.HOSPITAL_ADMIN,
        )
        self.hospital = Hospital.objects.create(name="Admin Hospital", is_active=True)
        self.hospital_admin = HospitalAdmin.objects.create(
            user=self.admin_user,
            hospital=self.hospital,
            is_active=True
        )

    def test_hospital_admin_can_view_hospitals(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/doctor/admin/hospitals/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("hospitals", response.data)
        self.assertEqual(len(response.data["hospitals"]), 1)
        self.assertEqual(response.data["hospitals"][0]["hospitalName"], "Admin Hospital")

    def test_regular_doctor_cannot_view_admin_hospitals(self):
        doctor_user = CustomUser.objects.create_user(
            email="just_doc@example.com",
            password="pass",
            role=CustomUser.Role.DOCTOR,
        )
        self.client.force_authenticate(user=doctor_user)
        response = self.client.get("/api/doctor/admin/hospitals/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
