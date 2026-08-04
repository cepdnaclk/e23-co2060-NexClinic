import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    with open('test_out.log', 'w', encoding='utf-8') as f:
        sys.stdout = f
        sys.stderr = f
        try:
            execute_from_command_line(['manage.py', 'test', 'doctor', 'hospital', 'patient'])
        except SystemExit:
            pass
