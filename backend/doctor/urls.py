from django.urls import path
from .views import (
    DoctorDashboardView,
    DoctorProfileView,
    DoctorAppointmentSlotsView,
    DoctorAppointmentSlotDetailView,
    DoctorOnlineAdviceSlotsView,
    DoctorOnlineAdviceSlotDetailView,
)

urlpatterns = [
    path("dashboard/", DoctorDashboardView.as_view(), name="doctor-dashboard"),
    path("profile/", DoctorProfileView.as_view(), name="doctor-profile"),
    path("appointment-slots/", DoctorAppointmentSlotsView.as_view(), name="doctor-appointment-slots"),
    path("appointment-slots/<int:slot_id>/", DoctorAppointmentSlotDetailView.as_view(), name="doctor-appointment-slot-detail"),
    path("online-advice-slots/", DoctorOnlineAdviceSlotsView.as_view(), name="doctor-online-advice-slots"),
    path("online-advice-slots/<int:slot_id>/", DoctorOnlineAdviceSlotDetailView.as_view(), name="doctor-online-advice-slot-detail"),
]
