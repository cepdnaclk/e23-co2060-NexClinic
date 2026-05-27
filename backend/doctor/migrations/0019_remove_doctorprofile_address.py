from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('doctor', '0018_doctorprofile_address'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="ALTER TABLE doctor_doctorprofile DROP COLUMN IF EXISTS address;",
                    reverse_sql="ALTER TABLE doctor_doctorprofile ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';",
                ),
            ],
            state_operations=[
                migrations.RemoveField(
                    model_name='doctorprofile',
                    name='address',
                ),
            ],
        ),
    ]