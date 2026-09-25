import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
import requests

User = get_user_model()
u = User.objects.filter(email='cmind6654@gmail.com').first()
if not u:
    print("User not found")
    sys.exit(1)

refresh = RefreshToken.for_user(u)
access_token = str(refresh.access_token)
refresh_token = str(refresh)

nextjs_url = "http://localhost:3000/api/patient/profile"
cookies = {
    "authToken": access_token,
    "refreshToken": refresh_token
}

img_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

files = {
    "profileImage": ("test_nextjs.png", img_content, "image/png"),
}
data = {
    "fullName": "Test Patient Updated Via Nextjs"
}

try:
    print("Uploading to Next.js...")
    res = requests.patch(nextjs_url, files=files, data=data, cookies=cookies)
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print(f"Upload failed: {e}")
