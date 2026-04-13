from django.urls import path
from .views import (
    DoctorSpecializationsView,
    DoctorDirectoryView,
    DoctorDirectoryDetailView,
    DoctorDashboardView,
    DoctorProfileView,
    DoctorAppointmentsView,
    DoctorAppointmentActionView,
    DoctorAppointmentRescheduleView,
    DoctorAppointmentSlotsView,
    DoctorAppointmentSlotDetailView,
    DoctorOnlineAdviceSlotsView,
    DoctorOnlineAdviceSlotDetailView,
)

urlpatterns = [
    path("specializations/", DoctorSpecializationsView.as_view(), name="doctor-specializations"),
    path("directory/", DoctorDirectoryView.as_view(), name="doctor-directory"),
    path("directory/<int:doctor_id>/", DoctorDirectoryDetailView.as_view(), name="doctor-directory-detail"),
    path("dashboard/", DoctorDashboardView.as_view(), name="doctor-dashboard"),
    path("profile/", DoctorProfileView.as_view(), name="doctor-profile"),
    path("appointments/", DoctorAppointmentsView.as_view(), name="doctor-appointments"),
    path("appointments/<int:appointment_id>/action/", DoctorAppointmentActionView.as_view(), name="doctor-appointment-action"),
    path("appointments/<int:appointment_id>/reschedule/", DoctorAppointmentRescheduleView.as_view(), name="doctor-appointment-reschedule"),
    path("appointment-slots/", DoctorAppointmentSlotsView.as_view(), name="doctor-appointment-slots"),
    path("appointment-slots/<int:slot_id>/", DoctorAppointmentSlotDetailView.as_view(), name="doctor-appointment-slot-detail"),
    path("online-advice-slots/", DoctorOnlineAdviceSlotsView.as_view(), name="doctor-online-advice-slots"),
    path("online-advice-slots/<int:slot_id>/", DoctorOnlineAdviceSlotDetailView.as_view(), name="doctor-online-advice-slot-detail"),
]
