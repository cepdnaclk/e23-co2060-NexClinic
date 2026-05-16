from django.core.management.base import BaseCommand, CommandError
from users.models import CustomUser
from patient.models import PatientProfile
from django.utils import timezone
from datetime import date


class Command(BaseCommand):
    help = "Create a patient user and profile."

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='Patient email')
        parser.add_argument('--password', type=str, required=True, help='Password')
        parser.add_argument('--name', type=str, required=True, help='Full name')
        parser.add_argument('--dob', type=str, help='Date of birth (YYYY-MM-DD), default: 30 years ago')
        parser.add_argument('--gender', type=str, default='Other', help='Gender (Male/Female/Other)')
        parser.add_argument('--phone', type=str, default='0770000000', help='Phone number')
        parser.add_argument('--address', type=str, default='Not specified', help='Address')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        name = options['name']
        dob_str = options.get('dob')
        gender = options['gender']
        phone = options['phone']
        address = options['address']

        # Check if user already exists
        if CustomUser.objects.filter(email=email).exists():
            raise CommandError(f"User with email {email} already exists")

        # Parse date of birth
        if dob_str:
            try:
                dob = date.fromisoformat(dob_str)
            except ValueError:
                raise CommandError(f"Invalid date format: {dob_str}. Use YYYY-MM-DD")
        else:
            # Default: 30 years ago
            dob = timezone.now().date().replace(year=timezone.now().date().year - 30)

        # Create user
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            role=CustomUser.Role.PATIENT
        )
        self.stdout.write(self.style.SUCCESS(f"✓ Created user: {email}"))

        # Create patient profile
        patient = PatientProfile.objects.create(
            user=user,
            full_name=name,
            date_of_birth=dob,
            gender=gender,
            phone=phone,
            address=address
        )
        self.stdout.write(self.style.SUCCESS(f"✓ Created patient profile: {name}"))

        self.stdout.write(self.style.SUCCESS(f"\n✓ Patient created successfully!\nEmail: {email}\nPassword: {password}"))
