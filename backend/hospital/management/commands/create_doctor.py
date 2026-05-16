from django.core.management.base import BaseCommand, CommandError
from users.models import CustomUser
from doctor.models import DoctorProfile
from hospital.models import Hospital, DoctorHospitalVerification


class Command(BaseCommand):
    help = "Create a doctor user and profile. Optionally attach to hospital."

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='Doctor email')
        parser.add_argument('--password', type=str, required=True, help='Password')
        parser.add_argument('--specialization', type=str, default='General', help='Specialization')
        parser.add_argument('--license', type=str, required=True, help='License number')
        parser.add_argument('--name', type=str, required=True, help='Full name')
        parser.add_argument('--phone', type=str, default='0770000000', help='Phone number')
        parser.add_argument('--hospital', type=str, help='Hospital name (optional, for verification)')
        parser.add_argument('--auto-verify', action='store_true', help='Auto-verify at hospital')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        specialization = options['specialization']
        license_number = options['license']
        name = options['name']
        phone = options['phone']
        hospital_name = options.get('hospital')
        auto_verify = options.get('auto_verify', False)

        # Check if user already exists
        if CustomUser.objects.filter(email=email).exists():
            raise CommandError(f"User with email {email} already exists")

        # Create user
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            role=CustomUser.Role.DOCTOR
        )
        self.stdout.write(self.style.SUCCESS(f"✓ Created user: {email}"))

        # Create doctor profile
        doctor = DoctorProfile.objects.create(
            user=user,
            specialization=specialization,
            license_number=license_number,
            full_name=name,
            preferred_name=name.split()[0] if name else 'Dr.',
            phone=phone
        )
        self.stdout.write(self.style.SUCCESS(f"✓ Created doctor profile: {name} ({specialization})"))

        # Optionally attach to hospital
        if hospital_name:
            try:
                hospital = Hospital.objects.get(name=hospital_name)
                verifier_user = CustomUser.objects.filter(role=CustomUser.Role.HOSPITAL_ADMIN).first()
                if not verifier_user:
                    verifier_user = CustomUser.objects.create_superuser(email='system@example.com', password='sys')

                status = DoctorHospitalVerification.Status.VERIFIED if auto_verify else DoctorHospitalVerification.Status.PENDING
                verification = DoctorHospitalVerification.objects.create(
                    doctor=doctor,
                    hospital=hospital,
                    status=status,
                    verified_by=verifier_user if auto_verify else None
                )
                self.stdout.write(self.style.SUCCESS(f"✓ Attached to hospital '{hospital_name}' with status: {status}"))
            except Hospital.DoesNotExist:
                self.stdout.write(self.style.WARNING(f"⚠ Hospital '{hospital_name}' not found. Doctor created but not attached."))

        self.stdout.write(self.style.SUCCESS(f"\n✓ Doctor created successfully!\nEmail: {email}\nPassword: {password}"))
