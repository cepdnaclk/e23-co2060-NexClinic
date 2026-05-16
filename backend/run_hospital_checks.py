import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')

import django
django.setup()

from users.models import CustomUser
import uuid
from hospital.models import Hospital, ActivityLog, SlotTemplate, DoctorHospitalVerification
from doctor.models import DoctorProfile, AppointmentAvailableSlot, Appointment
from patient.models import PatientProfile
from django.core.management import call_command
from django.utils import timezone
from datetime import time, datetime

def run_checks():
    print('Running hospital quick checks...')
    # Model create
    uid = uuid.uuid4().hex[:8]
    u = CustomUser.objects.create_user(email=f'chk+{uid}@example.com', password='pass')
    h = Hospital.objects.create(name=f'Chk Hospital {uuid.uuid4().hex[:6]}')
    log = ActivityLog.objects.create(user=u, hospital=h, action='chk')
    print('ActivityLog created:', log.id)

    # Signals: doctor verification
    duser = CustomUser.objects.create_user(email=f'docchk+{uuid.uuid4().hex[:6]}@example.com', password='pass', role=CustomUser.Role.DOCTOR)
    doctor = DoctorProfile.objects.create(user=duser, specialization='X', license_number='Lx', phone='111', full_name='DocChk')
    verifier = CustomUser.objects.create_user(email=f'ver+{uuid.uuid4().hex[:6]}@example.com', password='pass', role=CustomUser.Role.HOSPITAL_ADMIN)
    ver = DoctorHospitalVerification.objects.create(doctor=doctor, hospital=h, status=DoctorHospitalVerification.Status.VERIFIED, verified_by=verifier)
    found = ActivityLog.objects.filter(action__contains='doctor_verification').exists()
    print('Doctor verification log created:', found)

    # Management command: create template and run generator
    today = timezone.now().date()
    SlotTemplate.objects.create(doctor=doctor, hospital=h, day_of_week=today.weekday(), start_time=time(9,0), end_time=time(9,30), created_by=verifier)
    call_command('generate_appointment_slots', '--days', '1')
    slots_exist = AppointmentAvailableSlot.objects.filter(hospital=h).exists()
    print('Slots generated:', slots_exist)

    # Appointment booking signal
    puser = CustomUser.objects.create_user(email=f'pch+{uuid.uuid4().hex[:6]}@example.com', password='pass', role=CustomUser.Role.PATIENT)
    patient = PatientProfile.objects.create(user=puser, full_name='PatChk', date_of_birth=timezone.now().date(), gender='Other', phone='0123456', address='Nowhere')
    slot = AppointmentAvailableSlot.objects.filter(hospital=h).first()
    appt = Appointment.objects.create(slot=slot, doctor=doctor, patient=patient, hospital=h, status=Appointment.Status.ACCEPTED)
    booked = ActivityLog.objects.filter(action='appointment_booked').exists()
    print('Appointment booked log created:', booked)

if __name__ == '__main__':
    run_checks()
