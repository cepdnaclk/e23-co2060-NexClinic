import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'patient_patientprofile'")
rows = cursor.fetchall()

with open("db_output.txt", "w") as f:
    f.write("FIELDS IN DB:\n")
    for r in rows:
        f.write(str(r) + "\n")
