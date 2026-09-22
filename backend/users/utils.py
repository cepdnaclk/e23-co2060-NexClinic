import secrets
import string
import logging
from notifications.mail_utils import send_templated_email
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password

logger = logging.getLogger(__name__)


class CredentialEmailDeliveryError(RuntimeError):
    pass

def generate_otp():
    return str(secrets.randbelow(900000) + 100000)


def generate_temporary_password(length=16):
    """Generate a password containing every required character category."""
    if length < 12:
        raise ValueError('Temporary passwords must be at least 12 characters long.')

    alphabet = string.ascii_letters + string.digits + '!@#$%^&*'
    required = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.digits),
        secrets.choice('!@#$%^&*'),
    ]
    remaining = [secrets.choice(alphabet) for _ in range(length - len(required))]
    characters = required + remaining
    secrets.SystemRandom().shuffle(characters)
    return ''.join(characters)


def hash_otp(otp):
    return make_password(otp)


def verify_otp(otp, otp_hash):
    if not otp_hash:
        return False
    return check_password(otp, otp_hash)

def send_otp_email(email, otp):
    context = {
        "otp": otp,
        "expires_in": 10
    }
    send_templated_email(
        template_name="otp_verification",
        context=context,
        recipients=[email],
        fail_silently=False,
    )


def send_doctor_account_credentials_email(email, password, doctor_name):
    """Send the credentials for an account created by a hospital admin."""
    frontend_base_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000').rstrip('/')
    login_url = f'{frontend_base_url}/doctor/login'
    reset_url = f'{frontend_base_url}/reset-password?role=doctor'
    display_name = (doctor_name or '').strip() or 'Doctor'

    context = {
        "display_name": display_name,
        "email": email,
        "password": password,
        "login_url": login_url,
        "reset_url": reset_url
    }

    try:
        sent_count = send_templated_email(
            template_name="doctor_credentials",
            context=context,
            recipients=[email],
            fail_silently=False,
        )
    except Exception as exc:
        raise CredentialEmailDeliveryError(
            f'Credential email delivery failed for {email}.'
        ) from exc
    if sent_count != 1:
        raise CredentialEmailDeliveryError(
            f'Credential email was not accepted for delivery to {email}.'
        )
    logger.info('doctor_credentials_email.accepted recipient=%s', email)
    return sent_count



def send_admin_notification_email(doctor_email, doctor_name):
    recipients = getattr(settings, 'ADMIN_NOTIFICATION_EMAILS', [])
    if not recipients:
        logger.warning('ADMIN_NOTIFICATION_EMAILS is empty; skipping doctor admin notification email.')
        return

    context = {
        "doctor_name": doctor_name,
        "doctor_email": doctor_email
    }
    
    send_templated_email(
        template_name="admin_new_doctor",
        context=context,
        recipients=recipients,
        fail_silently=False,
    )
