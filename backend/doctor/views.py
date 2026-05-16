from collections import defaultdict
from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .constants import DOCTOR_SPECIALIZATIONS
from doctor.models import AppointmentAvailableSlot, DoctorOnlineAdviceAvailability, Appointment, DoctorProfile
from hospital.models import Hospital, HospitalAdmin, DoctorHospitalVerification, SlotTemplate
from users.models import CustomUser
from .serializers import (
    AppointmentAvailableSlotSerializer,
    BulkAppointmentSlotCreateSerializer,
    AppointmentSlotUpdateSerializer,
    DoctorAppointmentSerializer,
    DoctorAppointmentActionSerializer,
    DoctorAppointmentRescheduleSerializer,
    DoctorPatientProfileSerializer,
    OnlineAdviceAvailabilitySerializer,
    BulkOnlineAdviceSlotCreateSerializer,
    OnlineAdviceSlotUpdateSerializer,
    DoctorDirectoryPublicSerializer,
    DoctorDirectoryDetailSerializer,
    AdminAppointmentCancelSerializer,
    HospitalSerializer,
    HospitalAdminSerializer,
    DoctorHospitalVerificationSerializer,
    SlotTemplateSerializer,
)

class VerifiedDoctorAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _is_doctor(user):
        return getattr(user, "role", None) == "DOCTOR"

    def _get_verified_doctor_profile_or_response(self, user):
        if not self._is_doctor(user):
            return None, Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        doctor_profile = getattr(user, "doctor_profile", None)
        if not doctor_profile:
            return None, Response({"detail": "Doctor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        if not doctor_profile.is_verified:
            return None, Response(
                {"detail": "Your account is pending admin verification."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return doctor_profile, None


class HospitalAdminAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _is_admin(user):
        return getattr(user, "role", None) == "ADMIN"

    def _get_admin_role(self, user, hospital_id=None):
        if not self._is_admin(user):
            return None, Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        queryset = HospitalAdmin.objects.filter(user=user, is_active=True).select_related("hospital")

        if hospital_id is not None:
            queryset = queryset.filter(hospital_id=hospital_id)

        admin_role = queryset.first()
        if not admin_role:
            return None, Response({"detail": "Hospital admin not found."}, status=status.HTTP_404_NOT_FOUND)

        return admin_role, None

class AdminHospitalListView(HospitalAdminAPIView):
    def get(self, request):
        if not self._is_admin(request.user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        hospitals = (
            HospitalAdmin.objects.filter(user=request.user, is_active=True)
            .select_related("hospital")
            .order_by("hospital__name")
        )
        serializer = HospitalAdminSerializer(hospitals, many=True)
        return Response({"hospitals": serializer.data}, status=status.HTTP_200_OK)
    

class AdminDoctorVerificationListView(HospitalAdminAPIView):
    def get(self, request):
        hospital_id = request.query_params.get("hospital_id")
        if not hospital_id:
            return Response({"detail": "hospital_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=hospital_id)
        if error_response:
            return error_response

        queryset = DoctorHospitalVerification.objects.filter(hospital=admin_role.hospital).select_related(
            "doctor", "doctor__user", "hospital", "verified_by"
        ).order_by("-created_at")

        status_filter = request.query_params.get("status")
        if status_filter:
            normalized = status_filter.strip().upper()
            valid = {choice[0] for choice in DoctorHospitalVerification.Status.choices}
            if normalized not in valid:
                return Response({"detail": "Invalid status filter."}, status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(status=normalized)

        serializer = DoctorHospitalVerificationSerializer(queryset, many=True)
        return Response({"verifications": serializer.data}, status=status.HTTP_200_OK)


class AdminDoctorVerificationActionView(HospitalAdminAPIView):
    def patch(self, request, verification_id):
        verification = DoctorHospitalVerification.objects.select_related("hospital").filter(id=verification_id).first()
        if not verification:
            return Response({"detail": "Verification record not found."}, status=status.HTTP_404_NOT_FOUND)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=verification.hospital_id)
        if error_response:
            return error_response

        action = str(request.data.get("action", "")).strip().lower()
        reason = str(request.data.get("rejection_reason", "")).strip()

        if action not in {"verify", "reject"}:
            return Response({"detail": "action must be either 'verify' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        if action == "verify":
            verification.status = DoctorHospitalVerification.Status.VERIFIED
            verification.rejection_reason = ""
            verification.verified_by = request.user
            verification.verified_at = timezone.now()
        else:
            if not reason:
                return Response({"detail": "rejection_reason is required when rejecting."}, status=status.HTTP_400_BAD_REQUEST)
            verification.status = DoctorHospitalVerification.Status.REJECTED
            verification.rejection_reason = reason
            verification.verified_by = request.user
            verification.verified_at = timezone.now()

        verification.save(update_fields=["status", "rejection_reason", "verified_by", "verified_at"])
        serializer = DoctorHospitalVerificationSerializer(verification)
        return Response({"verification": serializer.data}, status=status.HTTP_200_OK)


class AdminSlotTemplateListCreateView(HospitalAdminAPIView):
    def get(self, request):
        hospital_id = request.query_params.get("hospital_id")
        if not hospital_id:
            return Response({"detail": "hospital_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=hospital_id)
        if error_response:
            return error_response

        queryset = SlotTemplate.objects.filter(hospital=admin_role.hospital).select_related(
            "doctor", "hospital", "created_by"
        ).order_by("day_of_week", "start_time")

        serializer = SlotTemplateSerializer(queryset, many=True)
        return Response({"templates": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        hospital_id = request.data.get("hospital")
        if not hospital_id:
            return Response({"detail": "hospital is required."}, status=status.HTTP_400_BAD_REQUEST)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=hospital_id)
        if error_response:
            return error_response

        serializer = SlotTemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        doctor_id = serializer.validated_data["doctor"].id
        is_verified = DoctorHospitalVerification.objects.filter(
            doctor_id=doctor_id,
            hospital_id=admin_role.hospital_id,
            status=DoctorHospitalVerification.Status.VERIFIED
        ).exists()

        if not is_verified:
            return Response(
                {"detail": "Doctor is not verified for this hospital."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            template = serializer.save(created_by=request.user)

        return Response({"template": SlotTemplateSerializer(template).data}, status=status.HTTP_201_CREATED)


class AdminSlotTemplateDetailView(HospitalAdminAPIView):
    def patch(self, request, template_id):
        template = SlotTemplate.objects.select_related("hospital").filter(id=template_id).first()
        if not template:
            return Response({"detail": "Slot template not found."}, status=status.HTTP_404_NOT_FOUND)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=template.hospital_id)
        if error_response:
            return error_response

        serializer = SlotTemplateSerializer(template, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if "doctor" in serializer.validated_data:
            doctor_id = serializer.validated_data["doctor"].id
            is_verified = DoctorHospitalVerification.objects.filter(
                doctor_id=doctor_id,
                hospital_id=template.hospital_id,
                status=DoctorHospitalVerification.Status.VERIFIED
            ).exists()
            if not is_verified:
                return Response(
                    {"detail": "Doctor is not verified for this hospital."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        updated_template = serializer.save()
        return Response({"template": SlotTemplateSerializer(updated_template).data}, status=status.HTTP_200_OK)

    def delete(self, request, template_id):
        template = SlotTemplate.objects.select_related("hospital").filter(id=template_id).first()
        if not template:
            return Response({"detail": "Slot template not found."}, status=status.HTTP_404_NOT_FOUND)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=template.hospital_id)
        if error_response:
            return error_response

        template.is_active = False
        template.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminAppointmentCancelView(HospitalAdminAPIView):
    def patch(self, request, appointment_id):
        appointment = Appointment.objects.select_related('slot', 'doctor', 'slot__hospital').filter(id=appointment_id).first()
        if not appointment:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        hospital = None
        if appointment.hospital_id:
            hospital = appointment.hospital
        elif appointment.slot and appointment.slot.hospital:
            hospital = Hospital.objects.filter(name=appointment.slot.hospital).first()

        if not hospital:
            return Response({'detail': 'Appointment hospital could not be determined.'}, status=status.HTTP_400_BAD_REQUEST)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=hospital.id)

        if error_response:
            return error_response

        if appointment.status == Appointment.Status.CANCELLED:
            return Response({'detail': 'Appointment is already cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AdminAppointmentCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data['reason']

        with transaction.atomic():
            locked_slot = AppointmentAvailableSlot.objects.select_for_update().filter(id=appointment.slot_id).first()

            appointment.status = Appointment.Status.CANCELLED
            appointment.cancelled_by = 'ADMIN'
            appointment.cancellation_reason = reason
            appointment.cancelled_at = timezone.now()
            appointment.save(update_fields=['status', 'cancelled_by', 'cancellation_reason', 'cancelled_at', 'updated_at'])

            if locked_slot and locked_slot.booked_count > 0:
                locked_slot.booked_count -= 1
                locked_slot.remaining_count = max(locked_slot.patient_limit - locked_slot.booked_count, 0)
                locked_slot.save(update_fields=['booked_count', 'remaining_count'])

        payload = DoctorAppointmentSerializer(appointment).data
        return Response({'message': 'Appointment cancelled successfully.', 'appointment': payload}, status=status.HTTP_200_OK)

class DoctorSpecializationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"specializations": DOCTOR_SPECIALIZATIONS}, status=status.HTTP_200_OK)


class DoctorDirectoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, 'role', None) not in {'DOCTOR', 'PATIENT', 'ADMIN'}:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        queryset = DoctorProfile.objects.select_related('user').filter(
            user__role='DOCTOR',
            user__is_active=True,
            is_verified=True,
        ).order_by('full_name', 'id')
        serializer = DoctorDirectoryPublicSerializer(queryset, many=True, context={'request': request})
        return Response({'doctors': serializer.data}, status=status.HTTP_200_OK)


class DoctorDirectoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, doctor_id):
        role = getattr(request.user, 'role', None)
        if role not in {'DOCTOR', 'PATIENT', 'ADMIN'}:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        doctor = DoctorProfile.objects.select_related('user').filter(
            id=doctor_id,
            user__role='DOCTOR',
            user__is_active=True,
            is_verified=True,
        ).first()
        if not doctor:
            return Response({'detail': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        can_view_private_contact = role in {'PATIENT', 'ADMIN'}
        serializer_class = DoctorDirectoryDetailSerializer if can_view_private_contact else DoctorDirectoryPublicSerializer
        serializer = serializer_class(doctor, context={'request': request})
        return Response({'doctor': serializer.data}, status=status.HTTP_200_OK)


class DoctorDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if getattr(user, "role", None) != "DOCTOR":
            return Response({"detail": "Forbidden"}, status=403)

        doctor_profile = getattr(user, "doctor_profile", None)

        display_name = user.email
        specialization = "General"

        if doctor_profile:
            display_name = doctor_profile.full_name or doctor_profile.preferred_name or user.email
            specialization = doctor_profile.specialization or "General"

        today = timezone.localdate()
        current_year = today.year
        current_month = today.month

        appointment_queryset = Appointment.objects.filter(doctor=doctor_profile).select_related(
            "slot", "patient"
        ) if doctor_profile else Appointment.objects.none()

        today_appointments = appointment_queryset.filter(
            slot__date=today,
            status__in=[Appointment.Status.PENDING, Appointment.Status.ACCEPTED],
        ).count()

        month_completed_count = appointment_queryset.filter(
            status=Appointment.Status.COMPLETED,
            slot__date__year=current_year,
            slot__date__month=current_month,
        ).count()

        appointment_fee = float(doctor_profile.appointment_fee) if doctor_profile else 0.0
        month_earnings = int(month_completed_count * appointment_fee)

        upcoming_queryset = appointment_queryset.filter(
            slot__date__gte=today,
            status__in=[Appointment.Status.PENDING, Appointment.Status.ACCEPTED],
        ).order_by("slot__date", "slot__start_time")[:5]

        upcoming_appointments = []
        for appointment in upcoming_queryset:
            slot_date = appointment.slot.date
            if slot_date == today:
                date_label = "Today"
            elif slot_date == today + timedelta(days=1):
                date_label = "Tomorrow"
            else:
                date_label = slot_date.strftime("%b %d, %Y")

            status_label = "Confirmed" if appointment.status == Appointment.Status.ACCEPTED else "Pending"
            start_time = datetime.combine(slot_date, appointment.slot.start_time).strftime("%I:%M %p").lstrip("0")

            upcoming_appointments.append(
                {
                    "id": str(appointment.id),
                    "patientName": appointment.patient.full_name,
                    "type": "In-Person Appointment",
                    "date": date_label,
                    "time": start_time,
                    "status": status_label,
                }
            )

        # Chat model is not available yet, so return empty real-state data.
        recent_chats = []

        data = {
            "doctor": {
                "displayName": display_name,
                "email": user.email,
                "specialization": specialization,
            },
            "stats": {
                "todayAppointments": today_appointments,
                "unreadChats": 0,
                "monthEarnings": month_earnings,
                "onlineAdviceSessions": DoctorOnlineAdviceAvailability.objects.filter(doctor=doctor_profile).count() if doctor_profile else 0,
            },
            "upcomingAppointments": upcoming_appointments,
            "recentChats": recent_chats,
        }

        return Response(data)


class DoctorProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if getattr(user, "role", None) != "DOCTOR":
            return Response({"detail": "Forbidden"}, status=403)

        doctor_profile = getattr(user, "doctor_profile", None)

        full_name = user.email
        preferred_name = "Dr."
        specialization = "General"
        phone = ""
        license_number = ""
        is_verified = False
        experience_years = 0
        location = ""
        qualifications = ""
        hospitals = ""
        languages_spoken = ""
        chat_fee = 1000000.00
        appointment_fee = 2000000.00
        availability = False

        if doctor_profile:
            full_name = doctor_profile.full_name or user.email
            preferred_name = doctor_profile.preferred_name or "Dr."
            specialization = doctor_profile.specialization or "General"
            phone = doctor_profile.phone or ""
            license_number = doctor_profile.license_number or ""
            is_verified = bool(doctor_profile.is_verified)
            experience_years = doctor_profile.experience_years
            location = doctor_profile.location
            qualifications = doctor_profile.qualifications
            hospitals = doctor_profile.hospitals
            languages_spoken = doctor_profile.languages_spoken
            chat_fee = float(doctor_profile.chat_fee)
            appointment_fee = float(doctor_profile.appointment_fee)
            availability = doctor_profile.availability

        data = {
            "doctor": {
                "fullName": full_name,
                "preferredName": preferred_name,
                "email": user.email,
                "specialization": specialization,
                "phone": phone,
                "licenseNumber": license_number,
                "isVerified": is_verified,
            },
            "profileDetails": {
                "experience": f"{experience_years} years of experience",
                "location": location,
                "chatFee": chat_fee,
                "appointmentFee": appointment_fee,
                "availabilityForOnlineAdvice": availability,
                "onlineAdviceSchedule": [
                    "Monday, 2:00 PM - 5:00 PM",
                    "Tuesday, 10:00 AM - 1:00 PM",
                    "Thursday, 3:00 PM - 6:00 PM",
                    "Friday, 11:00 AM - 2:00 PM",
                ],
                "qualifications": qualifications.split(",") if qualifications else ["MBBS", "MD (Cardiology)"],
                "hospitals": hospitals.split(",") if hospitals else ["General Hospital"],
                "languages": languages_spoken.split(",") if languages_spoken else ["Sinhala", "English"],
            },
        }

        return Response(data)

    def patch(self, request):
        user = request.user

        if getattr(user, "role", None) != "DOCTOR":
            return Response({"detail": "Forbidden"}, status=403)

        doctor_profile = getattr(user, "doctor_profile", None)
        if not doctor_profile:
            return Response({"detail": "Doctor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        payload = request.data if isinstance(request.data, dict) else {}
        user_update_fields = []

        if "email" in payload:
            email = str(payload.get("email") or "").strip()
            if not email:
                return Response({"detail": "email cannot be blank."}, status=status.HTTP_400_BAD_REQUEST)

            existing_user = CustomUser.objects.filter(email__iexact=email).exclude(id=user.id).exists()
            if existing_user:
                return Response({"detail": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

            user.email = email
            user_update_fields.append("email")

        field_map = {
            "fullName": "full_name",
            "preferredName": "preferred_name",
            "specialization": "specialization",
            "phone": "phone",
            "licenseNumber": "license_number",
            "location": "location",
            "qualifications": "qualifications",
            "hospitals": "hospitals",
            "languages": "languages_spoken",
        }

        update_fields = []

        for payload_key, model_field in field_map.items():
            if payload_key in payload:
                setattr(doctor_profile, model_field, payload.get(payload_key) or "")
                update_fields.append(model_field)

        if "experienceYears" in payload:
            try:
                experience_years = int(payload.get("experienceYears"))
            except (TypeError, ValueError):
                return Response({"detail": "experienceYears must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)

            if experience_years < 0:
                return Response({"detail": "experienceYears cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

            doctor_profile.experience_years = experience_years
            update_fields.append("experience_years")

        if "chatFee" in payload:
            try:
                chat_fee = float(payload.get("chatFee"))
            except (TypeError, ValueError):
                return Response({"detail": "chatFee must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

            if chat_fee < 0:
                return Response({"detail": "chatFee cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

            doctor_profile.chat_fee = chat_fee
            update_fields.append("chat_fee")

        if "appointmentFee" in payload:
            try:
                appointment_fee = float(payload.get("appointmentFee"))
            except (TypeError, ValueError):
                return Response({"detail": "appointmentFee must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

            if appointment_fee < 0:
                return Response({"detail": "appointmentFee cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

            doctor_profile.appointment_fee = appointment_fee
            update_fields.append("appointment_fee")

        if "availabilityForOnlineAdvice" in payload:
            doctor_profile.availability = bool(payload.get("availabilityForOnlineAdvice"))
            update_fields.append("availability")

        if update_fields:
            doctor_profile.save(update_fields=sorted(set(update_fields)))

        if user_update_fields:
            user.save(update_fields=sorted(set(user_update_fields)))

        return self.get(request)


class DoctorAppointmentsView(VerifiedDoctorAPIView):

    def get(self, request):
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response

        queryset = Appointment.objects.filter(doctor=doctor_profile).select_related(
            'slot', 'patient', 'patient__user', 'doctor'
        ).order_by('-requested_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            normalized = status_filter.strip().upper()
            valid_statuses = {choice[0] for choice in Appointment.Status.choices}
            if normalized not in valid_statuses:
                return Response({'detail': 'Invalid status filter.'}, status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(status=normalized)

        data = DoctorAppointmentSerializer(queryset, many=True).data
        return Response({'appointments': data}, status=status.HTTP_200_OK)


class DoctorPatientProfileView(VerifiedDoctorAPIView):

    def get(self, request, patient_id):
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response

        appointment = Appointment.objects.filter(
            doctor=doctor_profile,
            patient_id=patient_id,
        ).select_related('patient', 'patient__user').first()

        if not appointment or not appointment.patient:
            return Response({'detail': 'Patient not found for this doctor.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DoctorPatientProfileSerializer(
            appointment.patient,
            context={'doctor_profile': doctor_profile},
        )
        return Response({'patient': serializer.data}, status=status.HTTP_200_OK)


class DoctorAppointmentActionView(VerifiedDoctorAPIView):

    def patch(self, request, appointment_id):
        user = request.user

        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        
        if error_response:
            return error_response

        appointment = Appointment.objects.filter(
            id=appointment_id,
            doctor=doctor_profile,
        ).select_related('slot', 'patient', 'patient__user', 'doctor').first()

        if not appointment:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DoctorAppointmentActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']

        transition_rules = {
            'complete': {
                'allowed': {Appointment.Status.ACCEPTED},
                'target': Appointment.Status.COMPLETED,
                'message': 'Appointment marked as completed.',
            },
        }

        rule = transition_rules[action]
        if appointment.status not in rule['allowed']:
            return Response(
                {'detail': f"Cannot '{action}' an appointment in {appointment.status} state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment.status = rule['target']
        appointment.save(update_fields=['status', 'updated_at'])

        payload = DoctorAppointmentSerializer(appointment).data
        return Response({'message': rule['message'], 'appointment': payload}, status=status.HTTP_200_OK)


class DoctorAppointmentRescheduleView(VerifiedDoctorAPIView):

    def patch(self, request, appointment_id):
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response
        
        appointment = Appointment.objects.filter(
            id=appointment_id,
            doctor=doctor_profile,
        ).select_related('slot', 'patient', 'patient__user', 'doctor').first()

        if not appointment:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if appointment.status in {Appointment.Status.REJECTED, Appointment.Status.COMPLETED, Appointment.Status.CANCELLED}:
            return Response(
                {'detail': f"Cannot reschedule an appointment in {appointment.status} state."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DoctorAppointmentRescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        date_value = serializer.validated_data['date']
        start_time = serializer.validated_data['start_time']

        target_slot = AppointmentAvailableSlot.objects.filter(
            doctor=doctor_profile,
            date=date_value,
            start_time=start_time,
        ).order_by('end_time').first()

        if not target_slot:
            return Response(
                {'detail': 'No available slot found for the selected date and time.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if target_slot.id == appointment.slot_id:
            payload = DoctorAppointmentSerializer(appointment).data
            return Response(
                {'message': 'Appointment already uses the selected slot.', 'appointment': payload},
                status=status.HTTP_200_OK,
            )

        appointment.slot = target_slot
        appointment.save(update_fields=['slot', 'updated_at'])

        payload = DoctorAppointmentSerializer(appointment).data
        return Response({'message': 'Appointment rescheduled successfully.', 'appointment': payload}, status=status.HTTP_200_OK)


class DoctorAppointmentSlotsView(VerifiedDoctorAPIView):

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and end_a > start_b

    def get(self, request):
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response

        slots = AppointmentAvailableSlot.objects.filter(doctor=doctor_profile).order_by('date', 'start_time')
        data = AppointmentAvailableSlotSerializer(slots, many=True).data

        return Response({'slots': data}, status=status.HTTP_200_OK)

    def post(self, request):
        return Response(
            {'detail': 'Doctors cannot create appointment slots. Contact hospital admin.'},
            status=status.HTTP_403_FORBIDDEN
        )


class DoctorAppointmentSlotDetailView(VerifiedDoctorAPIView):

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and end_a > start_b

    def patch(self, request, slot_id):
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response

        slot = AppointmentAvailableSlot.objects.filter(id=slot_id, doctor=doctor_profile).first()
        if not slot:
            return Response({'detail': 'Appointment slot not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AppointmentSlotUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        patient_limit = serializer.validated_data.get('patient_limit', slot.patient_limit)

        if patient_limit < slot.booked_count:
            return Response(
                {'detail': 'patient_limit cannot be less than the number of already booked patients.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        slot.patient_limit = patient_limit
        slot.remaining_count = max(slot.patient_limit - slot.booked_count, 0)
        slot.save(update_fields=['patient_limit', 'remaining_count'])

        return Response(
            {
                'message': 'Appointment slot patient limit updated successfully.',
                'slot': AppointmentAvailableSlotSerializer(slot).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slot_id):
        return Response(
            {'detail': 'Doctors cannot delete appointment slots. Contact hospital admin.'},
            status=status.HTTP_403_FORBIDDEN,
        )


class DoctorOnlineAdviceSlotsView(VerifiedDoctorAPIView):

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and end_a > start_b

    def get(self, request):
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response
    
        slots = DoctorOnlineAdviceAvailability.objects.filter(doctor=doctor_profile).order_by('day_of_week', 'start_time')
        data = OnlineAdviceAvailabilitySerializer(slots, many=True).data

        return Response({'slots': data}, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response
        
        serializer = BulkOnlineAdviceSlotCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        requested_slots = serializer.validated_data['slots']
        days = {slot['day_of_week'] for slot in requested_slots}

        existing_slots = DoctorOnlineAdviceAvailability.objects.filter(
            doctor=doctor_profile,
            day_of_week__in=days,
        ).order_by('day_of_week', 'start_time')

        intervals_by_day = defaultdict(list)
        for existing in existing_slots:
            intervals_by_day[existing.day_of_week].append((existing.start_time, existing.end_time))

        objects_to_create = []
        conflicts = []

        for idx, slot in enumerate(requested_slots):
            day_of_week = slot['day_of_week']
            start_time = slot['start_time']
            end_time = slot['end_time']

            has_overlap = any(
                self._overlaps(start_time, end_time, existing_start, existing_end)
                for existing_start, existing_end in intervals_by_day[day_of_week]
            )

            if has_overlap:
                conflicts.append(
                    {
                        'index': idx,
                        'day_of_week': day_of_week,
                        'start_time': start_time.strftime('%H:%M:%S'),
                        'end_time': end_time.strftime('%H:%M:%S'),
                        'error': 'Overlaps with an existing online advice slot.',
                    }
                )
                continue

            intervals_by_day[day_of_week].append((start_time, end_time))
            objects_to_create.append(
                DoctorOnlineAdviceAvailability(
                    doctor=doctor_profile,
                    day_of_week=day_of_week,
                    start_time=start_time,
                    end_time=end_time,
                )
            )

        if conflicts:
            return Response(
                {'detail': 'Some slots could not be created.', 'conflicts': conflicts},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = DoctorOnlineAdviceAvailability.objects.bulk_create(objects_to_create)
        created_data = OnlineAdviceAvailabilitySerializer(created, many=True).data

        return Response(
            {
                'message': f'{len(created)} online advice slots created successfully.',
                'slots': created_data,
            },
            status=status.HTTP_201_CREATED,
        )


class DoctorOnlineAdviceSlotDetailView(VerifiedDoctorAPIView):

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and end_a > start_b

    def patch(self, request, slot_id):
        user = request.user

        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response

        slot = DoctorOnlineAdviceAvailability.objects.filter(id=slot_id, doctor=doctor_profile).first()
        if not slot:
            return Response({'detail': 'Online advice slot not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OnlineAdviceSlotUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        day_of_week = serializer.validated_data.get('day_of_week', slot.day_of_week)
        start_time = serializer.validated_data.get('start_time', slot.start_time)
        end_time = serializer.validated_data.get('end_time', slot.end_time)

        if start_time >= end_time:
            return Response(
                {'detail': 'start_time must be before end_time.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        overlapping = DoctorOnlineAdviceAvailability.objects.filter(
            doctor=doctor_profile,
            day_of_week=day_of_week,
        ).exclude(id=slot.id)

        has_overlap = any(
            self._overlaps(start_time, end_time, existing.start_time, existing.end_time)
            for existing in overlapping
        )
        if has_overlap:
            return Response(
                {'detail': 'Updated slot overlaps with an existing online advice slot.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        slot.day_of_week = day_of_week
        slot.start_time = start_time
        slot.end_time = end_time
        slot.save(update_fields=['day_of_week', 'start_time', 'end_time'])

        return Response(
            {
                'message': 'Online advice slot updated successfully.',
                'slot': OnlineAdviceAvailabilitySerializer(slot).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slot_id):
        
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response

        slot = DoctorOnlineAdviceAvailability.objects.filter(id=slot_id, doctor=doctor_profile).first()
        if not slot:
            return Response({'detail': 'Online advice slot not found.'}, status=status.HTTP_404_NOT_FOUND)

        slot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

