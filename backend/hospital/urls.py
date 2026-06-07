from django.urls import path
from .views import ActiveHospitalListView, ActivityLogListView, ReportsView

urlpatterns = [
    path('active/', ActiveHospitalListView.as_view(), name='hospital-active-list'),
    path('activity-logs/', ActivityLogListView.as_view(), name='hospital-activity-logs'),
    path('reports/', ReportsView.as_view(), name='hospital-reports'),
]
