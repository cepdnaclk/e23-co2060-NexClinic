# NexClinic Backend Management Commands

Quick single-line commands for managing doctors, patients, appointments, and slots.

## Setup

Activate virtualenv:
```powershell
& "d:\UoP\Semester 3\CO2060\cepdnaclk\e23-co2060-NexClinic\nexclinic-venv\Scripts\Activate.ps1"
```

Navigate to backend:
```powershell
cd backend
```

## Commands

### 1. Create a Hospital
```powershell
python manage.py shell -c "from hospital.models import Hospital; Hospital.objects.create(name='My Hospital')"
```

### 2. Create a Doctor

**Basic:**
```powershell
python manage.py create_doctor --email doc1@example.com --password pass123 --name "Dr John Smith" --license LIC001 --specialization Cardiology
```

**With hospital attachment:**
```powershell
python manage.py create_doctor --email doc2@example.com --password pass123 --name "Dr Jane Doe" --license LIC002 --specialization Surgery --hospital "My Hospital" --auto-verify
```

**Options:**
- `--email` (required): Email address
- `--password` (required): Password
- `--name` (required): Full name
- `--license` (required): Medical license number
- `--specialization` (default: "General"): Specialization
- `--phone` (default: "0770000000"): Phone number
- `--hospital`: Attach to hospital by name
- `--auto-verify`: Auto-approve at hospital (requires --hospital)

### 3. Create a Patient

**Basic:**
```powershell
python manage.py create_patient --email pat1@example.com --password pass123 --name "John Patient"
```

**With date of birth:**
```powershell
python manage.py create_patient --email pat2@example.com --password pass123 --name "Jane Patient" --dob 1990-05-15 --phone 0778888888 --address "123 Main St"
```

**Options:**
- `--email` (required): Email address
- `--password` (required): Password
- `--name` (required): Full name
- `--dob` (default: 30 years ago): Date of birth (YYYY-MM-DD)
- `--gender` (default: "Other"): Male/Female/Other
- `--phone` (default: "0770000000"): Phone number
- `--address` (default: "Not specified"): Address

### 4. Create Slot Template (Reusable weekly schedule)

Use Django shell:
```powershell
python manage.py shell
```

Then paste:
```python
from hospital.models import SlotTemplate, Hospital
from doctor.models import DoctorProfile
from users.models import CustomUser
from datetime import time

# Get doctor and hospital
doc = DoctorProfile.objects.get(user__email='doc1@example.com')
hosp = Hospital.objects.get(name='My Hospital')
creator = CustomUser.objects.get(email='doc1@example.com')

# Create a Monday-Friday 9:00-9:30 slot template
for weekday in range(5):  # Monday=0 to Friday=4
    SlotTemplate.objects.get_or_create(
        doctor=doc,
        hospital=hosp,
        day_of_week=weekday,
        start_time=time(9, 0),
        end_time=time(9, 30),
        created_by=creator
    )

print("✓ Slot templates created for Mon-Fri 9:00-9:30")
```

### 5. Generate Appointment Slots from Templates

Generates slots for the next N days (Friday onwards):
```powershell
python manage.py generate_appointment_slots --days 14
```

Or target specific doctor/hospital:
```powershell
python manage.py generate_appointment_slots --days 7 --doctor-id 1 --hospital-id 1
```

### 6. Book an Appointment

**Basic (today at 9:00):**
```powershell
python manage.py book_appointment --patient-email pat1@example.com --doctor-email doc1@example.com --hospital "My Hospital"
```

**With specific date/time:**
```powershell
python manage.py book_appointment --patient-email pat1@example.com --doctor-email doc1@example.com --hospital "My Hospital" --date 2026-05-20 --time 10:30 --reason "Chest pain follow-up"
```

**Options:**
- `--patient-email` (required): Patient email
- `--doctor-email` (required): Doctor email
- `--hospital` (required): Hospital name
- `--date` (default: today): Appointment date (YYYY-MM-DD)
- `--time` (default: 09:00): Appointment time (HH:MM)
- `--reason` (default: "General consultation"): Reason for visit

## Complete Workflow Example

```powershell
# 1. Create hospital
python manage.py shell -c "from hospital.models import Hospital; Hospital.objects.get_or_create(name='City Hospital')"

# 2. Create doctor
python manage.py create_doctor --email cardio@example.com --password pass123 --name "Dr Cardio" --license CARD001 --specialization Cardiology --hospital "City Hospital" --auto-verify

# 3. Create patient
python manage.py create_patient --email patient@example.com --password pass123 --name "Mr Patient"

# 4. Create slot template (in shell) and generate slots
python manage.py generate_appointment_slots --days 14

# 5. Book appointment
python manage.py book_appointment --patient-email patient@example.com --doctor-email cardio@example.com --hospital "City Hospital" --date 2026-05-20 --time 14:00
```

## View Data

### List doctors:
```powershell
python manage.py shell -c "from doctor.models import DoctorProfile; [print(f'{d.full_name} ({d.specialization})') for d in DoctorProfile.objects.all()]"
```

### List patients:
```powershell
python manage.py shell -c "from patient.models import PatientProfile; [print(f'{p.full_name}') for p in PatientProfile.objects.all()]"
```

### List appointments:
```powershell
python manage.py shell -c "from doctor.models import Appointment; [print(f'{a.patient.full_name} -> {a.doctor.preferred_name} ({a.status})') for a in Appointment.objects.all()]"
```

### List activity logs:
```powershell
python manage.py shell -c "from hospital.models import ActivityLog; [print(f'{a.created_at}: {a.action}') for a in ActivityLog.objects.all().order_by('-created_at')]"
```
