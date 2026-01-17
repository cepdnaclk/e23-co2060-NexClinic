from django.urls import path
from .views import PatientRegisterView, DoctorRegisterView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('patient/register/', PatientRegisterView.as_view(), name='patient_register'),
    path('doctor/register/', DoctorRegisterView.as_view(), name='doctor_register'),
    
    # Shared Login (JWT logic is same for both)
    path('patient/login/', TokenObtainPairView.as_view(), name='patient_login'),
    path('doctor/login/', TokenObtainPairView.as_view(), name='doctor_login'),
    
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
