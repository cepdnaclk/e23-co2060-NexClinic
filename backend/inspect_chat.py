import os
import sys
import django

# Setup django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from users.models import CustomUser
from chat.models import AdviceChatThread, AdviceChatMessage
from doctor.models import DoctorProfile
from patient.models import PatientProfile

def inspect():
    print("=== Custom Users ===")
    for u in CustomUser.objects.all():
        print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, IsActive: {u.is_active}")
        
    print("\n=== Chat Threads ===")
    for t in AdviceChatThread.objects.all():
        print(f"ID: {t.id}, Code: {t.thread_code}, Status: {t.status}, Patient: {t.patient.full_name if t.patient else 'None'}, Doctor: {t.doctor.full_name if t.doctor else 'None'}, Expires: {t.expires_at}")
        
    print("\n=== Recent Messages ===")
    for m in AdviceChatMessage.objects.order_by('-sent_at')[:10]:
        print(f"Thread ID: {m.thread_id}, Sender: {m.sender_user.email}, Role: {m.sender_role}, Text: {m.message_text[:30]}, Sent: {m.sent_at}")

if __name__ == '__main__':
    inspect()
