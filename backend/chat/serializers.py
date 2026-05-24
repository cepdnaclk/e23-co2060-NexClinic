from rest_framework import serializers

from .models import AdviceChatMessage, AdviceChatThread


class AdviceChatThreadSerializer(serializers.ModelSerializer):
	doctorName = serializers.SerializerMethodField()
	patientName = serializers.SerializerMethodField()
	unreadCount = serializers.SerializerMethodField()
	lastMessage = serializers.SerializerMethodField()

	class Meta:
		model = AdviceChatThread
		fields = [
			"id",
			"thread_code",
			"status",
			"started_at",
			"last_message_at",
			"doctorName",
			"patientName",
			"unreadCount",
			"lastMessage",
		]

	def get_doctorName(self, obj):
		return obj.doctor.preferred_name or obj.doctor.full_name or "Doctor"

	def get_patientName(self, obj):
		return obj.patient.full_name or "Patient"

	def get_unreadCount(self, obj):
		request = self.context.get("request")
		if not request or not getattr(request, "user", None):
			return 0

		return obj.messages.exclude(sender_user=request.user).filter(is_read=False).count()

	def get_lastMessage(self, obj):
		last_message = obj.messages.order_by("-sent_at", "-id").first()
		if not last_message:
			return ""
		return last_message.message_text


class AdviceChatThreadCreateSerializer(serializers.Serializer):
	doctor_id = serializers.IntegerField()

	def validate_doctor_id(self, value):
		if value <= 0:
			raise serializers.ValidationError("doctor_id must be a positive integer.")
		return value


class AdviceChatMessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = AdviceChatMessage
		fields = [
			"id",
			"thread",
			"sender_user",
			"sender_role",
			"message_text",
			"is_read",
			"sent_at",
		]
		read_only_fields = ["id", "thread", "sender_user", "sender_role", "is_read", "sent_at"]


class AdviceChatMessageCreateSerializer(serializers.Serializer):
	message_text = serializers.CharField()

	def validate_message_text(self, value):
		cleaned = value.strip()
		if not cleaned:
			raise serializers.ValidationError("message_text cannot be empty.")
		if len(cleaned) > 4000:
			raise serializers.ValidationError("message_text is too long.")
		return cleaned
