from django.urls import path
from .views import DoctorDashboardView, DoctorProfileView

urlpatterns = [
    path("dashboard/", DoctorDashboardView.as_view(), name="doctor-dashboard"),
    path("profile/", DoctorProfileView.as_view(), name="doctor-profile"),
]
