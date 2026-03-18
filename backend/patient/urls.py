from django.urls import path
from .views import (
    PatientProfileView,
    PatientAppointmentsView,
    PatientAppointmentCancelView,
    PatientAvailableAppointmentSlotsView,
)

urlpatterns = [
    path("profile/", PatientProfileView.as_view(), name="patient-profile"),
    path("appointments/", PatientAppointmentsView.as_view(), name="patient-appointments"),
    path("appointments/<int:appointment_id>/cancel/", PatientAppointmentCancelView.as_view(), name="patient-appointment-cancel"),
    path("appointment-slots/", PatientAvailableAppointmentSlotsView.as_view(), name="patient-appointment-slots"),
]
