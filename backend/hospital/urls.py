from django.urls import path
from .views import ActivityLogListView, ReportsView

urlpatterns = [
    path('activity-logs/', ActivityLogListView.as_view(), name='hospital-activity-logs'),
    path('reports/', ReportsView.as_view(), name='hospital-reports'),
]
