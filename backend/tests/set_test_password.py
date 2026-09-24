import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
u = User.objects.filter(role='PATIENT').first()
if u:
    u.set_password('testpassword123')
    u.save()
    print('USER_EMAIL=' + u.email)
else:
    print('No patient found')
