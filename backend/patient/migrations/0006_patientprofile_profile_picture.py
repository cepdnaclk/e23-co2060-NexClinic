from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("patient", "0005_patientprofile_extended_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="patientprofile",
            name="profile_picture",
            field=models.ImageField(blank=True, null=True, upload_to="patient_profiles/"),
        ),
    ]
