from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('doctor', '0017_doctorprofile_gender'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="""
                        ALTER TABLE doctor_doctorprofile
                        ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';
                    """,
                    reverse_sql="ALTER TABLE doctor_doctorprofile DROP COLUMN IF EXISTS address;",
                ),
                migrations.RunSQL(
                    sql="UPDATE doctor_doctorprofile SET address = '' WHERE address IS NULL;",
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='doctorprofile',
                    name='address',
                    field=models.TextField(blank=True, default=''),
                ),
            ],
        ),
    ]