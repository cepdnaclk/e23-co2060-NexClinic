from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("doctor", "0023_remove_hospitaladmin_hospital_and_more"),
        ("patient", "0014_patientmedicalrecord"),
    ]

    operations = [
        migrations.CreateModel(
            name="Prescription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("medicine_name", models.CharField(max_length=255)),
                ("amount", models.DecimalField(blank=True, decimal_places=3, max_digits=10, null=True)),
                ("unit", models.CharField(blank=True, default="", max_length=30)),
                ("duration", models.CharField(blank=True, default="", max_length=100)),
                ("frequency", models.CharField(blank=True, default="", max_length=100)),
                ("timings", models.JSONField(blank=True, default=list)),
                ("notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "appointment",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="prescription_items",
                        to="doctor.appointment",
                    ),
                ),
                (
                    "doctor",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="prescription_items",
                        to="doctor.doctorprofile",
                    ),
                ),
                (
                    "medical_record",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="prescription_items",
                        to="patient.patientmedicalrecord",
                    ),
                ),
                (
                    "patient",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="prescription_items",
                        to="patient.patientprofile",
                    ),
                ),
            ],
            options={"ordering": ["id"]},
        ),
    ]
