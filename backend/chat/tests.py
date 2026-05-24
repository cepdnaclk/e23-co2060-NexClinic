from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from doctor.models import DoctorProfile
from patient.models import PatientProfile
from chat.models import AdviceChatMessage, AdviceChatThread
from users.models import CustomUser


class AdviceChatThreadApiTests(TestCase):
	def setUp(self):
		self.client = APIClient()

		self.doctor_user = CustomUser.objects.create_user(
			email="chat-doctor@example.com",
			password="pass",
			role=CustomUser.Role.DOCTOR,
		)
		self.doctor_profile = DoctorProfile.objects.create(
			user=self.doctor_user,
			specialization="Cardiology",
			license_number="SLMC/7777",
			phone="0712345678",
			full_name="Chat Doctor",
			preferred_name="Dr. Chat",
			availability=True,
		)

		self.patient_user = CustomUser.objects.create_user(
			email="chat-patient@example.com",
			password="pass",
			role=CustomUser.Role.PATIENT,
		)
		self.patient_profile = PatientProfile.objects.create(
			user=self.patient_user,
			full_name="Chat Patient",
			date_of_birth=timezone.localdate() - timedelta(days=365 * 30),
			gender="Other",
			phone="0712345679",
			address="12 Test Lane",
		)

	def test_patient_can_open_and_list_chat_thread(self):
		self.client.force_authenticate(user=self.patient_user)

		create_response = self.client.post(
			"/api/chat/threads/",
			{"doctor_id": self.doctor_profile.id},
			format="json",
		)

		self.assertEqual(create_response.status_code, status.HTTP_200_OK)
		thread_payload = create_response.json()["thread"]
		self.assertEqual(thread_payload["doctorName"], "Dr. Chat")
		self.assertEqual(thread_payload["patientName"], "Chat Patient")
		self.assertEqual(thread_payload["unreadCount"], 0)
		self.assertEqual(thread_payload["lastMessage"], "")

		list_response = self.client.get("/api/chat/threads/")
		self.assertEqual(list_response.status_code, status.HTTP_200_OK)
		threads = list_response.json()["threads"]
		self.assertEqual(len(threads), 1)
		self.assertEqual(threads[0]["id"], thread_payload["id"])
		self.assertEqual(threads[0]["thread_code"], thread_payload["thread_code"])

	def test_patient_opening_same_thread_reuses_existing_thread(self):
		self.client.force_authenticate(user=self.patient_user)

		first_response = self.client.post(
			"/api/chat/threads/",
			{"doctor_id": self.doctor_profile.id},
			format="json",
		)
		second_response = self.client.post(
			"/api/chat/threads/",
			{"doctor_id": self.doctor_profile.id},
			format="json",
		)

		self.assertEqual(first_response.status_code, status.HTTP_200_OK)
		self.assertEqual(second_response.status_code, status.HTTP_200_OK)
		self.assertEqual(first_response.json()["thread"]["id"], second_response.json()["thread"]["id"])
		self.assertEqual(first_response.json()["thread"]["thread_code"], second_response.json()["thread"]["thread_code"])

	def test_patient_cannot_open_chat_when_doctor_is_offline(self):
		offline_doctor_user = CustomUser.objects.create_user(
			email="offline-doctor@example.com",
			password="pass",
			role=CustomUser.Role.DOCTOR,
		)
		offline_doctor = DoctorProfile.objects.create(
			user=offline_doctor_user,
			specialization="Dermatology",
			license_number="SLMC/8888",
			phone="0712345680",
			full_name="Offline Doctor",
			preferred_name="Dr. Offline",
			availability=False,
		)

		self.client.force_authenticate(user=self.patient_user)

		response = self.client.post(
			"/api/chat/threads/",
			{"doctor_id": offline_doctor.id},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
		self.assertEqual(response.json()["detail"], "This doctor is currently offline for chats.")

	def test_patient_can_send_message_in_their_thread(self):
		self.client.force_authenticate(user=self.patient_user)

		create_response = self.client.post(
			"/api/chat/threads/",
			{"doctor_id": self.doctor_profile.id},
			format="json",
		)
		thread_id = create_response.json()["thread"]["id"]

		message_response = self.client.post(
			f"/api/chat/threads/{thread_id}/messages/",
			{"message_text": "Hello doctor, I need advice."},
			format="json",
		)

		self.assertEqual(message_response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(message_response.json()["message"]["message_text"], "Hello doctor, I need advice.")
		self.assertEqual(message_response.json()["message"]["sender_role"], "PATIENT")

		thread = AdviceChatThread.objects.get(id=thread_id)
		self.assertIsNotNone(thread.last_message_at)
		self.assertEqual(AdviceChatMessage.objects.filter(thread=thread).count(), 1)

	def test_patient_can_load_message_history_and_mark_doctor_messages_read(self):
		self.client.force_authenticate(user=self.patient_user)

		create_response = self.client.post(
			"/api/chat/threads/",
			{"doctor_id": self.doctor_profile.id},
			format="json",
		)
		thread_id = create_response.json()["thread"]["id"]

		thread = AdviceChatThread.objects.get(id=thread_id)
		AdviceChatMessage.objects.create(
			thread=thread,
			sender_user=self.doctor_user,
			sender_role="DOCTOR",
			message_text="Please describe your symptoms.",
			is_read=False,
		)
		AdviceChatMessage.objects.create(
			thread=thread,
			sender_user=self.patient_user,
			sender_role="PATIENT",
			message_text="I have a headache.",
			is_read=False,
		)

		response = self.client.get(f"/api/chat/threads/{thread_id}/messages/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.json()["messages"]), 2)
		self.assertEqual(response.json()["messages"][0]["message_text"], "Please describe your symptoms.")
		self.assertEqual(response.json()["messages"][1]["message_text"], "I have a headache.")

		doctor_message = AdviceChatMessage.objects.get(thread=thread, sender_user=self.doctor_user)
		patient_message = AdviceChatMessage.objects.get(thread=thread, sender_user=self.patient_user)
		self.assertTrue(doctor_message.is_read)
		self.assertFalse(patient_message.is_read)

	def test_patient_can_close_and_reopen_thread(self):
		self.client.force_authenticate(user=self.patient_user)

		create_response = self.client.post(
			"/api/chat/threads/",
			{"doctor_id": self.doctor_profile.id},
			format="json",
		)
		thread_id = create_response.json()["thread"]["id"]

		close_response = self.client.patch(
			f"/api/chat/threads/{thread_id}/status/",
			{"action": "close"},
			format="json",
		)
		self.assertEqual(close_response.status_code, status.HTTP_200_OK)
		self.assertEqual(close_response.json()["thread"]["status"], "CLOSED")

		reopen_response = self.client.patch(
			f"/api/chat/threads/{thread_id}/status/",
			{"action": "reopen"},
			format="json",
		)
		self.assertEqual(reopen_response.status_code, status.HTTP_200_OK)
		self.assertEqual(reopen_response.json()["thread"]["status"], "OPEN")
