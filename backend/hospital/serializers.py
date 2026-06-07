from rest_framework import serializers
from .models import ActivityLog, Hospital


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = (
            'id',
            'name',
            'address',
            'contact_numbers',
            'email',
            'is_active',
        )
        read_only_fields = fields

class ActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ('id','user_email','hospital_id','action','model_name','object_id','data','created_at')

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None
