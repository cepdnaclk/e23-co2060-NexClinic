from django.test import TestCase
from rest_framework.exceptions import ValidationError

from doctor.serializers import (
    DoctorDirectoryPublicSerializer,
    DoctorVerificationProfileSerializer
)
from doctor.models import DoctorProfile
from users.models import CustomUser

class DoctorSerializerTests(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="doc_serial@example.com",
            password="pass",
            role=CustomUser.Role.DOCTOR,
        )
        self.profile = DoctorProfile.objects.create(
            user=self.user,
            specialization="Pediatrics",
            license_number="SLMC/999",
            phone="0719999999",
            full_name="Doctor Serializer",
            preferred_name="Dr. Serial",
        )

    def test_doctor_directory_public_serializer(self):
        serializer = DoctorDirectoryPublicSerializer(self.profile)
        data = serializer.data
        self.assertEqual(data["fullName"], "Doctor Serializer")
        self.assertEqual(data["specialization"], "Pediatrics")
        # licenseNumber is not in DoctorDirectoryPublicSerializer fields, but qualifications are
        self.assertIn("qualifications", data)
