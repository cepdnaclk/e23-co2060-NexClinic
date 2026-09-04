from datetime import timedelta
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from patient.models import PatientProfile, PatientMedication
from users.models import CustomUser

SMALL_GIF = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
    b"\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00"
    b"\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
)

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
                "emergencyContactEmail": "alex@example.com",
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
        self.assertEqual(self.profile.emergency_contact_email, "alex@example.com")

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

    def test_patient_can_upload_profile_image(self):
        self.client.force_authenticate(user=self.user)
        image = SimpleUploadedFile(
            "patient.jpg",
            SMALL_GIF,
            content_type="image/gif",
        )

        response = self.client.patch(
            "/api/patient/profile/",
            {"profileImage": image},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertTrue(bool(self.profile.profile_picture))
        self.assertIn("/media/patient_profiles/", response.json()["patient"]["profileImage"])

    def test_patient_can_upload_health_documents(self):
        self.client.force_authenticate(user=self.user)
        report_file = SimpleUploadedFile(
            "report.pdf",
            b"%PDF-1.4 fake report content",
            content_type="application/pdf",
        )
        document_file = SimpleUploadedFile(
            "doctor-note.docx",
            b"PK\x03\x04 fake document content",
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

        response = self.client.patch(
            "/api/patient/profile/",
            {
                "medicalReports": report_file,
                "medicalDocuments": document_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertTrue(bool(self.profile.medical_reports))
        self.assertTrue(bool(self.profile.medical_documents))
        self.assertIn("/media/patient_reports/", response.json()["health"]["medicalReports"])
        self.assertIn("/media/patient_documents/", response.json()["health"]["medicalDocuments"])

    def test_unauthenticated_profile_access(self):
        response = self.client.get("/api/patient/profile/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
class PatientMedicationViewTests(TestCase):
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
        )
        
    def test_add_medication(self):
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post(
            "/api/patient/medications/",
            {
                "name": "Vitamin C",
                "dosage": "500mg",
                "frequency": "Daily",
                "duration": "1 month"
            },
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PatientMedication.objects.count(), 1)
        med = PatientMedication.objects.first()
        self.assertEqual(med.name, "Vitamin C")
        
    def test_get_medications(self):
        PatientMedication.objects.create(
            patient=self.profile,
            name="Vitamin D",
            dosage="1000 IU",
            frequency="Daily"
        )
        
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/patient/medications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        meds = response.json().get("medications", [])
        self.assertEqual(len(meds), 1)
        self.assertEqual(meds[0]["name"], "Vitamin D")
        
    def test_delete_medication(self):
        med = PatientMedication.objects.create(
            patient=self.profile,
            name="Vitamin D",
            dosage="1000 IU",
            frequency="Daily"
        )
        
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/patient/medications/{med.id}/")
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(PatientMedication.objects.count(), 0)

