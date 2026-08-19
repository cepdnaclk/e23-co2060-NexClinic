# Generated manually

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('doctor', '0024_add_doctor_fee_split_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='appointment_fee',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
    ]
