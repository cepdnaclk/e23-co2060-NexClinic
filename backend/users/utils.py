import random
from django.core.mail import send_mail
from django.conf import settings

def generate_otp():
    return str(random.randint(100000, 999999))

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
        ['nexclinicbynexaura@gmail.com'],
        fail_silently=False,
    )
