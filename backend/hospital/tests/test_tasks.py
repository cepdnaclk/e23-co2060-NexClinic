from django.test import TestCase
from django.core import mail
from django.utils import timezone
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from datetime import time, datetime, timedelta
from users.models import CustomUser
from hospital.models import Hospital, ActivityLog, SlotTemplate, DoctorHospitalVerification, HospitalAdmin
from doctor.models import DoctorProfile, AppointmentAvailableSlot, Appointment
from patient.models import PatientProfile
from rest_framework import status
import re

class SlotGenerationTests(TestCase):
    """Test management command for slot generation."""
    def test_slots_generated_with_correct_fields(self):
        """Test that generated slots have all required fields set."""
        from django.core.management import call_command
        doctor_user = CustomUser.objects.create_user(email='slotgen@test.com', password='pass', role=CustomUser.Role.DOCTOR)
        doctor = DoctorProfile.objects.create(user=doctor_user, specialization='Slot', license_number='SLOT1', phone='5555', full_name='Dr Slot')
        hospital = Hospital.objects.create(name='Slot Hospital')
        creator = CustomUser.objects.create_user(email='slotcreator@test.com', password='pass')
        today = timezone.now().date()
        SlotTemplate.objects.create(
            doctor=doctor,
            hospital=hospital,
            day_of_week=today.weekday(),
            start_time=time(14, 0),
            end_time=time(14, 30),
            created_by=creator
        )
        call_command('generate_appointment_slots', '--days', '1')
        slot = AppointmentAvailableSlot.objects.filter(hospital=hospital).first()
        self.assertIsNotNone(slot.date)
        self.assertIsNotNone(slot.date_start)
        self.assertEqual(slot.start_time, time(14, 0))
        self.assertEqual(slot.end_time, time(14, 30))

class CeleryTaskTests(TestCase):
    """Test Celery task wrapper."""
    def test_generate_slots_task_function(self):
        """Test that generate_slots task function executes the management command."""
        from hospital.tasks import generate_slots
        doctor_user = CustomUser.objects.create_user(email='taskslot@test.com', password='pass', role=CustomUser.Role.DOCTOR)
        doctor = DoctorProfile.objects.create(user=doctor_user, specialization='Task', license_number='TASK1', phone='6666', full_name='Dr Task')
        hospital = Hospital.objects.create(name='Task Hospital')
        creator = CustomUser.objects.create_user(email='taskcreator@test.com', password='pass')
        today = timezone.now().date()
        SlotTemplate.objects.create(
            doctor=doctor,
            hospital=hospital,
            day_of_week=today.weekday(),
            start_time=time(15, 0),
            end_time=time(15, 30),
            created_by=creator
        )
        generate_slots(1)
        slots = AppointmentAvailableSlot.objects.filter(hospital=hospital)
        self.assertTrue(slots.exists())

