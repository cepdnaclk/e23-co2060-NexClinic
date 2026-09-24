from django.db import migrations


def restore_missing_file_columns(apps, schema_editor):
    profile = apps.get_model("patient", "PatientProfile")
    table = profile._meta.db_table

    with schema_editor.connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(cursor, table)
        }

    for field_name in ("medical_documents", "medical_reports"):
        try:
            field = profile._meta.get_field(field_name)
            if hasattr(field, 'column') and field.column not in existing_columns:
                schema_editor.add_field(profile, field)
        except Exception:
            pass


class Migration(migrations.Migration):
    dependencies = [
        ("patient", "0023_alter_patientprofile_medical_documents_and_more"),
    ]

    operations = [
        migrations.RunPython(restore_missing_file_columns, migrations.RunPython.noop),
    ]
