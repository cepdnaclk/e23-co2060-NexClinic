import uuid

from django.db import IntegrityError, transaction
from django.db.utils import ProgrammingError

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from doctor.models import DoctorProfile
from patient.models import PatientProfile

from django.utils import timezone
from datetime import timedelta

from .serializers import (
	AdviceChatMessageCreateSerializer,
	AdviceChatMessageSerializer,
	AdviceChatThreadCreateSerializer,
	AdviceChatThreadSerializer,
	DoctorChatSlotSerializer,
	ChatCryptoKeysSerializer,
)

from .models import AdviceChatMessage, AdviceChatThread, DoctorChatSlot, ChatCryptoKeys


class BaseChatAPIView(APIView):
	permission_classes = [IsAuthenticated]

	@staticmethod
	def _get_role(user):
		return getattr(user, "role", None)

	def _get_doctor_profile_or_response(self, user):
		if self._get_role(user) != "DOCTOR":
			return None, Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

		try:
			doctor_profile = getattr(user, "doctor_profile", None)
		except ProgrammingError:
			return None, Response(
				{"detail": "Server database schema out of sync. Run migrations."},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)

		if not doctor_profile:
			return None, Response({"detail": "Doctor profile not found."}, status=status.HTTP_404_NOT_FOUND)

		return doctor_profile, None

	def _get_patient_profile_or_response(self, user):
		if self._get_role(user) != "PATIENT":
			return None, Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

		try:
			patient_profile = getattr(user, "patient_profile", None)
		except ProgrammingError:
			return None, Response(
				{"detail": "Server database schema out of sync. Run migrations."},
				status=status.HTTP_500_INTERNAL_SERVER_ERROR,
			)

		if not patient_profile:
			return None, Response({"detail": "Patient profile not found."}, status=status.HTTP_404_NOT_FOUND)

		return patient_profile, None

	def _get_thread_for_user_or_response(self, request, thread_id):
		role = self._get_role(request.user)
		if role == "DOCTOR":
			doctor_profile, error_response = self._get_doctor_profile_or_response(request.user)
			if error_response:
				return None, error_response
			thread_qs = AdviceChatThread.objects.select_related("doctor", "patient").filter(id=thread_id, doctor=doctor_profile)
		elif role == "PATIENT":
			patient_profile, error_response = self._get_patient_profile_or_response(request.user)
			if error_response:
				return None, error_response
			thread_qs = AdviceChatThread.objects.select_related("doctor", "patient").filter(id=thread_id, patient=patient_profile)
		else:
			return None, Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

		thread = thread_qs.first()
		if not thread:
			return None, Response({"detail": "Chat thread not found."}, status=status.HTTP_404_NOT_FOUND)

		return thread, None


class AdviceChatThreadListCreateView(BaseChatAPIView):
	def get(self, request):
		role = self._get_role(request.user)
		if role == "DOCTOR":
			doctor_profile, error_response = self._get_doctor_profile_or_response(request.user)
			if error_response:
				return error_response
			queryset = AdviceChatThread.objects.filter(doctor=doctor_profile).select_related("doctor", "patient")
		elif role == "PATIENT":
			patient_profile, error_response = self._get_patient_profile_or_response(request.user)
			if error_response:
				return error_response
			queryset = AdviceChatThread.objects.filter(patient=patient_profile).select_related("doctor", "patient")
		else:
			return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

		threads = queryset.order_by("-last_message_at", "-started_at")
		serializer = AdviceChatThreadSerializer(threads, many=True, context={"request": request})
		return Response({"threads": serializer.data}, status=status.HTTP_200_OK)

	def post(self, request):
		serializer = AdviceChatThreadCreateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		doctor_profile, error_response = self._get_doctor_profile_or_response(request.user)
		patient_profile, patient_error = self._get_patient_profile_or_response(request.user)

		chat_slot_id = serializer.validated_data["chat_slot_id"]
		if doctor_profile is None and patient_profile is None:
			return error_response or patient_error or Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

		try:
			chat_slot = DoctorChatSlot.objects.get(id=chat_slot_id, is_active=True)
			target_doctor = chat_slot.doctor
		except DoctorChatSlot.DoesNotExist:
			return Response({"detail": "Chat slot not found or inactive."}, status=status.HTTP_404_NOT_FOUND)

		if request.user.role == "PATIENT":
			active_patient = patient_profile
			if not active_patient:
				return patient_error

			existing_thread = AdviceChatThread.objects.filter(doctor=target_doctor, patient=active_patient).first()
			if not target_doctor.availability:
				if not existing_thread or existing_thread.status == AdviceChatThread.Status.CLOSED:
					return Response(
						{"detail": "This doctor is currently offline for chats."},
						status=status.HTTP_409_CONFLICT,
					)
		elif request.user.role == "DOCTOR":
			active_patient_id = request.data.get("patient_id")
			if not active_patient_id:
				return Response({"detail": "patient_id is required for doctor-initiated chats."}, status=status.HTTP_400_BAD_REQUEST)
			try:
				active_patient = PatientProfile.objects.select_related("user").get(id=active_patient_id)
			except PatientProfile.DoesNotExist:
				return Response({"detail": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)
		else:
			return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

		thread_code = f"CHAT{uuid.uuid4().hex[:12].upper()}"
		expires_at = timezone.now() + timedelta(minutes=chat_slot.duration_minutes)

		try:
			with transaction.atomic():
				# We allow reusing the same thread between doctor and patient, but we update the expiration and price.
				thread, created = AdviceChatThread.objects.get_or_create(
					doctor=target_doctor,
					patient=active_patient,
					defaults={
						"thread_code": thread_code,
						"expires_at": expires_at,
						"price_paid": chat_slot.price,
						"status": AdviceChatThread.Status.OPEN
					},
				)
				if not created:
					thread.expires_at = expires_at
					thread.price_paid = chat_slot.price
					thread.status = AdviceChatThread.Status.OPEN
					thread.save(update_fields=["expires_at", "price_paid", "status"])
		except IntegrityError:
			thread = AdviceChatThread.objects.get(doctor=target_doctor, patient=active_patient)
			thread.expires_at = expires_at
			thread.price_paid = chat_slot.price
			thread.status = AdviceChatThread.Status.OPEN
			thread.save(update_fields=["expires_at", "price_paid", "status"])

		output = AdviceChatThreadSerializer(thread, context={"request": request})
		return Response({"thread": output.data}, status=status.HTTP_200_OK)


class AdviceChatMessageCreateView(BaseChatAPIView):
	def get(self, request, thread_id):
		thread, error_response = self._get_thread_for_user_or_response(request, thread_id)
		if error_response:
			return error_response

		AdviceChatMessage.objects.filter(thread=thread, is_read=False).exclude(sender_user=request.user).update(is_read=True)

		messages = AdviceChatMessage.objects.filter(thread=thread).select_related("sender_user").order_by("sent_at", "id")
		output = AdviceChatMessageSerializer(messages, many=True)
		return Response({"messages": output.data}, status=status.HTTP_200_OK)

	def post(self, request, thread_id):
		thread, error_response = self._get_thread_for_user_or_response(request, thread_id)
		if error_response:
			return error_response

		serializer = AdviceChatMessageCreateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		message = AdviceChatMessage.objects.create(
			thread=thread,
			sender_user=request.user,
			sender_role=request.user.role,
			message_text=serializer.validated_data["message_text"],
			is_read=False,
		)
		thread.last_message_at = message.sent_at
		thread.save(update_fields=["last_message_at"])

		output = AdviceChatMessageSerializer(message)
		return Response({"message": output.data}, status=status.HTTP_201_CREATED)



class AdviceChatThreadStatusView(BaseChatAPIView):
	def patch(self, request, thread_id):
		thread, error_response = self._get_thread_for_user_or_response(request, thread_id)
		if error_response:
			return error_response

		action = str(request.data.get("action", "")).strip().lower()
		if action not in {"close", "reopen"}:
			return Response({"detail": "action must be close or reopen."}, status=status.HTTP_400_BAD_REQUEST)

		thread.status = AdviceChatThread.Status.CLOSED if action == "close" else AdviceChatThread.Status.OPEN
		thread.save(update_fields=["status"])

		output = AdviceChatThreadSerializer(thread, context={"request": request})
		return Response({"thread": output.data}, status=status.HTTP_200_OK)

class DoctorChatSlotListView(BaseChatAPIView):
	def get(self, request, doctor_id):
		slots = DoctorChatSlot.objects.filter(doctor_id=doctor_id, is_active=True)
		serializer = DoctorChatSlotSerializer(slots, many=True)
		return Response({"slots": serializer.data}, status=status.HTTP_200_OK)

from rest_framework.parsers import MultiPartParser, FormParser

class AdviceChatMessageUploadView(BaseChatAPIView):
	parser_classes = (MultiPartParser, FormParser)

	def post(self, request, thread_id):
		thread, error_response = self._get_thread_for_user_or_response(request, thread_id)
		if error_response:
			return error_response

		# Check expiration
		if thread.status == AdviceChatThread.Status.CLOSED or (thread.expires_at and timezone.now() > thread.expires_at):
			if thread.status != AdviceChatThread.Status.CLOSED:
				thread.status = AdviceChatThread.Status.CLOSED
				thread.save(update_fields=["status"])
			return Response({"detail": "Chat is closed or expired."}, status=status.HTTP_403_FORBIDDEN)

		file_obj = request.FILES.get('attachment')
		if not file_obj:
			return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

		message_text = request.data.get('message_text', '')

		message = AdviceChatMessage.objects.create(
			thread=thread,
			sender_user=request.user,
			sender_role=request.user.role,
			message_text=message_text,
			attachment=file_obj,
			is_read=False,
		)
		thread.last_message_at = message.sent_at
		thread.save(update_fields=["last_message_at"])

		output = AdviceChatMessageSerializer(message)
		return Response({"message": output.data}, status=status.HTTP_201_CREATED)

class ChatCryptoKeysView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			keys = request.user.chat_crypto_keys
			serializer = ChatCryptoKeysSerializer(keys)
			return Response(serializer.data, status=status.HTTP_200_OK)
		except Exception:
			return Response({"detail": "Crypto keys not found."}, status=status.HTTP_404_NOT_FOUND)

	def post(self, request):
		try:
			keys = request.user.chat_crypto_keys
			serializer = ChatCryptoKeysSerializer(keys, data=request.data)
		except Exception:
			serializer = ChatCryptoKeysSerializer(data=request.data)
		
		if serializer.is_valid():
			serializer.save(user=request.user)
			return Response(serializer.data, status=status.HTTP_200_OK)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
