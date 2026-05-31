from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("patient", "0008_patientprofile_medical_documents_patientprofile_medical_reports"),
    ]

    operations = [
        migrations.AddField(
            model_name="patientprofile",
            name="emergency_contact_email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
    ]