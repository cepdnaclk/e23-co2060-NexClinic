from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("doctor", "0023_remove_hospitaladmin_hospital_and_more"),
        ("patient", "0013_patientprofile_doctor_comments_prescriptions"),
    ]

    operations = [
        migrations.CreateModel(
            name="PatientMedicalRecord",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "visit_date",
                    models.DateField(default=django.utils.timezone.localdate),
                ),
                ("hospital_name", models.CharField(max_length=255)),
                ("doctor_name", models.CharField(max_length=255)),
                ("observations", models.TextField(blank=True, default="")),
                ("diagnosis", models.TextField(blank=True, default="")),
                ("comments", models.TextField(blank=True, default="")),
                ("prescriptions", models.TextField(blank=True, default="")),
                ("recommended_tests", models.TextField(blank=True, default="")),
                ("follow_up_date", models.DateField(blank=True, null=True)),
                ("follow_up_notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "appointment",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="medical_record",
                        to="doctor.appointment",
                    ),
                ),
                (
                    "doctor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="medical_records",
                        to="doctor.doctorprofile",
                    ),
                ),
                (
                    "patient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="medical_records",
                        to="patient.patientprofile",
                    ),
                ),
            ],
            options={
                "ordering": ["-visit_date", "-created_at"],
            },
        ),
    ]
