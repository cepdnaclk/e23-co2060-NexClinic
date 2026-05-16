from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import ActivityLog, HospitalAdmin
from .serializers import ActivityLogSerializer
from doctor.models import Appointment, AppointmentAvailableSlot
from django.db.models import F
from django.utils import timezone
from datetime import timedelta


class ActivityLogListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		hospital_id = request.query_params.get('hospital_id')
		if not hospital_id:
			return Response({'detail': 'hospital_id required'}, status=status.HTTP_400_BAD_REQUEST)

		# Ensure user is admin for hospital
		if not HospitalAdmin.objects.filter(user=request.user, hospital_id=hospital_id, is_active=True).exists():
			return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

		logs = ActivityLog.objects.filter(hospital_id=hospital_id).order_by('-created_at')[:500]
		serializer = ActivityLogSerializer(logs, many=True)
		return Response(serializer.data)


class ReportsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		hospital_id = request.query_params.get('hospital_id')
		if not hospital_id:
			return Response({'detail': 'hospital_id required'}, status=status.HTTP_400_BAD_REQUEST)

		if not HospitalAdmin.objects.filter(user=request.user, hospital_id=hospital_id, is_active=True).exists():
			return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

		# Basic stats
		total_appointments = Appointment.objects.filter(hospital_id=hospital_id).count()
		booked_last_30 = Appointment.objects.filter(hospital_id=hospital_id, requested_at__gte=timezone.now() - timedelta(days=30)).count()
		slots = AppointmentAvailableSlot.objects.filter(hospital_id=hospital_id)
		total_slots = slots.count()
		filled_slots = slots.filter(booked_count__gte=F('patient_limit')).count()

		data = {
			'total_appointments': total_appointments,
			'booked_last_30_days': booked_last_30,
			'total_slots': total_slots,
			'filled_slots': filled_slots,
		}
		return Response(data)
