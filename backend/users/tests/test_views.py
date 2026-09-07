from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import CustomUser, PendingUser
from unittest.mock import patch

class UserRegistrationTests(APITestCase):
    @patch('users.serializers.send_otp_email')
    def test_patient_registration(self, mock_send_email):
        url = reverse('patient_register')
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
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'testpatient@example.com')
        self.assertTrue(PendingUser.objects.filter(email='testpatient@example.com').exists())
        mock_send_email.assert_called_once()

    @patch('users.serializers.send_otp_email')
    def test_doctor_registration(self, mock_send_email):
        url = reverse('doctor_register')
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
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(PendingUser.objects.filter(email='doctor@example.com').exists())


class UserLoginTests(APITestCase):
    def setUp(self):
        self.patient_user = CustomUser.objects.create_user(
            email='patient@example.com',
            password='password123',
            role=CustomUser.Role.PATIENT
        )

    def test_patient_login_requires_otp(self):
        url = reverse('patient_login')
        data = {
            'email': 'patient@example.com',
            'password': 'password123'
        }
        response = self.client.post(url, data, format='json')
        
        # When 2FA is active, it should return 200 with an mfa_required flag or similar
        # Since NexClinic uses 2FA, we expect a 200 containing otp_required=True
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('otp_required', response.data)
        self.assertTrue(response.data['otp_required'])

    def test_patient_login_wrong_password(self):
        url = reverse('patient_login')
        data = {
            'email': 'patient@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
