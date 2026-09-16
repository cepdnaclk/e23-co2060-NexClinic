from django.test import TestCase
from chat.models import AdviceChatThread, AdviceChatMessage
from doctor.models import DoctorProfile
from patient.models import PatientProfile
from users.models import CustomUser

from django.utils import timezone
from datetime import timedelta

class ChatModelTests(TestCase):
    def setUp(self):
        self.doctor_user = CustomUser.objects.create_user(email='d1@example.com', password='p', role=CustomUser.Role.DOCTOR)
        self.patient_user = CustomUser.objects.create_user(email='p1@example.com', password='p', role=CustomUser.Role.PATIENT)
        
        self.doctor = DoctorProfile.objects.create(user=self.doctor_user, full_name='Dr D')
        self.patient = PatientProfile.objects.create(
            user=self.patient_user, 
            full_name='P P',
            date_of_birth=timezone.localdate() - timedelta(days=10000),
            gender='Male'
        )
        
    def test_create_thread(self):
        thread = AdviceChatThread.objects.create(doctor=self.doctor, patient=self.patient)
        self.assertEqual(thread.status, AdviceChatThread.Status.OPEN)
        
    def test_create_message(self):
        thread = AdviceChatThread.objects.create(doctor=self.doctor, patient=self.patient)
        msg = AdviceChatMessage.objects.create(
            thread=thread,
            sender_user=self.doctor_user,
            sender_role='DOCTOR',
            message_text='Hello'
        )
        self.assertEqual(msg.message_text, 'Hello')
        self.assertFalse(msg.is_read)
