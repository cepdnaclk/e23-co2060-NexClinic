from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, HospitalAdminNotificationViewSet

router = DefaultRouter()
router.register(r'hospital', HospitalAdminNotificationViewSet, basename='hospital-announcement')
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
