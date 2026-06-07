from django.urls import path

from .views import ActivityLogListView, ReportsView
from .views import AvailableDoctorsView, ActiveHospitalListView

urlpatterns = [
    path('active/', ActiveHospitalListView.as_view(), name='hospital-active-list'),
    path('activity-logs/', ActivityLogListView.as_view(), name='hospital-activity-logs'),
    path('reports/', ReportsView.as_view(), name='hospital-reports'),
    path('api/hospital/available-doctors', AvailableDoctorsView.as_view(), name='available-doctors'),
]
