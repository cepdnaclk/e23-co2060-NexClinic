from django.test import TestCase
from django.core.management import call_command
from users.models import CustomUser
from hospital.models import Hospital, SlotTemplate
from doctor.models import DoctorProfile, AppointmentAvailableSlot
from datetime import time, datetime
from django.utils import timezone


class ManagementCommandTests(TestCase):
    def test_generate_appointment_slots_creates_slots(self):
        user = CustomUser.objects.create_user(email='gen@example.com', password='pass', role=CustomUser.Role.DOCTOR)
        doctor = DoctorProfile.objects.create(user=user, specialization='Gen', license_number='L2', phone='123', full_name='Dr Gen')
        hosp = Hospital.objects.create(name='Gen Hospital')
        today = timezone.now().date()
        SlotTemplate.objects.create(doctor=doctor, hospital=hosp, day_of_week=today.weekday(), start_time=time(10,0), end_time=time(10,30), created_by=user)

        # run management command for 1 day
        call_command('generate_appointment_slots', '--days', '1')
        slot = AppointmentAvailableSlot.objects.filter(hospital=hosp).first()
        self.assertIsNotNone(slot)
        self.assertEqual(slot.date, today)
        self.assertEqual(slot.start_time, time(10, 0))
        self.assertEqual(slot.end_time, time(10, 30))
