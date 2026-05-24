from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("doctor", "0014_alter_doctorprofile_experience_years_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="doctorprofile",
            name="date_of_birth",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="doctorprofile",
            name="gender",
            field=models.CharField(blank=True, default="", max_length=10),
        ),
        migrations.AddField(
            model_name="doctorprofile",
            name="blood_type",
            field=models.CharField(blank=True, default="", max_length=5),
        ),
        migrations.AddField(
            model_name="doctorprofile",
            name="address",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
