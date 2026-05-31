from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("patient", "0007_patientprofile_allergies_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="patientprofile",
            name="medical_documents",
            field=models.FileField(blank=True, null=True, upload_to="patient_documents/"),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="medical_reports",
            field=models.FileField(blank=True, null=True, upload_to="patient_reports/"),
        ),
    ]