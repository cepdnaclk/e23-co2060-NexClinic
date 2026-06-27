from django.urls import path
from .views import (PatientRegisterView, DoctorRegisterView, HospitalAdminRegisterView, 
                    VerifyOTPView, ResendOTPView, LogoutView, DoctorLoginView, 
                    PatientLoginView, HospitalAdminLoginView,
                    PasswordResetRequestView, PasswordResetConfirmView,
                    LoginVerifyOTPView, LoginResendOTPView)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    # Patient/User URLs (default routes)
    path('register/', PatientRegisterView.as_view(), name='patient_register'),
    path('login/', PatientLoginView.as_view(), name='patient_login'),
    
    # Doctor URLs
    path('doctor/register/', DoctorRegisterView.as_view(), name='doctor_register'),
    path('doctor/login/', DoctorLoginView.as_view(), name='doctor_login'),
    
    # Hospital Admin URLs
    path('hospital-admin/register/', HospitalAdminRegisterView.as_view(), name='hospital_admin_register'),
    path('hospital-admin/login/', HospitalAdminLoginView.as_view(), name='hospital_admin_login'),
    
    # OTP endpoints (Registration)
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),

    # OTP endpoints (Login 2FA)
    path('login/verify-otp/', LoginVerifyOTPView.as_view(), name='login_verify_otp'),
    path('login/resend-otp/', LoginResendOTPView.as_view(), name='login_resend_otp'),
    
    # Token refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # JWT logout
    path('logout/', LogoutView.as_view(), name='logout'),

    # Password Reset
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
