from django.test import TestCase
from users.serializers import (
    PatientRegistrationSerializer,
    DoctorRegistrationSerializer,
    HospitalAdminRegistrationSerializer
)
from users.models import CustomUser, PendingUser
from django.utils import timezone

class PatientRegistrationSerializerTests(TestCase):
    def test_valid_patient_registration(self):
        data = {
            'full_name': 'Test Patient',
            'email': 'testpatient@example.com',
            'phone': '0712345678',
            'date_of_birth': '1990-01-01',
            'gender': 'Male',
            'address': '123 Test St',
            'password': 'StrongPassword123',
            'password2': 'StrongPassword123'
        }
        serializer = PatientRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        # Test creation logic
        result = serializer.save()
        self.assertEqual(result['email'], 'testpatient@example.com')
        
        # Verify PendingUser was created
        pending_user = PendingUser.objects.get(email='testpatient@example.com')
        self.assertEqual(pending_user.role, 'PATIENT')
        self.assertEqual(pending_user.profile_data['full_name'], 'Test Patient')

    def test_invalid_passwords_do_not_match(self):
        data = {
            'full_name': 'Test Patient',
            'email': 'testpatient@example.com',
            'phone': '0712345678',
            'date_of_birth': '1990-01-01',
            'gender': 'Male',
            'address': '123 Test St',
            'password': 'StrongPassword123',
            'password2': 'DifferentPassword123'
        }
        serializer = PatientRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_invalid_phone_number(self):
        data = {
            'full_name': 'Test Patient',
            'email': 'testpatient@example.com',
            'phone': 'invalid_phone',
            'date_of_birth': '1990-01-01',
            'gender': 'Male',
            'address': '123 Test St',
            'password': 'StrongPassword123',
            'password2': 'StrongPassword123'
        }
        serializer = PatientRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('phone', serializer.errors)

class DoctorRegistrationSerializerTests(TestCase):
    def test_valid_doctor_registration(self):
        data = {
            'full_name': 'Test Doctor',
            'preferred_name': 'Dr. Test',
            'nic_number': '123456789V',
            'gender': 'Female',
            'license_number': '12345',
            'specialization': 'Cardiology',
            'phone': '0771234567',
            'email': 'doctor@example.com',
            'password': 'StrongPassword123',
            'password2': 'StrongPassword123'
        }
        serializer = DoctorRegistrationSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        result = serializer.save()
        self.assertEqual(result['email'], 'doctor@example.com')
        
        pending_user = PendingUser.objects.get(email='doctor@example.com')
        self.assertEqual(pending_user.role, 'DOCTOR')
        self.assertEqual(pending_user.profile_data['specialization'], 'Cardiology')

    def test_invalid_nic(self):
        data = {
            'full_name': 'Test Doctor',
            'preferred_name': 'Dr. Test',
            'nic_number': 'invalid_nic',
            'gender': 'Female',
            'license_number': '12345',
            'specialization': 'Cardiology',
            'phone': '0771234567',
            'email': 'doctor@example.com',
            'password': 'StrongPassword123',
            'password2': 'StrongPassword123'
        }
        serializer = DoctorRegistrationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('nic_number', serializer.errors)
