from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from doctor.models import Appointment, AppointmentAvailableSlot
from .serializers import (
	PatientAppointmentSerializer,
	PatientAppointmentCreateSerializer,
	PatientAvailableSlotSerializer,
	is_slot_in_past,
)


class BasePatientAPIView(APIView):
	permission_classes = [IsAuthenticated]

	@staticmethod
	def _is_patient(user):
		return getattr(user, "role", None) == "PATIENT"

	def _get_patient_profile_or_response(self, request):
		if not self._is_patient(request.user):
			return None, Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

		patient_profile = getattr(request.user, "patient_profile", None)
		if not patient_profile:
			return None, Response({"detail": "Patient profile not found."}, status=status.HTTP_404_NOT_FOUND)

		return patient_profile, None


class PatientProfileView(BasePatientAPIView):

	def get(self, request):
		user = request.user

		if not self._is_patient(user):
			return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

		patient_profile = getattr(user, "patient_profile", None)

		full_name = user.email
		date_of_birth = ""
		gender = ""
		phone = ""
		address = ""
		medical_history = ""

		if patient_profile:
			full_name = patient_profile.full_name or user.email
			date_of_birth = (
				patient_profile.date_of_birth.isoformat()
				if patient_profile.date_of_birth
				else ""
			)
			gender = patient_profile.gender or ""
			phone = patient_profile.phone or ""
			address = patient_profile.address or ""
			medical_history = patient_profile.medical_history or ""

		data = {
			"patient": {
				"fullName": full_name,
				"email": user.email,
				"phone": phone,
				"dateOfBirth": date_of_birth,
				"gender": gender,
				"address": address,
				"city": "",
				"profileImage": "",
			},
			"health": {
				"bloodType": "",
				"allergies": "",
				"medications": "",
				"medicalHistory": medical_history,
			},
			"emergencyContact": {
				"name": "",
				"phone": "",
				"relation": "",
			},
			"insurance": {
				"provider": "",
				"policyNumber": "",
			},
		}

		return Response(data)


class PatientAvailableAppointmentSlotsView(BasePatientAPIView):
	def get(self, request):
		patient_profile, error_response = self._get_patient_profile_or_response(request)
		if error_response:
			return error_response

		today = timezone.localdate()
		slots = AppointmentAvailableSlot.objects.filter(
			date__gte=today,
		).select_related('doctor', 'doctor__user').order_by('date', 'start_time')

		doctor_id = request.query_params.get('doctor_id')
		if doctor_id:
			try:
				slots = slots.filter(doctor_id=int(doctor_id))
			except ValueError:
				return Response({'detail': 'Invalid doctor_id.'}, status=status.HTTP_400_BAD_REQUEST)

		date_param = request.query_params.get('date')
		if date_param:
			try:
				selected_date = timezone.datetime.strptime(date_param, '%Y-%m-%d').date()
			except ValueError:
				return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)
			slots = slots.filter(date=selected_date)

		data = PatientAvailableSlotSerializer(slots, many=True).data
		return Response({'slots': data}, status=status.HTTP_200_OK)


class PatientAppointmentsView(BasePatientAPIView):
	def get(self, request):
		patient_profile, error_response = self._get_patient_profile_or_response(request)
		if error_response:
			return error_response

		queryset = Appointment.objects.filter(patient=patient_profile).select_related(
			'slot', 'doctor', 'doctor__user'
		).order_by('-requested_at')

		status_filter = request.query_params.get('status')
		if status_filter:
			normalized = status_filter.strip().upper()
			valid_statuses = {choice[0] for choice in Appointment.Status.choices}
			if normalized not in valid_statuses:
				return Response({'detail': 'Invalid status filter.'}, status=status.HTTP_400_BAD_REQUEST)
			queryset = queryset.filter(status=normalized)

		data = PatientAppointmentSerializer(queryset, many=True).data
		return Response({'appointments': data}, status=status.HTTP_200_OK)

	def post(self, request):
		patient_profile, error_response = self._get_patient_profile_or_response(request)
		if error_response:
			return error_response

		serializer = PatientAppointmentCreateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		slot_id = serializer.validated_data['slot_id']
		reason = serializer.validated_data.get('reason', '')

		slot = AppointmentAvailableSlot.objects.filter(id=slot_id).select_related('doctor').first()
		if not slot:
			return Response({'detail': 'Appointment slot not found.'}, status=status.HTTP_404_NOT_FOUND)

		if is_slot_in_past(slot):
			return Response({'detail': 'Cannot book an appointment in the past.'}, status=status.HTTP_400_BAD_REQUEST)

		with transaction.atomic():
			appointment = Appointment.objects.create(
				slot=slot,
				doctor=slot.doctor,
				patient=patient_profile,
				reason=reason,
				status=Appointment.Status.PENDING,
			)

		payload = PatientAppointmentSerializer(appointment).data
		return Response(
			{'message': 'Appointment booked successfully.', 'appointment': payload},
			status=status.HTTP_201_CREATED,
		)


class PatientAppointmentCancelView(BasePatientAPIView):
	def patch(self, request, appointment_id):
		patient_profile, error_response = self._get_patient_profile_or_response(request)
		if error_response:
			return error_response

		appointment = Appointment.objects.filter(
			id=appointment_id,
			patient=patient_profile,
		).select_related('slot', 'doctor', 'doctor__user').first()

		if not appointment:
			return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

		if appointment.status not in {Appointment.Status.PENDING, Appointment.Status.ACCEPTED}:
			return Response(
				{'detail': f'Cannot cancel an appointment in {appointment.status} state.'},
				status=status.HTTP_400_BAD_REQUEST,
			)

		appointment.status = Appointment.Status.CANCELLED
		appointment.save(update_fields=['status', 'updated_at'])

		payload = PatientAppointmentSerializer(appointment).data
		return Response({'message': 'Appointment cancelled successfully.', 'appointment': payload}, status=status.HTTP_200_OK)
