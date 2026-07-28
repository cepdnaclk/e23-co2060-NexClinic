from collections import defaultdict
from datetime import date, datetime, timedelta

from django.db import transaction
from django.db.models import Exists, OuterRef
from django.utils import timezone
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from chat.models import AdviceChatThread
from .constants import DOCTOR_SPECIALIZATIONS
from doctor.models import AppointmentAvailableSlot, DoctorOnlineAdviceAvailability, Appointment, DoctorProfile
from hospital.models import Hospital, HospitalAdmin, DoctorHospitalVerification, SlotTemplate, DoctorSlotTemplateAssignment
from patient.models import PatientMedicalRecord
from patient.serializers import PatientMedicalRecordSerializer, PatientMedicalRecordUpsertSerializer
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
    DoctorSlotTemplateAssignmentSerializer,
)

# A base class for views that require
# the requesting user to have 
# the DOCTOR role and possess an admin-verified DoctorProfile
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

# A base class for views that require
# the requesting user to have
# an admin role and be a hospital admin for the relevant hospital(s)
class HospitalAdminAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _is_admin(user):
        return getattr(user, "role", None) in {"ADMIN", "HOSPITAL_ADMIN"}

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

# View for hospital admins
# to view the list of hospitals they are associated with.
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
    

# View for hospital admins
# to view and manage doctor verification requests for their hospital(s).
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

# View for hospital admins
# to take action (verify or reject) on doctor verification requests for their hospital(s).
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

# View for hospital admins
# to view, create, update, and delete doctor slot templates for their hospital(s).
class AdminSlotTemplateListCreateView(HospitalAdminAPIView):
    def get(self, request):
        hospital_id = request.query_params.get("hospital_id")
        if not hospital_id:
            return Response({"detail": "hospital_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=hospital_id)
        if error_response:
            return error_response

        queryset = SlotTemplate.objects.filter(hospital=admin_role.hospital, is_deleted=False).select_related(
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

        doctor = serializer.validated_data.get("doctor")
        if doctor:
            is_verified = DoctorHospitalVerification.objects.filter(
                doctor_id=doctor.id,
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

# View for hospital admins
# to view, update, and delete a specific doctor slot template for their hospital(s).
class AdminSlotTemplateDetailView(HospitalAdminAPIView):
    def patch(self, request, template_id):
        template = SlotTemplate.objects.select_related("hospital").filter(id=template_id, is_deleted=False).first()
        if not template:
            return Response({"detail": "Slot template not found."}, status=status.HTTP_404_NOT_FOUND)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=template.hospital_id)
        if error_response:
            return error_response

        serializer = SlotTemplateSerializer(template, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if "doctor" in serializer.validated_data:
            doctor = serializer.validated_data.get("doctor")
            if doctor:
                is_verified = DoctorHospitalVerification.objects.filter(
                    doctor_id=doctor.id,
                    hospital_id=template.hospital_id,
                    status=DoctorHospitalVerification.Status.VERIFIED
                ).exists()
                if not is_verified:
                    return Response(
                        {"detail": "Doctor is not verified for this hospital."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        old_is_active = template.is_active
        updated_template = serializer.save()

        if "is_active" in serializer.validated_data and old_is_active != updated_template.is_active:
            AppointmentAvailableSlot.objects.filter(
                slot_template=updated_template,
                date_start__gte=timezone.now(),
            ).update(is_active=updated_template.is_active)

        return Response({"template": SlotTemplateSerializer(updated_template).data}, status=status.HTTP_200_OK)

    def delete(self, request, template_id):
        template = SlotTemplate.objects.select_related("hospital").filter(id=template_id, is_deleted=False).first()
        if not template:
            return Response({"detail": "Slot template not found."}, status=status.HTTP_404_NOT_FOUND)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=template.hospital_id)
        if error_response:
            return error_response

        linked_slots = AppointmentAvailableSlot.objects.filter(slot_template=template)
        booked_slots_count = linked_slots.filter(appointments__isnull=False).distinct().count()

        # Do not silently keep a template around in a deactivated-looking state.
        # If any generated slot has appointments, require explicit cleanup first.
        if booked_slots_count > 0:
            return Response(
                {
                    "detail": "Cannot permanently delete template because some generated slots have appointments.",
                    "booked_slots_count": booked_slots_count,
                },
                status=status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            deleted_slots_count = linked_slots.count()
            linked_slots.delete()

            # Hard delete template (and related assignments via CASCADE).
            template.delete()

        return Response(
            {
                "detail": "Template deleted permanently.",
                "deleted_slots_count": deleted_slots_count,
            },
            status=status.HTTP_200_OK,
        )


class AdminApplySlotTemplatesView(HospitalAdminAPIView):
    def post(self, request):
        hospital_id = request.data.get("hospital")
        if not hospital_id:
            return Response(
                {"detail": "hospital is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=hospital_id)
        if error_response:
            return error_response

        template_ids = request.data.get("template_ids", [])
        doctor_ids = request.data.get("doctor_ids", [])
        timeframe_type = request.data.get("timeframe_type")

        if not template_ids or not isinstance(template_ids, list):
            return Response(
                {"detail": "template_ids must be a non-empty list of template IDs."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not doctor_ids or not isinstance(doctor_ids, list):
            return Response(
                {"detail": "doctor_ids must be a non-empty list of doctor IDs."},
                status=status.HTTP_400_BAD_REQUEST
            )

        templates = SlotTemplate.objects.filter(
            id__in=template_ids,
            hospital=admin_role.hospital,
            is_active=True,
            is_deleted=False,
        )
        if templates.count() != len(set(template_ids)):
            return Response(
                {"detail": "One or more templates are invalid or inactive for this hospital."},
                status=status.HTTP_400_BAD_REQUEST
            )

        verified_doctors = DoctorHospitalVerification.objects.filter(
            doctor_id__in=doctor_ids,
            hospital=admin_role.hospital,
            status=DoctorHospitalVerification.Status.VERIFIED
        ).values_list("doctor_id", flat=True)
        verified_doctors = set(verified_doctors)
        if verified_doctors != set(doctor_ids):
            return Response(
                {"detail": "One or more doctors are not verified for this hospital branch."},
                status=status.HTTP_400_BAD_REQUEST
            )

        today = timezone.localdate()
        start_date_str = request.data.get("start_date")
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"detail": "Invalid start_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            start_date = today

        if timeframe_type == "1_week":
            end_date = start_date + timedelta(weeks=1) - timedelta(days=1)
        elif timeframe_type == "2_weeks":
            end_date = start_date + timedelta(weeks=2) - timedelta(days=1)
        elif timeframe_type == "1_month":
            end_date = start_date + timedelta(days=30) - timedelta(days=1)
        elif timeframe_type == "3_months":
            end_date = start_date + timedelta(days=90) - timedelta(days=1)
        elif timeframe_type == "custom":
            end_date_str = request.data.get("end_date")
            if not end_date_str:
                return Response(
                    {"detail": "end_date is required when timeframe_type is custom."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"detail": "Invalid end_date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"detail": "Invalid timeframe_type. Must be 1_week, 2_weeks, 1_month, 3_months, or custom."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if start_date > end_date:
            return Response(
                {"detail": "start_date cannot be after end_date."},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_slots = 0
        skipped_slots = 0
        assignments_created = []

        with transaction.atomic():
            doctors = DoctorProfile.objects.filter(id__in=doctor_ids)
            doctor_map = {doc.id: doc for doc in doctors}

            for doc_id in doctor_ids:
                doctor = doctor_map.get(doc_id)
                if not doctor:
                    continue

                for template in templates:
                    if template.doctor_id and template.doctor_id != doctor.id:
                        continue

                    assignment = DoctorSlotTemplateAssignment.objects.create(
                        doctor=doctor,
                        hospital=admin_role.hospital,
                        slot_template=template,
                        start_date=start_date,
                        end_date=end_date,
                        is_active=True,
                        created_by=request.user
                    )
                    assignments_created.append(assignment)

                    current_date = start_date
                    while current_date <= end_date:
                        if current_date.weekday() == template.day_of_week:
                            slot_start = timezone.make_aware(datetime.combine(current_date, template.start_time))
                            slot_end = timezone.make_aware(datetime.combine(current_date, template.end_time))

                            existing_slot = AppointmentAvailableSlot.objects.filter(
                                doctor=doctor,
                                hospital=admin_role.hospital,
                                date_start=slot_start,
                                date_end=slot_end,
                            ).exists()

                            if existing_slot:
                                skipped_slots += 1
                            else:
                                AppointmentAvailableSlot.objects.create(
                                    doctor=doctor,
                                    hospital=admin_role.hospital,
                                    date=current_date,
                                    date_start=slot_start,
                                    date_end=slot_end,
                                    start_time=template.start_time,
                                    end_time=template.end_time,
                                    slot_template=template,
                                    patient_limit=template.default_patient_limit,
                                    booked_count=0,
                                    remaining_count=template.default_patient_limit,
                                    created_by=request.user,
                                    is_active=True,
                                )
                                created_slots += 1

                        current_date += timedelta(days=1)

        serializer = DoctorSlotTemplateAssignmentSerializer(assignments_created, many=True)
        return Response(
            {
                "detail": "Templates applied successfully.",
                "created_slots": created_slots,
                "skipped_slots": skipped_slots,
                "assignments": serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class AdminSlotTemplateAssignmentListView(HospitalAdminAPIView):
    def get(self, request):
        hospital_id = request.query_params.get("hospital_id")
        if not hospital_id:
            return Response(
                {"detail": "hospital_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=hospital_id)
        if error_response:
            return error_response

        queryset = (
            DoctorSlotTemplateAssignment.objects.filter(
                hospital=admin_role.hospital,
                slot_template__is_deleted=False,
            )
            .select_related("doctor", "hospital", "slot_template", "created_by")
            .order_by("-created_at")
        )

        serializer = DoctorSlotTemplateAssignmentSerializer(queryset, many=True)
        return Response({"assignments": serializer.data}, status=status.HTTP_200_OK)


class AdminSlotTemplateAssignmentDetailView(HospitalAdminAPIView):
    def delete(self, request, assignment_id):
        assignment = DoctorSlotTemplateAssignment.objects.filter(id=assignment_id).first()
        if not assignment:
            return Response(
                {"detail": "Assignment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=assignment.hospital_id)
        if error_response:
            return error_response

        now = timezone.now()
        future_slots_qs = AppointmentAvailableSlot.objects.filter(
            doctor=assignment.doctor,
            hospital=assignment.hospital,
            slot_template=assignment.slot_template,
            date_start__gte=now,
            booked_count=0,
        )
        deleted_slots_count = future_slots_qs.count()

        with transaction.atomic():
            future_slots_qs.delete()
            assignment.delete()

        return Response(
            {
                "detail": "Assignment revoked successfully.",
                "deleted_slots_count": deleted_slots_count,
            },
            status=status.HTTP_200_OK,
        )

# View for hospital admins
# to cancel a specific doctor appointment for their hospital(s) with a required cancellation reason.
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

# View for hospital admins
# to bulk generate doctor appointment slots for their hospital(s)
# based on active slot templates and a specified number of future days.
class AdminAppointmentSlotGenerationView(HospitalAdminAPIView):
    def post(self, request):
        hospital_id = request.data.get("hospital") or request.query_params.get("hospital_id")
        if not hospital_id:
            return Response({"detail": "hospital is required."}, status=status.HTTP_400_BAD_REQUEST)

        admin_role, error_response = self._get_admin_role(request.user, hospital_id=hospital_id)
        if error_response:
            return error_response

        try:
            days = int(request.data.get("days", 14))
        except (TypeError, ValueError):
            return Response({"detail": "days must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)

        if days < 1:
            return Response({"detail": "days must be at least 1."}, status=status.HTTP_400_BAD_REQUEST)

        doctor_id = request.data.get("doctor_id")
        skip_duplicates_raw = request.data.get("skip_duplicates", True)
        if isinstance(skip_duplicates_raw, str):
            skip_duplicates = skip_duplicates_raw.strip().lower() in {"1", "true", "yes", "on"}
        else:
            skip_duplicates = bool(skip_duplicates_raw)

        templates = SlotTemplate.objects.filter(
            is_active=True,
            is_deleted=False,
            hospital_id=admin_role.hospital_id,
            doctor__isnull=False,
        )
        if doctor_id:
            templates = templates.filter(doctor_id=doctor_id)

        templates = templates.select_related("doctor", "hospital", "created_by")
        if not templates.exists():
            return Response({"detail": "No active slot templates found for this hospital."}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.localdate()
        end_date = today + timedelta(days=days - 1)

        created_count = 0
        skipped_count = 0
        created_slot_ids = []

        with transaction.atomic():
            for template in templates:
                current_date = today
                while current_date <= end_date:
                    if current_date.weekday() != template.day_of_week:
                        current_date += timedelta(days=1)
                        continue

                    slot_start = timezone.make_aware(datetime.combine(current_date, template.start_time))
                    slot_end = timezone.make_aware(datetime.combine(current_date, template.end_time))

                    existing_slot = AppointmentAvailableSlot.objects.filter(
                        doctor=template.doctor,
                        hospital=template.hospital,
                        date_start=slot_start,
                        date_end=slot_end,
                    ).first()

                    if existing_slot and skip_duplicates:
                        skipped_count += 1
                    else:
                        slot = AppointmentAvailableSlot.objects.create(
                            doctor=template.doctor,
                            hospital=template.hospital,
                            date=slot_start.date(),
                            date_start=slot_start,
                            date_end=slot_end,
                            start_time=template.start_time,
                            end_time=template.end_time,
                            slot_template=template,
                            patient_limit=template.default_patient_limit,
                            booked_count=0,
                            created_by=template.created_by or request.user,
                            is_active=True,
                        )
                        created_count += 1
                        created_slot_ids.append(slot.id)

                    current_date += timedelta(days=1)

        return Response(
            {
                "message": f"{created_count} appointment slots created successfully.",
                "created_count": created_count,
                "skipped_count": skipped_count,
                "created_slot_ids": created_slot_ids,
            },
            status=status.HTTP_201_CREATED,
        )


# View for doctors to list and submit hospital affiliation requests.
class DoctorRequestHospitalLinkView(VerifiedDoctorAPIView):
    def get(self, request):
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(request.user)
        if error_response:
            return error_response

        queryset = DoctorHospitalVerification.objects.filter(
            doctor=doctor_profile
        ).select_related("doctor", "doctor__user", "hospital", "verified_by").order_by("-created_at")

        serializer = DoctorHospitalVerificationSerializer(queryset, many=True)
        return Response({"verifications": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(request.user)
        if error_response:
            return error_response

        hospital_id = request.data.get("hospital_id")
        if not hospital_id:
            return Response({"detail": "hospital_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        hospital = Hospital.objects.filter(id=hospital_id).first()
        if not hospital:
            return Response({"detail": "Hospital not found."}, status=status.HTTP_404_NOT_FOUND)

        if doctor_profile.verified_hospitals.filter(id=hospital.id).exists():
            return Response(
                {"detail": "Doctor is already verified for this hospital."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification = DoctorHospitalVerification.objects.filter(
            doctor=doctor_profile,
            hospital=hospital,
        ).first()

        if verification:
            if verification.status == DoctorHospitalVerification.Status.PENDING:
                return Response(
                    {"detail": "A pending verification request already exists for this hospital."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if verification.status == DoctorHospitalVerification.Status.VERIFIED:
                return Response(
                    {"detail": "Doctor is already verified for this hospital."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Allow re-submission for previously rejected requests.
            verification.status = DoctorHospitalVerification.Status.PENDING
            verification.rejection_reason = ""
            verification.verified_by = None
            verification.verified_at = None
            verification.save(update_fields=["status", "rejection_reason", "verified_by", "verified_at"])
        else:
            verification = DoctorHospitalVerification.objects.create(
                doctor=doctor_profile,
                hospital=hospital,
                status=DoctorHospitalVerification.Status.PENDING,
            )

        serializer = DoctorHospitalVerificationSerializer(verification)
        return Response({"verification": serializer.data}, status=status.HTTP_201_CREATED)

# View to retrieve the list of doctor specializations for populating dropdowns and filters in the frontend.
class DoctorSpecializationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"specializations": DOCTOR_SPECIALIZATIONS}, status=status.HTTP_200_OK)

# View for authenticated users (doctors, patients, admins)
# to retrieve a directory of verified doctors with public information.
class DoctorDirectoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, 'role', None) not in {'DOCTOR', 'PATIENT', 'ADMIN'}:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        verified_hospital_exists = DoctorHospitalVerification.objects.filter(
            doctor_id=OuterRef('pk'),
            status=DoctorHospitalVerification.Status.VERIFIED,
            hospital__is_active=True,
        )

        queryset = (
            DoctorProfile.objects.select_related('user')
            .annotate(has_verified_hospital=Exists(verified_hospital_exists))
            .filter(user__role='DOCTOR', user__is_active=True, has_verified_hospital=True)
            .order_by('full_name', 'id')
        )
        serializer = DoctorDirectoryPublicSerializer(queryset, many=True, context={'request': request})
        return Response({'doctors': serializer.data}, status=status.HTTP_200_OK)

# View for authenticated users (doctors, patients, admins)
# to retrieve detailed information about a specific doctor in the directory.
class DoctorDirectoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, doctor_id):
        role = getattr(request.user, 'role', None)
        if role not in {'DOCTOR', 'PATIENT', 'ADMIN'}:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        verified_hospital_exists = DoctorHospitalVerification.objects.filter(
            doctor_id=OuterRef('pk'),
            status=DoctorHospitalVerification.Status.VERIFIED,
            hospital__is_active=True,
        )

        doctor = (
            DoctorProfile.objects.select_related('user')
            .annotate(has_verified_hospital=Exists(verified_hospital_exists))
            .filter(
                id=doctor_id,
                user__role='DOCTOR',
                user__is_active=True,
                has_verified_hospital=True,
            )
            .first()
        )
        if not doctor:
            return Response({'detail': 'Doctor not found.'}, status=status.HTTP_404_NOT_FOUND)

        can_view_private_contact = role in {'PATIENT', 'ADMIN'}
        serializer_class = DoctorDirectoryDetailSerializer if can_view_private_contact else DoctorDirectoryPublicSerializer
        serializer = serializer_class(doctor, context={'request': request})
        return Response({'doctor': serializer.data}, status=status.HTTP_200_OK)


# View for doctors to retrieve dashboard information
# including today's appointments, upcoming appointments, recent chats, and earnings for the current month.
class DoctorDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        doctor_profile = getattr(user, "doctor_profile", None)

        if getattr(user, "role", None) != "DOCTOR":
            return Response({"detail": "Forbidden"}, status=403)

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

        recent_chat_threads = (
            AdviceChatThread.objects.filter(doctor=doctor_profile)
            .select_related("patient")
            .order_by("-last_message_at", "-started_at")[:5]
            if doctor_profile
            else []
        )

        recent_chats = []
        unread_chat_count = 0
        for thread in recent_chat_threads:
            unread_count = thread.messages.exclude(sender_user=user).filter(is_read=False).count()
            unread_chat_count += unread_count
            last_message = thread.messages.order_by("-sent_at", "-id").first()
            recent_chats.append(
                {
                    "id": str(thread.id),
                    "patientName": thread.patient.full_name,
                    "lastMessage": last_message.message_text if last_message else "",
                    "unreadCount": unread_count,
                    "time": thread.last_message_at.strftime("%b %d, %I:%M %p") if thread.last_message_at else thread.started_at.strftime("%b %d, %I:%M %p"),
                }
            )

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

# View for doctors to retrieve and update their own profile information,
# including personal details, qualifications, hospital affiliations, and fees.
class DoctorProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _build_profile_image_url(request, doctor_profile):
        if not doctor_profile or not doctor_profile.profile_picture:
            return ""

        return request.build_absolute_uri(doctor_profile.profile_picture.url)

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
        photo = ""
        date_of_birth = ""
        gender = ""
        address = ""
        experience_years = 0
        qualifications = ""
        hospitals = []
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
            if doctor_profile.profile_picture:
                request_obj = request if request else None
                if request_obj:
                    photo = request_obj.build_absolute_uri(doctor_profile.profile_picture.url)
                else:
                    photo = doctor_profile.profile_picture.url
            if doctor_profile.date_of_birth:
                date_of_birth = doctor_profile.date_of_birth.isoformat()
            gender = doctor_profile.gender or ""
            address = doctor_profile.address or ""
            experience_years = doctor_profile.experience_years
            location = doctor_profile.location
            qualifications = doctor_profile.qualifications
            try:
                hospitals = [h.name for h in doctor_profile.verified_hospitals.all()]
            except Exception:
                hospitals = []
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
                "profileImage": self._build_profile_image_url(request, doctor_profile),
                "licenseNumber": license_number,
                "isVerified": is_verified,
                "photo": photo,
                "dateOfBirth": date_of_birth,
                "gender": gender,
                "address": address,
            },
            "profileDetails": {
                "experience": f"{experience_years} years of experience",
                "location": location,
                "chatFee": chat_fee,
                "appointmentFee": appointment_fee,
                "onlineDoctorPayment": float(doctor_profile.online_doctor_payment) if doctor_profile else 0.0,
                "onlineHospitalCharge": float(doctor_profile.online_hospital_charge) if doctor_profile else 0.0,
                "inpersonDoctorPayment": float(doctor_profile.inperson_doctor_payment) if doctor_profile else 0.0,
                "inpersonHospitalCharge": float(doctor_profile.inperson_hospital_charge) if doctor_profile else 0.0,
                "availabilityForOnlineAdvice": availability,
                "onlineAdviceSchedule": [
                    "Monday, 2:00 PM - 5:00 PM",
                    "Tuesday, 10:00 AM - 1:00 PM",
                    "Thursday, 3:00 PM - 6:00 PM",
                    "Friday, 11:00 AM - 2:00 PM",
                ],
                "qualifications": qualifications.split(",") if qualifications else ["MBBS", "MD (Cardiology)"],
                "hospitals": hospitals if hospitals else ["General Hospital"],
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

        field_map = {
            "fullName": "full_name",
            "preferredName": "preferred_name",
            "specialization": "specialization",
            "phone": "phone",
            "licenseNumber": "license_number",
            "location": "location",
            "qualifications": "qualifications",
            "languages": "languages_spoken",
        }

        # Hospitals are derived from verification records and synced into
        # verified_hospitals via signals, so they are not written here.

        update_fields = []

        if "email" in payload:
            new_email = (payload.get("email") or "").strip().lower()
            if not new_email:
                return Response({"detail": "email cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

            User = get_user_model()
            email_in_use = User.objects.exclude(pk=user.pk).filter(email__iexact=new_email).exists()
            if email_in_use:
                return Response({"detail": "A user with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

            user.email = new_email
            if hasattr(user, "username"):
                user.username = new_email
            user.save(update_fields=["email", "username"] if hasattr(user, "username") else ["email"])

        if request.FILES.get("profilePicture"):
            doctor_profile.profile_picture = request.FILES.get("profilePicture")
            update_fields.append("profile_picture")

        if str(payload.get("clearProfilePicture", "")).lower() in {"1", "true", "yes", "on"}:
            doctor_profile.profile_picture = None
            update_fields.append("profile_picture")

        for payload_key, model_field in field_map.items():
            if payload_key in payload:
                setattr(doctor_profile, model_field, payload.get(payload_key) or "")
                update_fields.append(model_field)

        if "dateOfBirth" in payload:
            raw_date = (payload.get("dateOfBirth") or "").strip()
            if raw_date:
                try:
                    doctor_profile.date_of_birth = date.fromisoformat(raw_date)
                except ValueError:
                    return Response({"detail": "dateOfBirth must be a valid date in YYYY-MM-DD format."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                doctor_profile.date_of_birth = None
            update_fields.append("date_of_birth")

        if "gender" in payload:
            gender_value = (payload.get("gender") or "").strip()
            if gender_value and gender_value not in {"Male", "Female"}:
                return Response({"detail": "gender must be Male or Female."}, status=status.HTTP_400_BAD_REQUEST)
            doctor_profile.gender = gender_value
            update_fields.append("gender")

        if "address" in payload:
            doctor_profile.address = (payload.get("address") or "").strip()
            update_fields.append("address")

        if "experienceYears" in payload:
            try:
                experience_years = int(payload.get("experienceYears"))
            except (TypeError, ValueError):
                return Response({"detail": "experienceYears must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)

            if experience_years < 0:
                return Response({"detail": "experienceYears cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

            doctor_profile.experience_years = experience_years
            update_fields.append("experience_years")

        if "availabilityForOnlineAdvice" in payload:
            doctor_profile.availability = bool(payload.get("availabilityForOnlineAdvice"))
            update_fields.append("availability")

        profile_image = request.FILES.get("profileImage")
        if profile_image is not None:
            doctor_profile.profile_picture = profile_image
            update_fields.append("profile_picture")

        if update_fields:
            doctor_profile.save(update_fields=sorted(set(update_fields)))

        return self.get(request)

# View for doctors to retrieve a list of their appointments
# with filtering options,
# and to view details of patients who have booked appointments with them.
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


# View for doctors to retrieve detailed profile information about a specific patient
# who has booked an appointment with them, including medical history and past appointments.
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


# View for doctors to retrieve or save a medical record for a specific appointment.
class DoctorAppointmentMedicalRecordView(VerifiedDoctorAPIView):

    def get(self, request, appointment_id):
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response

        appointment = Appointment.objects.filter(
            id=appointment_id,
            doctor=doctor_profile,
        ).select_related('medical_record').first()

        if not appointment:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        record = getattr(appointment, 'medical_record', None)
        payload = PatientMedicalRecordSerializer(record).data if record else None
        return Response({'medicalRecord': payload}, status=status.HTTP_200_OK)

    def post(self, request, appointment_id):
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response

        appointment = Appointment.objects.filter(
            id=appointment_id,
            doctor=doctor_profile,
        ).select_related('patient', 'hospital', 'slot', 'slot__hospital').first()

        if not appointment:
            return Response({'detail': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = PatientMedicalRecordUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated = serializer.validated_data

        hospital_obj = appointment.hospital or (appointment.slot.hospital if appointment.slot else None)
        hospital_name = getattr(hospital_obj, 'name', None) or 'NexClinic'

        doctor_name = (
            doctor_profile.full_name
            or doctor_profile.preferred_name
            or (doctor_profile.user.email if getattr(doctor_profile, 'user', None) else 'Doctor')
        )

        visit_date = appointment.slot.date if appointment.slot and appointment.slot.date else timezone.localdate()

        with transaction.atomic():
            medical_record, created = PatientMedicalRecord.objects.get_or_create(
                appointment=appointment,
                defaults={
                    'patient': appointment.patient,
                    'doctor': doctor_profile,
                    'visit_date': visit_date,
                    'hospital_name': hospital_name,
                    'doctor_name': doctor_name,
                },
            )

            medical_record.patient = appointment.patient
            medical_record.doctor = doctor_profile
            medical_record.visit_date = visit_date
            medical_record.hospital_name = hospital_name
            medical_record.doctor_name = doctor_name

            if 'observations' in validated:
                medical_record.observations = validated.get('observations') or ''
            if 'diagnosis' in validated:
                medical_record.diagnosis = validated.get('diagnosis') or ''
            if 'comments' in validated:
                medical_record.comments = validated.get('comments') or ''
            if 'prescriptions' in validated:
                medical_record.prescriptions = validated.get('prescriptions') or ''
            if 'recommendedTests' in validated:
                medical_record.recommended_tests = validated.get('recommendedTests') or ''
            if 'followUpDate' in validated:
                medical_record.follow_up_date = validated.get('followUpDate')
            if 'followUpNotes' in validated:
                medical_record.follow_up_notes = validated.get('followUpNotes') or ''

            medical_record.save()

        payload = PatientMedicalRecordSerializer(medical_record).data
        return Response(
            {
                'message': 'Medical record saved successfully.',
                'medicalRecord': payload,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

# View for doctors to perform actions on their appointments,
# such as marking them as completed,
# with validation to ensure only valid state transitions are allowed.
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
            'accept': {
                'allowed': {Appointment.Status.PENDING},
                'target': Appointment.Status.ACCEPTED,
                'message': 'Appointment accepted successfully.',
            },
            'reject': {
                'allowed': {Appointment.Status.PENDING, Appointment.Status.ACCEPTED},
                'target': Appointment.Status.REJECTED,
                'message': 'Appointment rejected successfully.',
            },
            'complete': {
                'allowed': {Appointment.Status.ACCEPTED},
                'target': Appointment.Status.COMPLETED,
                'message': 'Appointment marked as completed.',
            },
            'cancel': {
                'allowed': {Appointment.Status.PENDING, Appointment.Status.ACCEPTED},
                'target': Appointment.Status.CANCELLED,
                'message': 'Appointment cancelled successfully.',
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

# View for doctors to reschedule an appointment
# to a different available slot,
# with validation to ensure the appointment can be rescheduled and the target slot is available.
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

# View for doctors to retrieve a list of their available appointment slots,
# and to update the patient limit for a specific slot,
# with validation to ensure the new patient limit is not less than the number of already booked patients.
# Doctors are not allowed to create or delete slots directly.
# Any changes to slots must be done through hospital admins.
# This is to maintain centralized control over slot management and ensure consistency across the hospital's scheduling system.
class DoctorAppointmentSlotsView(VerifiedDoctorAPIView):

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and end_a > start_b

    def get(self, request):
        user = request.user
        doctor_profile, error_response = self._get_verified_doctor_profile_or_response(user)
        if error_response:
            return error_response

        slots = AppointmentAvailableSlot.objects.filter(doctor=doctor_profile)

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        month = request.query_params.get("month")
        week_start = request.query_params.get("week_start")
        start_time_gte = request.query_params.get("start_time_gte")
        start_time_lte = request.query_params.get("start_time_lte")

        if date_from:
            slots = slots.filter(date__gte=date_from)
        if date_to:
            slots = slots.filter(date__lte=date_to)
        if month:
            try:
                month_date = datetime.strptime(month, "%Y-%m").date()
                month_start = month_date.replace(day=1)
                next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
                slots = slots.filter(date__gte=month_start, date__lt=next_month)
            except ValueError:
                return Response(
                    {"detail": "Invalid month format. Use YYYY-MM."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if week_start:
            try:
                week_start_date = datetime.strptime(week_start, "%Y-%m-%d").date()
                week_end_date = week_start_date + timedelta(days=6)
                slots = slots.filter(date__gte=week_start_date, date__lte=week_end_date)
            except ValueError:
                return Response(
                    {"detail": "Invalid week_start format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if start_time_gte:
            slots = slots.filter(start_time__gte=start_time_gte)
        if start_time_lte:
            slots = slots.filter(start_time__lte=start_time_lte)

        slots = slots.order_by('date', 'start_time')
        data = AppointmentAvailableSlotSerializer(slots, many=True).data

        return Response({'slots': data}, status=status.HTTP_200_OK)

    def post(self, request):
        return Response(
            {'detail': 'Doctors cannot create appointment slots. Contact hospital admin.'},
            status=status.HTTP_403_FORBIDDEN
        )

# View for doctors to update the patient limit of a specific appointment slot,
# with validation to ensure the new patient limit is not less than the number of already booked patients,
# and to delete a slot if needed.
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

# View for doctors to retrieve a list of their available online advice slots,
# and to create new online advice slots in bulk,
# with validation to ensure that new slots do not overlap with existing ones,
# and to update or delete existing online advice slots if needed.
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

# View for doctors to update an existing online advice slot,
# with validation to ensure the updated slot does not overlap with other existing slots,
# and to delete an online advice slot if needed.
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

