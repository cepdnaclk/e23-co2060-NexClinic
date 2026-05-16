from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import CustomUser
from hospital.models import Hospital, HospitalAdmin, ActivityLog


class ViewsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = CustomUser.objects.create_user(email='ha@example.com', password='pass', role=CustomUser.Role.HOSPITAL_ADMIN)
        self.hosp = Hospital.objects.create(name='View Hospital')
        HospitalAdmin.objects.create(user=self.user, hospital=self.hosp, is_active=True)
        # create some logs
        ActivityLog.objects.create(user=self.user, hospital=self.hosp, action='a')
        ActivityLog.objects.create(user=self.user, hospital=self.hosp, action='b')

    def test_activity_logs_view_authorized(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get('/api/hospital/activity-logs/', {'hospital_id': self.hosp.id})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 2)

    def test_activity_logs_view_requires_hospital_id(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get('/api/hospital/activity-logs/')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_activity_logs_view_denies_other_hospital(self):
        other_hospital = Hospital.objects.create(name='Other View Hospital')
        self.client.force_authenticate(user=self.user)
        resp = self.client.get('/api/hospital/activity-logs/', {'hospital_id': other_hospital.id})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_activity_logs_view_denies_unauthenticated(self):
        resp = self.client.get('/api/hospital/activity-logs/', {'hospital_id': self.hosp.id})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_reports_view_authorized(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get('/api/hospital/reports/', {'hospital_id': self.hosp.id})
        self.assertEqual(resp.status_code, 200)
        self.assertIn('total_slots', resp.json())

    def test_reports_view_requires_hospital_id(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get('/api/hospital/reports/')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reports_view_denies_unauthorized_user(self):
        outsider = CustomUser.objects.create_user(email='outsider@example.com', password='pass', role=CustomUser.Role.PATIENT)
        self.client.force_authenticate(user=outsider)
        resp = self.client.get('/api/hospital/reports/', {'hospital_id': self.hosp.id})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
