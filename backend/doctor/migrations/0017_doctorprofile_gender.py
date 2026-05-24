from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('doctor', '0016_remove_appointmentavailableslot_unique_doctor_appointment_slot_and_more'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        ALTER TABLE doctor_doctorprofile
                        ADD COLUMN IF NOT EXISTS gender varchar(20) NOT NULL DEFAULT 'Other';
                    """,
                    reverse_sql="ALTER TABLE doctor_doctorprofile DROP COLUMN IF EXISTS gender;",
                ),
                migrations.RunSQL(
                    sql="UPDATE doctor_doctorprofile SET gender = 'Other' WHERE gender IS NULL OR gender = '';",
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='doctorprofile',
                    name='gender',
                    field=models.CharField(default='Other', max_length=20),
                ),
            ],
        ),
    ]