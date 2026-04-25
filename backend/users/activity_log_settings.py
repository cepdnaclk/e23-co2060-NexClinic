"""Centralized activity log tuning settings.

Keep these constants in code (not environment variables) for predictable behavior.
"""

ACTIVITY_LOG_ENABLED = True
ACTIVITY_LOG_LOG_ALL_VIEWS = False

ACTIVITY_LOG_SENSITIVE_KEYS = {
    "password",
    "current_password",
    "new_password",
    "password1",
    "password2",
    "token",
    "access",
    "refresh",
    "otp",
    "otp_code",
    "nic",
    "nic_number",
    "phone",
    "license_number",
    "address",
    "profile_picture",
}

ACTIVITY_LOG_EXCLUDED_PATH_PREFIXES = (
    "/static/",
    "/media/",
    "/favicon.ico",
    "/health/",
    "/api/health/",
    "/docs/",
    "/redoc/",
    "/swagger/",
    "/openapi/",
)

ACTIVITY_LOG_SENSITIVE_VIEW_PREFIXES = (
    "/admin/",
    "/api/users/login/",
    "/api/users/logout/",
    "/api/users/verify-otp/",
    "/api/users/resend-otp/",
    "/api/doctor/appointments/",
    "/api/doctor/appointment-slots/",
    "/api/doctor/online-advice-slots/",
    "/api/patient/appointments/",
    "/api/patient/appointment-slots/",
)

ACTIVITY_LOG_EVENT_CATEGORY_PREFIXES = (
    ("/api/users/login/", "auth"),
    ("/api/users/logout/", "auth"),
    ("/api/users/verify-otp/", "auth"),
    ("/api/users/resend-otp/", "auth"),
    ("/api/doctor/appointments/", "doctor_appointments"),
    ("/api/doctor/appointment-slots/", "doctor_slots"),
    ("/api/doctor/online-advice-slots/", "doctor_online_advice"),
    ("/api/patient/appointments/", "patient_appointments"),
    ("/api/patient/appointment-slots/", "patient_slot_discovery"),
    ("/api/doctor/directory/", "doctor_directory"),
    ("/api/doctor/profile/", "doctor_profile"),
    ("/admin/", "admin"),
)

ACTIVITY_LOG_MAX_STRING_LENGTH = 300
ACTIVITY_LOG_MAX_LIST_ITEMS = 50
ACTIVITY_LOG_MAX_DICT_ITEMS = 50
ACTIVITY_LOG_MAX_PAYLOAD_CHARS = 4000

ACTIVITY_LOG_RETENTION_DAYS = 180
