from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import ActivityLog, Hospital, HospitalAdmin
from .serializers import ActivityLogSerializer, HospitalSerializer
from doctor.models import Appointment, AppointmentAvailableSlot
from django.db.models import F
from django.utils import timezone
from datetime import timedelta


from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from doctor.models import DoctorProfile
from hospital.models import HospitalAdmin, DoctorHospitalVerification

class AvailableDoctorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get the hospital admin role for the current user
        admin_role = HospitalAdmin.objects.filter(user=request.user, is_active=True).select_related("hospital").first()
        if not admin_role:
            return Response({"detail": "You are not a hospital admin."}, status=403)
        hospital = admin_role.hospital

        # Get all verified doctors in the system
        all_doctors = DoctorProfile.objects.select_related("user").filter(user__is_active=True, is_verified=True)

        # Get all doctors already verified for this hospital
        verified_doctor_ids = set(
            DoctorHospitalVerification.objects.filter(
                hospital=hospital,
                status=DoctorHospitalVerification.Status.VERIFIED
            ).values_list("doctor_id", flat=True)
        )

        doctors = [
            {
                "id": doc.id,
                "full_name": doc.full_name,
                "email": doc.user.email,
                "is_added": doc.id in verified_doctor_ids,
            }
            for doc in all_doctors
        ]
        return Response({"doctors": doctors})
    

class ActiveHospitalListView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		hospitals = (
			Hospital.objects.filter(is_active=True)
			.order_by('name')
		)
		serializer = HospitalSerializer(hospitals, many=True)
		return Response(serializer.data)


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
