from django.test import TestCase
from django.utils import timezone
from users.models import CustomUser
from hospital.models import Hospital, ActivityLog


class ActivityLogModelTests(TestCase):
    def test_create_activity_log(self):
        user = CustomUser.objects.create_user(email='a@example.com', password='pass')
        hosp = Hospital.objects.create(name='Test Hospital')
        log = ActivityLog.objects.create(user=user, hospital=hosp, action='test_action', model_name='TestModel', object_id='42')
        self.assertEqual(str(log).startswith(str(log.created_at)), True)
        self.assertEqual(ActivityLog.objects.filter(action='test_action').count(), 1)
