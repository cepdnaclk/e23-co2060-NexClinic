from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status
from users.models import CustomUser
from patient.models import PatientProfile
from doctor.models import DoctorProfile
from doctor.models import Appointment

@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_STORE_EAGER_RESULT=True)
class NexClinicSecurityRBACTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Admin User
        self.admin = CustomUser.objects.create_user(
            email="admin_test@nexclinic.test", password="pass", role=CustomUser.Role.ADMIN
        )
        self.admin.is_superuser = True
        self.admin.is_staff = True
        self.admin.save()
        
        # Patient A
        self.patient_a = CustomUser.objects.create_user(
            email="patient_a@nexclinic.test", password="pass", role=CustomUser.Role.PATIENT
        )
        self.profile_a = PatientProfile.objects.create(
            user=self.patient_a, full_name="Alice Test", date_of_birth="2000-01-01"
        )
        
        # Patient B
        self.patient_b = CustomUser.objects.create_user(
            email="patient_b@nexclinic.test", password="pass", role=CustomUser.Role.PATIENT
        )
        self.profile_b = PatientProfile.objects.create(
            user=self.patient_b, full_name="Bob Test", date_of_birth="2000-01-01"
        )
        
        # Doctor A
        self.doctor_a = CustomUser.objects.create_user(
            email="doctor_a@nexclinic.test", password="pass", role=CustomUser.Role.DOCTOR
        )
        self.doc_profile_a = DoctorProfile.objects.create(
            user=self.doctor_a, full_name="Dr. Smith"
        )

        from hospital.models import Hospital
        self.hospital = Hospital.objects.create(name="Test Hospital", email="h@h.com")
        from doctor.models import AppointmentAvailableSlot
        self.slot = AppointmentAvailableSlot.objects.create(
            doctor=self.doc_profile_a,
            hospital=self.hospital,
            date="2025-10-10",
            start_time="10:00:00",
            end_time="10:30:00",
        )

        # Mock an appointment for Patient A
        self.appointment_a = Appointment.objects.create(
            patient=self.profile_a,
            doctor=self.doc_profile_a,
            slot=self.slot,
            status="ACCEPTED",
        )

    def test_idor_patient_cannot_access_other_patient_appointment(self):
        """
        Patient B should not be able to fetch Patient A's appointment details.
        """
        self.client.force_authenticate(user=self.patient_b)
        response = self.client.get(f"/api/hospital/appointments/{self.appointment_a.id}/")
        
        # Based on typical implementations, it should be 404 or 403
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_rbac_patient_cannot_access_doctor_endpoints(self):
        """
        Patient should get 403 when trying to access doctor management endpoints.
        """
        self.client.force_authenticate(user=self.patient_a)
        response = self.client.post("/api/doctor/availability/", {"slots": []})
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND])

    def test_rbac_doctor_cannot_manage_users(self):
        """
        Doctor should not be able to manage users like an admin.
        """
        self.client.force_authenticate(user=self.doctor_a)
        response = self.client.get("/api/users/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
