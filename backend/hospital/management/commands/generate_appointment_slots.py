from datetime import datetime, timedelta
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from hospital.models import SlotTemplate
from doctor.models import AppointmentAvailableSlot


class Command(BaseCommand):
    help = "Generate appointment slots from templates for the next 2 weeks. Prevents duplicates."

    def _doctor_label(self, template):
        doctor = template.doctor
        user = getattr(doctor, 'user', None)

        if user is not None:
            full_name = getattr(user, 'get_full_name', None)
            if callable(full_name):
                label = full_name()
                if label:
                    return label
            email = getattr(user, 'email', '')
            if email:
                return email

        return getattr(doctor, 'preferred_name', '') or getattr(doctor, 'full_name', '') or str(doctor)

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=14,
            help='Number of days to generate slots for (default: 14)',
        )
        parser.add_argument(
            '--doctor-id',
            type=int,
            help='Optional: Generate slots for specific doctor only',
        )
        parser.add_argument(
            '--hospital-id',
            type=int,
            help='Optional: Generate slots for specific hospital only',
        )
        # By default we skip duplicates. Provide `--no-skip-duplicates` to allow creating duplicates.
        parser.add_argument(
            '--no-skip-duplicates',
            dest='skip_duplicates',
            action='store_false',
            help='Do not skip duplicates (allow creating slots even if same date/time exist)',
        )
        parser.set_defaults(skip_duplicates=True)

    def handle(self, *args, **options):
        days = options['days']
        doctor_id = options.get('doctor_id')
        hospital_id = options.get('hospital_id')
        # use explicit option (default True). If user passed --no-skip-duplicates, this will be False.
        skip_duplicates = options['skip_duplicates']

        # Calculate date range: today to today + N days
        today = timezone.now().date()
        end_date = today + timedelta(days=days - 1)

        self.stdout.write(
            self.style.SUCCESS(f"Generating slots from {today} to {end_date}...")
        )

        # Filter active templates
        templates = SlotTemplate.objects.filter(is_active=True)

        if doctor_id:
            templates = templates.filter(doctor_id=doctor_id)
        if hospital_id:
            templates = templates.filter(hospital_id=hospital_id)

        if not templates.exists():
            self.stdout.write(
                self.style.WARNING("No active templates found matching criteria.")
            )
            return

        self.stdout.write(f"Found {templates.count()} active templates.")

        created_count = 0
        skipped_count = 0
        error_count = 0

        try:
            with transaction.atomic():
                for template in templates:
                    # Iterate through each day in the range
                    current_date = today
                    while current_date <= end_date:
                        # Check if current date matches template's day_of_week
                        if current_date.weekday() == template.day_of_week:
                            # Calculate slot times
                            slot_start = datetime.combine(
                                current_date, template.start_time
                            )
                            slot_end = datetime.combine(
                                current_date, template.end_time
                            )

                            # Make timezone-aware
                            slot_start = timezone.make_aware(slot_start)
                            slot_end = timezone.make_aware(slot_end)

                            # Check for duplicate (same doctor, hospital, start time, end time)
                            existing_slot = AppointmentAvailableSlot.objects.filter(
                                doctor=template.doctor,
                                hospital=template.hospital,
                                date_start=slot_start,
                                date_end=slot_end,
                            ).exists()

                            if existing_slot and skip_duplicates:
                                skipped_count += 1
                                self.stdout.write(
                                    self.style.WARNING(
                                        f"  Skipped duplicate slot: "
                                        f"{self._doctor_label(template)} at "
                                        f"{template.hospital.name} on {slot_start}"
                                    )
                                )
                            else:
                                # Create new slot
                                try:
                                    slot = AppointmentAvailableSlot.objects.create(
                                        doctor=template.doctor,
                                        hospital=template.hospital,
                                        date=slot_start.date(),
                                        date_start=slot_start,
                                        date_end=slot_end,
                                        start_time=template.start_time,
                                        end_time=template.end_time,
                                        slot_template=template,
                                        patient_limit=template.default_patient_limit,
                                        booked_count=0,
                                        created_by=template.created_by,
                                        is_active=True,
                                    )
                                    created_count += 1
                                    self.stdout.write(
                                        self.style.SUCCESS(
                                            f"  Created slot: {self._doctor_label(template)} at "
                                            f"{template.hospital.name} on {slot_start}"
                                        )
                                    )
                                except Exception as e:
                                    error_count += 1
                                    self.stdout.write(
                                        self.style.ERROR(
                                            f"  Error creating slot for template {template.id}: {str(e)}"
                                        )
                                    )

                        current_date += timedelta(days=1)

        except Exception as e:
            raise CommandError(f"Error during slot generation: {str(e)}")

        # Summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS(f"✓ Created: {created_count} slots"))
        self.stdout.write(self.style.WARNING(f"⊘ Skipped: {skipped_count} (duplicates)"))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"✗ Errors: {error_count}"))
        self.stdout.write("=" * 60)
