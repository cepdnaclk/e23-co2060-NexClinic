import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

# Replace 23 with the test user id you created earlier
TEST_USER_ID = 23

try:
    user = User.objects.get(pk=TEST_USER_ID)
    refresh = RefreshToken.for_user(user)
    print('access:', str(refresh.access_token))
    print('refresh:', str(refresh))
except Exception as e:
    print('Error:', e)
