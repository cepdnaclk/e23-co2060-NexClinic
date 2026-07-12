from django.urls import path

from .views import ActivityLogListView, ReportsView
from .views import AvailableDoctorsView, ActiveHospitalListView, ManageHospitalDoctorView, CreateHospitalDoctorView, HospitalAdminProfileView

urlpatterns = [
    path('active/', ActiveHospitalListView.as_view(), name='hospital-active-list'),
    path('profile/', HospitalAdminProfileView.as_view(), name='hospital-admin-profile'),
    path('activity-logs/', ActivityLogListView.as_view(), name='hospital-activity-logs'),
    path('reports/', ReportsView.as_view(), name='hospital-reports'),
    path('available-doctors/', AvailableDoctorsView.as_view(), name='available-doctors'),
    path('manage-doctor/', ManageHospitalDoctorView.as_view(), name='manage-doctor'),
    path('create-doctor/', CreateHospitalDoctorView.as_view(), name='create-doctor'),
]

