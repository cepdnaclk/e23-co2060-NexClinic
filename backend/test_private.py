import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()
from main.storage_backends import private_storage
from django.core.files.base import ContentFile
import urllib.request
name = private_storage.save('test_private.txt', ContentFile(b'hello private'))
url = private_storage.url(name)
print('Generated URL:', url)
try:
    req = urllib.request.Request(url)
    res = urllib.request.urlopen(req, timeout=5)
    print('Content:', res.read().decode())
except Exception as e:
    print('Error:', e.read().decode() if hasattr(e, 'read') else e)
