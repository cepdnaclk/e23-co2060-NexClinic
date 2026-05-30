from django.core.management.base import BaseCommand
from django.db import transaction
from hospital.models import DoctorHospitalVerification


class Command(BaseCommand):
    help = 'Backfill DoctorProfile.verified_hospitals from existing DoctorHospitalVerification records (status=VERIFIED)'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show changes without applying')

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)

        qs = DoctorHospitalVerification.objects.select_related('doctor', 'hospital').filter(status=DoctorHospitalVerification.Status.VERIFIED)
        total = qs.count()
        self.stdout.write(f'Found {total} VERIFIED verification records to apply.')

        applied = 0
        skipped = 0
        with transaction.atomic():
            for ver in qs:
                doc = ver.doctor
                hosp = ver.hospital
                if doc.verified_hospitals.filter(id=hosp.id).exists():
                    skipped += 1
                    continue
                if dry_run:
                    self.stdout.write(f'[DRY] Would add hospital {hosp.id} to doctor {doc.id}')
                    applied += 1
                else:
                    doc.verified_hospitals.add(hosp)
                    applied += 1

        self.stdout.write(self.style.SUCCESS(f'Applied: {applied}; Skipped (already present): {skipped}'))