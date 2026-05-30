from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("doctor", "0020_add_doctorprofile_address"),
        ("hospital", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="doctorprofile",
            name="verified_hospitals",
            field=models.ManyToManyField(related_name="verified_doctors", to="hospital.Hospital", blank=True),
        ),
    ]
