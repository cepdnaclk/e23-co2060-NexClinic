"""
Centralized Email Templates for NexClinic
-----------------------------------------
This file contains all the email templates used by the backend.
You can easily edit the subjects and body messages here without touching the core code.

Available variables depend on the template type. Use `{variable_name}` to insert a variable.
"""

EMAIL_TEMPLATES = {
    # -------------------------
    # Hospital & Appointments
    # -------------------------
    "doctor_verification_verified": {
        "subject": "Your verification status at {hospital_name} changed",
        "body": "Hello {doctor_email},\n\nYour profile has been verified for {hospital_name}."
    },
    
    "doctor_verification_rejected": {
        "subject": "Your verification status at {hospital_name} changed",
        "body": "Hello {doctor_email},\n\nYour verification was rejected for {hospital_name}. Reason: {rejection_reason}"
    },
    
    "appointment_confirmed": {
        "subject": "Appointment confirmed - #{appointment_number}",
        "body": "Hello {patient_name},\n\nYour appointment with {doctor_name} at {date} {time} has been confirmed. Your appointment number is #{appointment_number}."
    },
    
    "appointment_cancelled": {
        "subject": "Appointment cancelled",
        "body": "Hello {patient_name},\n\nYour appointment with {doctor_name} on {date} has been cancelled. Reason: {cancellation_reason}"
    },
    
    # -------------------------
    # User Authentication
    # -------------------------
    "otp_verification": {
        "subject": "Verify your email",
        "body": "Your OTP code is {otp}. It expires in {expires_in} minutes."
    },
    
    "doctor_credentials": {
        "subject": "Your NexClinic doctor account",
        "body": (
            "Hello {display_name},\n\n"
            "A hospital administrator has created a NexClinic doctor account for you.\n\n"
            "Login email: {email}\n"
            "Temporary password: {password}\n"
            "Login: {login_url}\n\n"
            "Use these credentials for your first login. Keep this password private. "
            "If you want to change it, use the Forgot password option or visit {reset_url}.\n\n"
            "If you were not expecting this account, please contact your hospital administrator."
        )
    },
    
    "admin_new_doctor": {
        "subject": "Action Required: New Doctor Registration",
        "body": (
            "New Doctor Registered!\n\n"
            "Name: {doctor_name}\n"
            "Email: {doctor_email}\n\n"
            "Please log in to the admin dashboard to verify their details and approve their account."
        )
    },
    
    "password_reset": {
        "subject": "Reset your NexClinic password",
        "body": (
            "Hello,\n\n"
            "You requested a password reset for your NexClinic account.\n"
            "Click this link to set a new password:\n{reset_link}\n\n"
            "If you did not request this, you can safely ignore this email."
        )
    },
    
    # -------------------------
    # General Notifications
    # -------------------------
    "general_notification": {
        "subject": "NexClinic Notification: {title}",
        "body": (
            "You have a new notification:\n\n"
            "{title}\n"
            "{message}\n\n"
            "Login to NexClinic to view details."
        )
    },
    
    # You can customize these specific notification types if needed
    "medication_reminder": {
        "subject": "Medication Reminder: {title}",
        "body": (
            "Hello,\n\n"
            "It is time to take your medication:\n\n"
            "{title}\n"
            "{message}\n\n"
            "Please login to NexClinic to view more details."
        )
    },
    
    "system_alert": {
        "subject": "System Alert: {title}",
        "body": (
            "System Alert:\n\n"
            "{title}\n"
            "{message}\n\n"
            "Please login to NexClinic to view more details."
        )
    }
}
