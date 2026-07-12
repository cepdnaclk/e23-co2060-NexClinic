from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from .models import ActivityLog, Hospital, HospitalAdmin, HospitalAdminProfile
from .serializers import ActivityLogSerializer, HospitalSerializer, HospitalAdminProfileSerializer
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
    

class HospitalAdminProfileView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		profile = HospitalAdminProfile.objects.select_related('user').filter(user=request.user).first()
		if not profile:
			return Response({'detail': 'Hospital admin profile not found.'}, status=status.HTTP_404_NOT_FOUND)

		serializer = HospitalAdminProfileSerializer(profile)
		return Response(serializer.data)


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

class ManageHospitalDoctorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        admin_role = HospitalAdmin.objects.filter(user=request.user, is_active=True).select_related("hospital").first()
        if not admin_role:
            return Response({"detail": "You are not a hospital admin."}, status=status.HTTP_403_FORBIDDEN)
        hospital = admin_role.hospital

        doctor_id = request.data.get("doctor_id")
        action = request.data.get("action")

        if not doctor_id or action not in ["add", "remove"]:
            return Response({"detail": "Invalid doctor_id or action. Action must be 'add' or 'remove'."}, status=status.HTTP_400_BAD_REQUEST)

        doctor = get_object_or_404(DoctorProfile, id=doctor_id)

        if action == "add":
            verification, created = DoctorHospitalVerification.objects.get_or_create(
                doctor=doctor,
                hospital=hospital,
                defaults={
                    "status": DoctorHospitalVerification.Status.VERIFIED,
                    "verified_by": request.user,
                    "verified_at": timezone.now()
                }
            )
            if not created and verification.status != DoctorHospitalVerification.Status.VERIFIED:
                verification.status = DoctorHospitalVerification.Status.VERIFIED
                verification.verified_by = request.user
                verification.verified_at = timezone.now()
                verification.save()
            
            doctor.verified_hospitals.add(hospital)
            return Response({"detail": "Doctor added successfully."}, status=status.HTTP_200_OK)

        elif action == "remove":
            verification = DoctorHospitalVerification.objects.filter(doctor=doctor, hospital=hospital).first()
            verification_id_str = str(verification.id) if verification else ""

            DoctorHospitalVerification.objects.filter(doctor=doctor, hospital=hospital).delete()
            doctor.verified_hospitals.remove(hospital)

            ActivityLog.objects.create(
                user=request.user,
                hospital=hospital,
                action="doctor_delinked_by_admin",
                model_name="DoctorProfile",
                object_id=str(doctor.id),
                data={"doctor_email": doctor.user.email, "verification_id": verification_id_str},
                created_at=timezone.now()
            )
            return Response({"detail": "Doctor removed successfully."}, status=status.HTTP_200_OK)


class CreateHospitalDoctorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        admin_role = HospitalAdmin.objects.filter(user=request.user, is_active=True).select_related("hospital").first()
        if not admin_role:
            return Response({"detail": "You are not a hospital admin."}, status=status.HTTP_403_FORBIDDEN)
        hospital = admin_role.hospital

        from .serializers import HospitalAdminCreateDoctorSerializer
        from django.db import transaction
        from django.contrib.auth import get_user_model

        User = get_user_model()

        serializer = HospitalAdminCreateDoctorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        email = data['email']
        password = data['password']

        with transaction.atomic():
            # Create user
            user = User.objects.create_user(
                email=email,
                password=password,
                role='DOCTOR'
            )
            user.is_active = True
            user.save()

            # Create profile
            doctor_profile = DoctorProfile.objects.create(
                user=user,
                specialization=data['specialization'],
                license_number=data['license_number'],
                phone=data['phone'],
                full_name=data['full_name'],
                preferred_name=data['preferred_name'],
                nic_number=data['nic_number'],
                gender=data.get('gender', 'Other'),
                is_verified=True  # System verified automatically when created by hospital admin
            )

            # Link/Verify for this hospital
            verification = DoctorHospitalVerification.objects.create(
                doctor=doctor_profile,
                hospital=hospital,
                status=DoctorHospitalVerification.Status.VERIFIED,
                verified_by=request.user,
                verified_at=timezone.now()
            )
            doctor_profile.verified_hospitals.add(hospital)

            # Create an ActivityLog entry for audit
            ActivityLog.objects.create(
                user=request.user,
                hospital=hospital,
                action='doctor_created_by_admin',
                model_name='DoctorProfile',
                object_id=str(doctor_profile.id),
                data={'doctor_email': email},
                created_at=timezone.now()
            )

        return Response({
            "detail": "Doctor account created successfully.",
            "doctor": {
                "id": doctor_profile.id,
                "full_name": doctor_profile.full_name,
                "email": user.email,
                "is_added": True
            }
        }, status=status.HTTP_201_CREATED)

