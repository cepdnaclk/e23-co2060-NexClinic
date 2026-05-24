from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("doctor", "0015_doctorprofile_date_of_birth_gender_blood_type_and_address"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="doctorprofile",
            name="blood_type",
        ),
    ]
