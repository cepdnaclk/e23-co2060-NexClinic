from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('doctor', '0019_remove_doctorprofile_address'),
    ]

    operations = [
        migrations.AddField(
            model_name='doctorprofile',
            name='address',
            field=models.TextField(blank=True, default=''),
        ),
    ]