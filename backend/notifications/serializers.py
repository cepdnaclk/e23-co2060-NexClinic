from rest_framework import serializers
from .models import Notification, Announcement

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'sender', 'recipient', 'notification_type', 'title', 
            'message', 'attachment', 'is_read', 'action_url', 
            'metadata', 'created_at'
        ]
        read_only_fields = fields

class NotificationSendSerializer(serializers.Serializer):
    recipient_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of User IDs to send the notification to. If 'send_to_all' is True, this is ignored."
    )
    send_to_all = serializers.BooleanField(default=False, help_text="If true, sends to all verified doctors in the hospital.")
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    attachment = serializers.FileField(required=False, allow_null=True)
    
    def validate(self, attrs):
        if not attrs.get('send_to_all') and not attrs.get('recipient_ids'):
            raise serializers.ValidationError("Either 'recipient_ids' or 'send_to_all' must be provided.")
        return attrs

class AnnouncementSerializer(serializers.ModelSerializer):
    read_count = serializers.SerializerMethodField()
    total_count = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'message', 'attachment', 'target_specialization', 
            'is_draft', 'created_at', 'read_count', 'total_count'
        ]
        
    def get_read_count(self, obj):
        return obj.notifications.filter(is_read=True).count()
        
    def get_total_count(self, obj):
        return obj.notifications.count()
