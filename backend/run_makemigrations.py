import os
import sys

print("OVERRIDING DATABASE_URL...")
os.environ["DATABASE_URL"] = "sqlite:///db.sqlite3"
print(f"DATABASE_URL is set to: {os.environ.get('DATABASE_URL')}")

print("SETTING UP DJANGO...")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "main.settings")

# Write output to a local log file immediately to debug
log_file = open("migrations_run.log", "w", encoding="utf-8")
sys.stdout = log_file
sys.stderr = log_file

print("Starting makemigrations...", flush=True)

try:
    from django.core.management import execute_from_command_line
    # We want to run: manage.py makemigrations --noinput
    sys.argv = ["manage.py", "makemigrations", "--noinput"]
    execute_from_command_line(sys.argv)
    print("makemigrations completed successfully!", flush=True)
except Exception as e:
    import traceback
    print("ERROR OCCURRED:", flush=True)
    traceback.print_exc(file=log_file)
    log_file.flush()
finally:
    log_file.close()
