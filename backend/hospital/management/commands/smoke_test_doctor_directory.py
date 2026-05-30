from django.core.management.base import BaseCommand
from rest_framework.test import APIRequestFactory, force_authenticate

from users.models import CustomUser
from doctor.views import DoctorDirectoryView


class Command(BaseCommand):
    help = 'Smoke test the doctor directory endpoint to confirm visibility rules.'

    def handle(self, *args, **options):
        factory = APIRequestFactory()
        user, _ = CustomUser.objects.get_or_create(email='smoketest_dir_patient@example.com', defaults={'role': CustomUser.Role.PATIENT, 'is_active': True})

        req = factory.get('/api/doctor/directory/')
        force_authenticate(req, user=user)
        view = DoctorDirectoryView.as_view()
        resp = view(req)

        status = getattr(resp, 'status_code', None)
        data = getattr(resp, 'data', {})
        doctors = data.get('doctors') if isinstance(data, dict) else None
        self.stdout.write(f'Status: {status}')
        if doctors is None:
            self.stdout.write(f'Response data: {data}')
        else:
            self.stdout.write(f'Doctors returned: {len(doctors)}')
            for d in doctors[:10]:
                self.stdout.write(f"- {d.get('fullName') or d.get('preferredName')} (id: {d.get('id')})")
