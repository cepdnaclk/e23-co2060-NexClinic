from django.urls import path
from .views import (
    PatientProfileView,
    PatientAppointmentsView,
    PatientAppointmentCancelView,
    PatientAppointmentConfirmPaymentView,
    PatientAvailableAppointmentSlotsView,
    PatientMedicationsView,
    PatientMedicationDetailView,
    MedicationReminderView,
    MedicationReminderDetailView,
    MedicationLogView,
    MedicationLogDetailView,
)

urlpatterns = [
    path("profile/", PatientProfileView.as_view(), name="patient-profile"),
    path("appointments/", PatientAppointmentsView.as_view(), name="patient-appointments"),
    path("appointments/<int:appointment_id>/cancel/", PatientAppointmentCancelView.as_view(), name="patient-appointment-cancel"),
    path("appointments/<int:appointment_id>/pay/", PatientAppointmentConfirmPaymentView.as_view(), name="patient-appointment-pay"),
    path("appointment-slots/", PatientAvailableAppointmentSlotsView.as_view(), name="patient-appointment-slots"),
    path("medications/", PatientMedicationsView.as_view(), name="patient-medications"),
    path("medications/<str:medication_id>/", PatientMedicationDetailView.as_view(), name="patient-medication-detail"),
    path("reminders/", MedicationReminderView.as_view(), name="patient-reminders"),
    path("reminders/<int:reminder_id>/", MedicationReminderDetailView.as_view(), name="patient-reminder-detail"),
    path("logs/", MedicationLogView.as_view(), name="patient-logs"),
    path("logs/<int:log_id>/", MedicationLogDetailView.as_view(), name="patient-log-detail"),
]
