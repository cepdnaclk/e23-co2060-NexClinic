from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("doctor", "0021_add_verified_hospitals"),
    ]

    operations = [
        migrations.RemoveField(
            model_name='doctorprofile',
            name='hospitals',
        ),
    ]
