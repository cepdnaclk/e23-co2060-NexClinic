from django.urls import path
from .views import PatientRegisterView, DoctorRegisterView, VerifyOTPView, ResendOTPView, LogoutView, DoctorLoginView, PatientLoginView, PasswordResetRequestView, PasswordResetConfirmView
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
    
    # OTP endpoints
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    
    # Token refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # JWT logout
    path('logout/', LogoutView.as_view(), name='logout'),

    # Password Reset
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
