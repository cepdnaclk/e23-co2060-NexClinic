from django.test import TestCase
from hospital import tasks
from django.core.management import call_command
from users.models import CustomUser
from doctor.models import DoctorProfile, AppointmentAvailableSlot
from hospital.models import Hospital, SlotTemplate
from datetime import time
from django.utils import timezone


class TasksTests(TestCase):
    def test_generate_slots_task_runs(self):
        # create data so command has templates
        user = CustomUser.objects.create_user(email='task@example.com', password='pass', role=CustomUser.Role.DOCTOR)
        doctor = DoctorProfile.objects.create(user=user, specialization='T', license_number='L3', phone='123', full_name='Dr T')
        hosp = Hospital.objects.create(name='Task Hospital')
        SlotTemplate.objects.create(doctor=doctor, hospital=hosp, day_of_week=timezone.now().date().weekday(), start_time=time(11,0), end_time=time(11,30), created_by=user)

        # call task function directly
        tasks.generate_slots(1)
        slot = AppointmentAvailableSlot.objects.filter(hospital=hosp).first()
        self.assertIsNotNone(slot)
        self.assertEqual(slot.date, timezone.now().date())
