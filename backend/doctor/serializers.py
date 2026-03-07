from rest_framework import serializers

from .models import AppointmentAvailableSlot, DoctorOnlineAdviceAvailability


VALID_WEEK_DAYS = {
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday',
}


class AppointmentAvailableSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentAvailableSlot
        fields = ['id', 'date', 'day_of_week', 'start_time', 'end_time']


class AppointmentSlotInputSerializer(serializers.Serializer):
    date = serializers.DateField()
    start_time = serializers.TimeField(input_formats=['%H:%M', '%H:%M:%S'])
    end_time = serializers.TimeField(input_formats=['%H:%M', '%H:%M:%S'])

    def validate(self, attrs):
        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError('start_time must be before end_time.')

        attrs['day_of_week'] = attrs['date'].strftime('%A')
        return attrs


class BulkAppointmentSlotCreateSerializer(serializers.Serializer):
    slots = AppointmentSlotInputSerializer(many=True, allow_empty=False)


class AppointmentSlotUpdateSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    start_time = serializers.TimeField(required=False, input_formats=['%H:%M', '%H:%M:%S'])
    end_time = serializers.TimeField(required=False, input_formats=['%H:%M', '%H:%M:%S'])

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('At least one field must be provided for update.')
        return attrs


class OnlineAdviceAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorOnlineAdviceAvailability
        fields = ['id', 'day_of_week', 'start_time', 'end_time']


class OnlineAdviceSlotInputSerializer(serializers.Serializer):
    day_of_week = serializers.CharField(max_length=12)
    start_time = serializers.TimeField(input_formats=['%H:%M', '%H:%M:%S'])
    end_time = serializers.TimeField(input_formats=['%H:%M', '%H:%M:%S'])

    def validate(self, attrs):
        day_key = attrs['day_of_week'].strip().lower()
        if day_key not in VALID_WEEK_DAYS:
            raise serializers.ValidationError('day_of_week must be a valid weekday name.')

        if attrs['start_time'] >= attrs['end_time']:
            raise serializers.ValidationError('start_time must be before end_time.')

        attrs['day_of_week'] = VALID_WEEK_DAYS[day_key]
        return attrs


class BulkOnlineAdviceSlotCreateSerializer(serializers.Serializer):
    slots = OnlineAdviceSlotInputSerializer(many=True, allow_empty=False)


class OnlineAdviceSlotUpdateSerializer(serializers.Serializer):
    day_of_week = serializers.CharField(max_length=12, required=False)
    start_time = serializers.TimeField(required=False, input_formats=['%H:%M', '%H:%M:%S'])
    end_time = serializers.TimeField(required=False, input_formats=['%H:%M', '%H:%M:%S'])

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError('At least one field must be provided for update.')

        if 'day_of_week' in attrs:
            day_key = attrs['day_of_week'].strip().lower()
            if day_key not in VALID_WEEK_DAYS:
                raise serializers.ValidationError('day_of_week must be a valid weekday name.')
            attrs['day_of_week'] = VALID_WEEK_DAYS[day_key]

        return attrs
