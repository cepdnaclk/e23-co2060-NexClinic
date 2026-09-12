from django.test import TestCase
from patient.serializers import PatientProfileUpdateSerializer
from users.models import CustomUser
from patient.models import PatientProfile
from django.utils import timezone
from datetime import timedelta

class PatientSerializerTests(TestCase):
    def setUp(self):
        self.user1 = CustomUser.objects.create_user(
            email="patient1@example.com",
            password="pass",
            role=CustomUser.Role.PATIENT,
        )
        self.profile1 = PatientProfile.objects.create(
            user=self.user1,
            full_name="John Doe",
            date_of_birth=timezone.localdate() - timedelta(days=365*30),
            gender="male",
            phone="0771234567"
        )
        
        self.user2 = CustomUser.objects.create_user(
            email="patient2@example.com",
            password="pass",
            role=CustomUser.Role.PATIENT,
        )
        self.profile2 = PatientProfile.objects.create(
            user=self.user2,
            full_name="Jane Doe",
            date_of_birth=timezone.localdate() - timedelta(days=365*25),
            gender="female",
            phone="0777654321"
        )

    def test_patient_profile_update_serializer_valid_data(self):
        data = {
            "fullName": "John Updated",
            "gender": "Other",
            "city": "Colombo"
        }
        serializer = PatientProfileUpdateSerializer(
            instance=self.profile1,
            data=data,
            partial=True,
            context={"patient_profile": self.profile1}
        )
        self.assertTrue(serializer.is_valid())
        updated_profile = serializer.save()
        self.assertEqual(updated_profile.full_name, "John Updated")
        self.assertEqual(updated_profile.gender, "other") # Normalizes to lower
        self.assertEqual(updated_profile.city, "Colombo")

    def test_patient_profile_update_serializer_invalid_gender(self):
        data = {
            "gender": "invalid_gender"
        }
        serializer = PatientProfileUpdateSerializer(
            instance=self.profile1,
            data=data,
            partial=True,
            context={"patient_profile": self.profile1}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("gender", serializer.errors)

    def test_patient_profile_update_serializer_duplicate_email(self):
        data = {
            "email": "patient2@example.com" # Already taken by user2
        }
        serializer = PatientProfileUpdateSerializer(
            instance=self.profile1,
            data=data,
            partial=True,
            context={"patient_profile": self.profile1}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
        
    def test_patient_profile_update_serializer_own_email(self):
        # Updating to own email should be valid
        data = {
            "email": "patient1@example.com" 
        }
        serializer = PatientProfileUpdateSerializer(
            instance=self.profile1,
            data=data,
            partial=True,
            context={"patient_profile": self.profile1}
        )
        self.assertTrue(serializer.is_valid())
