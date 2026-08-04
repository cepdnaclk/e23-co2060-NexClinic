# Generated manually

from django.db import migrations

def populate_appointment_fee(apps, schema_editor):
    Appointment = apps.get_model('doctor', 'Appointment')
    
    # We update each appointment with its doctor's current appointment_fee
    # to serve as a fallback for existing records.
    for appointment in Appointment.objects.all().select_related('doctor'):
        if appointment.doctor and appointment.doctor.appointment_fee:
            appointment.appointment_fee = appointment.doctor.appointment_fee
            appointment.save(update_fields=['appointment_fee'])

class Migration(migrations.Migration):

    dependencies = [
        ('doctor', '0025_appointment_appointment_fee'),
    ]

    operations = [
        migrations.RunPython(populate_appointment_fee, reverse_code=migrations.RunPython.noop),
    ]
