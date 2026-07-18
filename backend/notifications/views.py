from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, Announcement
from .serializers import NotificationSerializer, NotificationSendSerializer, AnnouncementSerializer
from django.db.models import Q
from doctor.models import DoctorProfile
from users.models import CustomUser
from hospital.models import HospitalAdminProfile

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        notif_type = self.request.query_params.get('type')
        if notif_type:
            qs = qs.filter(notification_type=notif_type)
        return qs

    @action(detail=False, methods=['get', 'patch'])
    def preferences(self, request):
        user = request.user
        if request.method == 'GET':
            return Response({'dnd_enabled': user.dnd_enabled})
        elif request.method == 'PATCH':
            dnd_enabled = request.data.get('dnd_enabled')
            if dnd_enabled is not None:
                user.dnd_enabled = bool(dnd_enabled)
                user.save(update_fields=['dnd_enabled'])
            return Response({'dnd_enabled': user.dnd_enabled})

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        updated_count = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'updated_count': updated_count}, status=status.HTTP_200_OK)


class HospitalAdminNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated] # Should be IsHospitalAdmin but we can check inside

    def get_queryset(self):
        if not hasattr(self.request.user, 'role') or self.request.user.role != 'HOSPITAL_ADMIN':
            return Announcement.objects.none()
        try:
            hospital = self.request.user.hospital_app_admin_roles.first().hospital
            return Announcement.objects.filter(hospital=hospital)
        except Exception:
            return Announcement.objects.none()

    @action(detail=False, methods=['post'])
    def send_announcement(self, request):
        if not hasattr(request.user, 'role') or request.user.role != 'HOSPITAL_ADMIN':
            return Response({"detail": "Only hospital admins can send announcements."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # The user might be linked to multiple hospitals, but we'll use the first active admin role
            hospital_admin_role = request.user.hospital_app_admin_roles.filter(is_active=True).first()
            if not hospital_admin_role:
                return Response({"detail": "No active hospital admin role found."}, status=status.HTTP_403_FORBIDDEN)
            hospital = hospital_admin_role.hospital
        except Exception as e:
            return Response({"detail": "Error determining hospital affiliation."}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = NotificationSendSerializer(data=request.data)
        if serializer.is_valid():
            title = serializer.validated_data['title']
            message = serializer.validated_data['message']
            attachment = serializer.validated_data.get('attachment')
            send_to_all = serializer.validated_data.get('send_to_all')
            recipient_ids = serializer.validated_data.get('recipient_ids', [])
            
            # Find recipients
            if send_to_all:
                # Find all doctors verified at the admin's hospital
                verifications = hospital.doctor_verifications.filter(status="VERIFIED")
                doctors = [v.doctor for v in verifications]
                users = CustomUser.objects.filter(doctor_profile__in=doctors)
            else:
                users = CustomUser.objects.filter(id__in=recipient_ids, role='DOCTOR')
                
            if not users.exists():
                return Response({"detail": "No valid recipients found."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the central Announcement
            announcement = Announcement.objects.create(
                hospital=hospital,
                sender=request.user,
                title=title,
                message=message,
                attachment=attachment,
                is_draft=False
            )
            
            notifications = []
            for user in users:
                notifications.append(
                    Notification(
                        recipient=user,
                        sender=request.user,
                        announcement=announcement,
                        notification_type=Notification.NotificationType.HOSPITAL_ANNOUNCEMENT,
                        title=title,
                        message=message,
                        attachment=attachment
                    )
                )
            
            Notification.objects.bulk_create(notifications)
            
            # Return the created announcement using the serializer
            return Response(AnnouncementSerializer(announcement, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
