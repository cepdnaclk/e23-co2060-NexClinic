from django.urls import path
from .views import (
    PatientProfileView,
    PatientAppointmentsView,
    PatientAppointmentCancelView,
    PatientAvailableAppointmentSlotsView,
    PatientMedicationsView,
    PatientMedicationDetailView,
)

urlpatterns = [
    path("profile/", PatientProfileView.as_view(), name="patient-profile"),
    path("appointments/", PatientAppointmentsView.as_view(), name="patient-appointments"),
    path("appointments/<int:appointment_id>/cancel/", PatientAppointmentCancelView.as_view(), name="patient-appointment-cancel"),
    path("appointment-slots/", PatientAvailableAppointmentSlotsView.as_view(), name="patient-appointment-slots"),
    path("medications/", PatientMedicationsView.as_view(), name="patient-medications"),
    path("medications/<str:medication_id>/", PatientMedicationDetailView.as_view(), name="patient-medication-detail"),
]
