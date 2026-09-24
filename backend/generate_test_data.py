import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from django.contrib.auth import get_user_model
from patient.models import PatientProfile
from doctor.models import DoctorProfile
from django.utils import timezone
import datetime

User = get_user_model()

def create_user(email, password, role):
    user, created = User.objects.get_or_create(email=email, defaults={'role': role})
    if created or not user.check_password(password):
        user.set_password(password)
        user.is_active = True
        user.save()
    return user, created

def generate_data():
    print("Generating Test Data...")

    # 1. Admin
    admin_user, _ = create_user('admin@nexclinic.test', 'AdminPass@123', 'ADMIN')
    admin_user.is_superuser = True
    admin_user.is_staff = True
    admin_user.save()
    print("Admin generated.")

    # 2. Patient A
    patient_a, _ = create_user('patientA@nexclinic.test', 'TestPass@123', 'PATIENT')
    PatientProfile.objects.update_or_create(
        user=patient_a,
        defaults={
            'full_name': 'Alice Smith',
            'date_of_birth': datetime.date(1990, 5, 14),
            'gender': 'Female',
            'phone': '0712345678',
            'address': '123 Test St, Colombo'
        }
    )
    print("Patient A generated.")

    # 3. Patient B
    patient_b, _ = create_user('patientB@nexclinic.test', 'TestPass@123', 'PATIENT')
    PatientProfile.objects.update_or_create(
        user=patient_b,
        defaults={
            'full_name': 'Bob Jones',
            'date_of_birth': datetime.date(1985, 8, 22),
            'gender': 'Male',
            'phone': '0718765432',
            'address': '456 Sample Rd, Kandy'
        }
    )
    print("Patient B generated.")

    # 4. Doctor A
    doctor_a, _ = create_user('doctorA@nexclinic.test', 'TestPass@123', 'DOCTOR')
    DoctorProfile.objects.update_or_create(
        user=doctor_a,
        defaults={
            'full_name': 'Dr. John Doe',
            'specialization': 'Cardiologist',
            'license_number': 'LIC-12345',
            'phone': '0771234567',
            'is_verified': True
        }
    )
    print("Doctor A generated.")

    # 5. Doctor B
    doctor_b, _ = create_user('doctorB@nexclinic.test', 'TestPass@123', 'DOCTOR')
    DoctorProfile.objects.update_or_create(
        user=doctor_b,
        defaults={
            'full_name': 'Dr. Jane Roe',
            'specialization': 'Dermatologist',
            'license_number': 'LIC-54321',
            'phone': '0777654321',
            'is_verified': True
        }
    )
    print("Doctor B generated.")
    
    print("Test data generation complete!")

if __name__ == "__main__":
    generate_data()
