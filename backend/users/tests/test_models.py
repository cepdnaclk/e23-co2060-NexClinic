from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from users.models import CustomUser, PendingUser, UserOTP, UserActivityLog

class CustomUserModelTests(TestCase):
    def test_create_user(self):
        user = CustomUser.objects.create_user(
            email='test@example.com',
            password='testpassword123',
            role=CustomUser.Role.PATIENT
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('testpassword123'))
        self.assertEqual(user.role, CustomUser.Role.PATIENT)
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_without_email_raises_error(self):
        with self.assertRaises(ValueError):
            CustomUser.objects.create_user(
                email='',
                password='testpassword123'
            )

    def test_create_superuser(self):
        admin_user = CustomUser.objects.create_superuser(
            email='admin@example.com',
            password='adminpassword'
        )
        self.assertEqual(admin_user.email, 'admin@example.com')
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        self.assertEqual(admin_user.role, CustomUser.Role.ADMIN)


class PendingUserModelTests(TestCase):
    def test_pending_user_creation(self):
        expires_at = timezone.now() + timedelta(minutes=10)
        pending = PendingUser.objects.create(
            email='pending@example.com',
            otp_code='123456',
            password='hashedpassword',
            role=CustomUser.Role.PATIENT,
            profile_data={"full_name": "Test Name"},
            expires_at=expires_at
        )
        self.assertEqual(pending.email, 'pending@example.com')
        self.assertEqual(pending.otp_code, '123456')
        self.assertEqual(str(pending), 'Pending registration for pending@example.com')


class UserOTPModelTests(TestCase):
    def test_user_otp_creation(self):
        user = CustomUser.objects.create_user(email='otp@example.com', password='pw')
        user_otp = UserOTP.objects.create(
            user=user,
            otp_code_hash='hashed_otp_here'
        )
        self.assertEqual(user_otp.user.email, 'otp@example.com')
        self.assertEqual(user_otp.otp_code_hash, 'hashed_otp_here')
        self.assertEqual(str(user_otp), f'OTP for {user.email}')


class UserActivityLogModelTests(TestCase):
    def test_user_activity_log_creation(self):
        user = CustomUser.objects.create_user(email='actor@example.com', password='pw')
        log = UserActivityLog.objects.create(
            actor_user=user,
            actor_email=user.email,
            action_type=UserActivityLog.ActionType.LOGIN,
            entity_type='CustomUser',
            entity_id=str(user.id)
        )
        self.assertEqual(log.action_type, UserActivityLog.ActionType.LOGIN)
        self.assertIn('LOGIN CustomUser', str(log))
