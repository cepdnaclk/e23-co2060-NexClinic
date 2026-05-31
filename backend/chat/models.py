from django.conf import settings
from django.db import models

from doctor.models import DoctorProfile
from patient.models import PatientProfile


class AdviceChatThread(models.Model):
	class Status(models.TextChoices):
		OPEN = "OPEN", "Open"
		CLOSED = "CLOSED", "Closed"

	thread_code = models.CharField(max_length=20, unique=True)
	doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name="chat_threads")
	patient = models.ForeignKey(PatientProfile, on_delete=models.CASCADE, related_name="chat_threads")
	status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
	started_at = models.DateTimeField(auto_now_add=True)
	last_message_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["doctor", "patient"],
				name="unique_advice_chat_thread_participants",
			)
		]
		indexes = [
			models.Index(fields=["doctor", "status"]),
			models.Index(fields=["patient", "status"]),
			models.Index(fields=["last_message_at"]),
		]

	def __str__(self):
		doctor_name = self.doctor.preferred_name or self.doctor.full_name or "Doctor"
		patient_name = self.patient.full_name or "Patient"
		return f"{doctor_name} - {patient_name}"


class AdviceChatMessage(models.Model):
	class SenderRole(models.TextChoices):
		DOCTOR = "DOCTOR", "Doctor"
		PATIENT = "PATIENT", "Patient"

	thread = models.ForeignKey(AdviceChatThread, on_delete=models.CASCADE, related_name="messages")
	sender_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_chat_messages")
	sender_role = models.CharField(max_length=20, choices=SenderRole.choices)
	message_text = models.TextField()
	is_read = models.BooleanField(default=False)
	sent_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["sent_at", "id"]
		indexes = [
			models.Index(fields=["thread", "sent_at"]),
			models.Index(fields=["sender_user", "sent_at"]),
			models.Index(fields=["is_read", "sent_at"]),
		]

	def __str__(self):
		return f"{self.sender_role} @ {self.sent_at:%Y-%m-%d %H:%M}"
