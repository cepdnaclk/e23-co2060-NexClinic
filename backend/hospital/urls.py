from django.urls import path

from .views import (
    ActivityLogListView,
    DoctorAppointmentAnalyticsView,
    HospitalAppointmentListView,
    ReportsView,
    AvailableDoctorsView,
    ActiveHospitalListView,
    ManageHospitalDoctorView,
    CreateHospitalDoctorView,
    HospitalAdminProfileView,
    ManageDoctorFeesView,
    HospitalAppointmentCancelRequestAcceptView,
    HospitalAppointmentCancelView,
)

urlpatterns = [
    path("active/", ActiveHospitalListView.as_view(), name="hospital-active-list"),
    path("profile/", HospitalAdminProfileView.as_view(), name="hospital-admin-profile"),
    path(
        "activity-logs/", ActivityLogListView.as_view(), name="hospital-activity-logs"
    ),
    path("reports/", ReportsView.as_view(), name="hospital-reports"),
    path(
        "appointment-analytics/",
        DoctorAppointmentAnalyticsView.as_view(),
        name="hospital-appointment-analytics",
    ),
    path(
        "appointments/",
        HospitalAppointmentListView.as_view(),
        name="hospital-appointments",
    ),
    path(
        "available-doctors/", AvailableDoctorsView.as_view(), name="available-doctors"
    ),
    path("manage-doctor/", ManageHospitalDoctorView.as_view(), name="manage-doctor"),
    path("create-doctor/", CreateHospitalDoctorView.as_view(), name="create-doctor"),
    path(
        "doctor-fees/<int:doctor_id>/",
        ManageDoctorFeesView.as_view(),
        name="manage-doctor-fees",
    ),
    path(
        "appointments/<int:appointment_id>/accept-cancellation/",
        HospitalAppointmentCancelRequestAcceptView.as_view(),
        name="hospital-appointment-accept-cancellation",
    ),
    path(
        "appointments/<int:appointment_id>/cancel/",
        HospitalAppointmentCancelView.as_view(),
        name="hospital-appointment-cancel",
    ),
]
