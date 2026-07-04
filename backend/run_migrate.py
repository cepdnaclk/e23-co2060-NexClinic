import os
import django
import sys

print("Setting up Django settings...")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "main.settings")
django.setup()

from django.core.management import call_command

print("Running showmigrations...")
try:
    call_command("showmigrations")
    print("\nRunning migrate...")
    call_command("migrate")
    print("Migration finished successfully!")
except Exception as e:
    import traceback
    print("Migration failed:", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)
