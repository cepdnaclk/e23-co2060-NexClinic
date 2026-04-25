import secrets
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password

logger = logging.getLogger(__name__)

def generate_otp():
    return str(secrets.randbelow(900000) + 100000)


def hash_otp(otp):
    return make_password(otp)


def verify_otp(otp, otp_hash):
    if not otp_hash:
        return False
    return check_password(otp, otp_hash)

def send_otp_email(email, otp):
    subject = 'Verify your email'
    message = f'Your OTP code is {otp}. It expires in 10 minutes.'
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )

def send_admin_notification_email(doctor_email, doctor_name):
    recipients = getattr(settings, 'ADMIN_NOTIFICATION_EMAILS', [])
    if not recipients:
        logger.warning('ADMIN_NOTIFICATION_EMAILS is empty; skipping doctor admin notification email.')
        return

    subject = 'Action Required: New Doctor Registration'
    message = f"""
    New Doctor Registered!
    
    Name: {doctor_name}
    Email: {doctor_email}
    
    Please log in to the admin dashboard to verify their details and approve their account.
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        recipients,
        fail_silently=False,
    )
