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

class ActivityLogModelTests(TestCase):
    """Test ActivityLog model creation and querying."""
    def test_create_activity_log(self):
        user = CustomUser.objects.create_user(email='log@example.com', password='pass')
        hosp = Hospital.objects.create(name='Log Hospital')
        log = ActivityLog.objects.create(user=user, hospital=hosp, action='test', model_name='Test', object_id='1')
        self.assertEqual(ActivityLog.objects.filter(action='test').count(), 1)
        self.assertEqual(log.user, user)
        self.assertIn('test', str(log))

