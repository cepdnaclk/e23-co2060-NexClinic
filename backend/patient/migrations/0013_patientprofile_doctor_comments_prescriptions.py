from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("patient", "0012_alter_patientprofile_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="patientprofile",
            name="doctor_comments",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="patientprofile",
            name="prescriptions",
            field=models.TextField(blank=True, default=""),
        ),
    ]