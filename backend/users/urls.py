from django.urls import path
from .views import PatientRegisterView, DoctorRegisterView, VerifyOTPView, ResendOTPView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Patient/User URLs (default routes)
    path('register/', PatientRegisterView.as_view(), name='patient_register'),
    path('login/', TokenObtainPairView.as_view(), name='patient_login'),
    
    # Doctor URLs
    path('doctor/register/', DoctorRegisterView.as_view(), name='doctor_register'),
    path('doctor/login/', TokenObtainPairView.as_view(), name='doctor_login'),
    
    # OTP endpoints
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    
    # Token refresh
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
