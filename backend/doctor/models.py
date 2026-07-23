from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class DoctorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile')
    
    specialization = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50)
    phone = models.CharField(max_length=15)
    full_name = models.CharField(max_length=255, default="Doctor")
    preferred_name = models.CharField(max_length=100, default="Dr.")
    nic_number = models.CharField(max_length=20, default="")
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, default="Other")
    address = models.TextField(blank=True, default="")
    is_verified = models.BooleanField(default=False)
    experience_years = models.IntegerField(default=1)
    profile_picture = models.ImageField(upload_to='doctor_profiles/', null=True, blank=True)
    location = models.CharField(max_length=255, default="Colombo, Sri Lanka")
    qualifications = models.TextField(default="MBBS, MD")
    verified_hospitals = models.ManyToManyField('hospital.Hospital', related_name='verified_doctors', blank=True)
    languages_spoken = models.CharField(max_length=255, default="English")
    chat_fee = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    appointment_fee = models.DecimalField(max_digits=10, decimal_places=2, default=3500.00)
    online_doctor_payment = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    online_hospital_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    inperson_doctor_payment = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    inperson_hospital_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    availability = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.preferred_name} ({self.specialization})"




class DoctorAppointmentAvailability(models.Model):
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name='appointment_availabilities'
    )
    day_of_week = models.CharField(max_length=12)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'day_of_week', 'start_time', 'end_time'],
                name='unique_doctor_appointment_availability_window',
            )
        ]

    def __str__(self):
        return f"{self.doctor.preferred_name} - {self.day_of_week} {self.start_time} to {self.end_time}"


class AppointmentAvailableSlot(models.Model):
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='available_slots')
    date = models.DateField()
    day_of_week = models.CharField(max_length=12, blank=True, default='')
    date_start = models.DateTimeField(null=True, blank=True)
    date_end = models.DateTimeField(null=True, blank=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    booked_count = models.PositiveIntegerField(default=0)
    remaining_count = models.PositiveIntegerField(default=0)

    # additional fields
    slot_template = models.ForeignKey('hospital.SlotTemplate', null=True, blank=True, on_delete=models.SET_NULL, related_name='generated_slots')
    hospital = models.ForeignKey('hospital.Hospital', on_delete=models.CASCADE, related_name='appointment_slots')
    patient_limit = models.PositiveIntegerField(default=1)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_slots')
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'date_start', 'date_end'],
                name='unique_doctor_appointment_slot',
            )
        ]

    def save(self, *args, **kwargs):
        # Keep day_of_week consistent even if the client does not send it.
        if not self.day_of_week and hasattr(self, 'date_start'):
            self.day_of_week = self.date_start.strftime('%A')
        super().save(*args, **kwargs)
    
    def refresh_counts(self, save=True):
        booked = self.appointments.count()
        remaining = self.appointments.exclude(status=Appointment.Status.COMPLETED).count()
        self.booked_count = booked
        self.remaining_count = remaining

        if save:
            self.save(update_fields=["booked_count", "remaining_count"])

    def __str__(self):
        return f"{self.doctor.preferred_name} - {self.date} {self.start_time} to {self.end_time}"
    


class DoctorOnlineAdviceAvailability(models.Model):
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='online_advice_availabilities')
    day_of_week = models.CharField(max_length=12)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'day_of_week', 'start_time', 'end_time'],
                name='unique_doctor_online_advice_availability_window',
            )
        ]
    
    def __str__(self):
        return f"{self.doctor.preferred_name} - {self.day_of_week} {self.start_time} to {self.end_time}"


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    slot = models.ForeignKey(AppointmentAvailableSlot, on_delete=models.PROTECT, related_name="appointments")
        
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.PROTECT, related_name="appointments")

    patient = models.ForeignKey("patient.PatientProfile", on_delete=models.PROTECT, related_name="appointments")

    reason = models.TextField(blank=True, default="")
    # The hospital where the appointment will take place. Nullable for backwards compatibility.
    hospital = models.ForeignKey('hospital.Hospital', null=True, blank=True, on_delete=models.PROTECT, related_name='appointments')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING )

    # Cancellation metadata
    cancelled_by = models.CharField(max_length=20, choices=[('PATIENT', 'Patient'), ('ADMIN', 'Admin')], null=True, blank=True)
    cancellation_reason = models.TextField(null=True, blank=True, default="")
    cancelled_at = models.DateTimeField(null=True, blank=True)

    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['doctor', 'status']),
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['requested_at'])
        ]

    def clean(self):
        if self.slot.doctor != self.doctor:
            raise ValidationError("The doctor for the appointment must match the doctor of the slot.")

    def save(self, *args, **kwargs):
        self.full_clean()  # This will call the clean() method to validate the model
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Appointment for {self.patient.full_name} with {self.doctor.preferred_name} on {self.slot.date} from {self.slot.start_time} to {self.slot.end_time} - Status: {self.status}"    
    
