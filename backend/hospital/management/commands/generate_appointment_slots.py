from datetime import datetime, timedelta
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from hospital.models import SlotTemplate
from doctor.models import AppointmentAvailableSlot


class Command(BaseCommand):
    help = "Generate appointment slots from templates for the next 2 weeks. Prevents duplicates."

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
        parser.add_argument(
            '--skip-duplicates',
            action='store_true',
            help='Skip if slots already exist for a date-time (default: True)',
        )

    def handle(self, *args, **options):
        days = options['days']
        doctor_id = options.get('doctor_id')
        hospital_id = options.get('hospital_id')
        skip_duplicates = options.get('skip_duplicates', True)

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
                                        f"{template.doctor.user.get_full_name()} at "
                                        f"{template.hospital.name} on {slot_start}"
                                    )
                                )
                            else:
                                # Create new slot
                                try:
                                    slot = AppointmentAvailableSlot.objects.create(
                                        doctor=template.doctor,
                                        hospital=template.hospital,
                                        date_start=slot_start,
                                        date_end=slot_end,
                                        slot_template=template,
                                        patient_limit=template.default_patient_limit,
                                        booked_count=0,
                                        created_by=template.created_by,
                                        is_active=True,
                                    )
                                    created_count += 1
                                    self.stdout.write(
                                        self.style.SUCCESS(
                                            f"  Created slot: {template.doctor.user.get_full_name()} at "
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
