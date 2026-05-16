from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("patient", "0004_alter_patientprofile_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="patientprofile",
            name="allergies",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="blood_type",
            field=models.CharField(blank=True, default="", max_length=10),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="city",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="country",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="emergency_contact_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="emergency_contact_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="emergency_contact_relation",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="insurance_policy_number",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="insurance_provider",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="medications",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="postal_code",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
    ]
