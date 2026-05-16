from django.db import transaction
from django.db import ProgrammingError

from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from doctor.models import (
    Appointment,
    AppointmentAvailableSlot,
)
from hospital.models import Hospital

from .serializers import (
    PatientAppointmentSerializer,
    PatientAppointmentCreateSerializer,
    PatientAvailableSlotSerializer,
    PatientAppointmentCancelSerializer,
    PatientProfileUpdateSerializer,
    is_slot_in_past,
)


class BasePatientAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _is_patient(user):
        return getattr(user, "role", None) == "PATIENT"

    def _get_patient_profile_or_response(self, request):
        if not self._is_patient(request.user):
            return None, Response(
                {"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN
            )

        try:
            patient_profile = getattr(request.user, "patient_profile", None)
        except ProgrammingError:
            # Database schema might be out of sync (missing column). Return a clear error
            return None, Response(
                {"detail": "Server database schema out of sync. Run migrations."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        if not patient_profile:
            return None, Response(
                {"detail": "Patient profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return patient_profile, None


class PatientProfileView(BasePatientAPIView):
    @staticmethod
    def _build_profile_image_url(request, patient_profile):
        if not patient_profile or not patient_profile.profile_picture:
            return ""

        return request.build_absolute_uri(patient_profile.profile_picture.url)

    @staticmethod
    def _build_profile_response(request, user, patient_profile):
        full_name = user.email
        date_of_birth = ""
        gender = ""
        phone = ""
        address = ""
        city = ""
        postal_code = ""
        country = ""
        blood_type = ""
        allergies = ""
        medications = ""
        medical_history = ""
        emergency_contact_name = ""
        emergency_contact_phone = ""
        emergency_contact_relation = ""
        insurance_provider = ""
        insurance_policy_number = ""

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
            city = patient_profile.city or ""
            postal_code = patient_profile.postal_code or ""
            country = patient_profile.country or ""
            blood_type = patient_profile.blood_type or ""
            allergies = patient_profile.allergies or ""
            medications = patient_profile.medications or ""
            medical_history = patient_profile.medical_history or ""
            emergency_contact_name = patient_profile.emergency_contact_name or ""
            emergency_contact_phone = patient_profile.emergency_contact_phone or ""
            emergency_contact_relation = (
                patient_profile.emergency_contact_relation or ""
            )
            insurance_provider = patient_profile.insurance_provider or ""
            insurance_policy_number = patient_profile.insurance_policy_number or ""

        return {
            "patient": {
                "fullName": full_name,
                "email": user.email,
                "phone": phone,
                "dateOfBirth": date_of_birth,
                "gender": gender,
                "address": address,
                "city": city,
                "postalCode": postal_code,
                "country": country,
                "profileImage": PatientProfileView._build_profile_image_url(
                    request, patient_profile
                ),
            },
            "health": {
                "bloodType": blood_type,
                "allergies": allergies,
                "medications": medications,
                "medicalHistory": medical_history,
            },
            "emergencyContact": {
                "name": emergency_contact_name,
                "phone": emergency_contact_phone,
                "relation": emergency_contact_relation,
            },
            "insurance": {
                "provider": insurance_provider,
                "policyNumber": insurance_policy_number,
            },
        }

    def get(self, request):
        user = request.user

        if not self._is_patient(user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        patient_profile = getattr(user, "patient_profile", None)
        return Response(self._build_profile_response(request, user, patient_profile))

    def patch(self, request):
        patient_profile, error_response = self._get_patient_profile_or_response(request)
        if error_response:
            return error_response

        serializer = PatientProfileUpdateSerializer(
            instance=patient_profile,
            data=request.data,
            partial=True,
            context={"patient_profile": patient_profile},
        )
        serializer.is_valid(raise_exception=True)
        updated_profile = serializer.save()

        return Response(
            self._build_profile_response(request, request.user, updated_profile),
            status=status.HTTP_200_OK,
        )


class PatientAvailableAppointmentSlotsView(BasePatientAPIView):
    def get(self, request):
        patient_profile, error_response = self._get_patient_profile_or_response(request)
        if error_response:
            return error_response

        today = timezone.localdate()
        window_end = today + timedelta(days=13)

        slots = (
            AppointmentAvailableSlot.objects.filter(
                date__gte=today,
                date__lte=window_end,
                is_active=True,
            )
            .select_related("doctor", "doctor__user")
            .order_by("date", "start_time")
        )

        doctor_id = request.query_params.get("doctor_id")
        if doctor_id:
            try:
                slots = slots.filter(doctor_id=int(doctor_id))
            except ValueError:
                return Response(
                    {"detail": "Invalid doctor_id."}, status=status.HTTP_400_BAD_REQUEST
                )

        date_param = request.query_params.get("date")
        if date_param:
            try:
                selected_date = timezone.datetime.strptime(
                    date_param, "%Y-%m-%d"
                ).date()
            except ValueError:
                return Response(
                    {"detail": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            slots = slots.filter(date=selected_date)

        start_param = request.query_params.get("start")
        if start_param:
            try:
                start_date = timezone.datetime.strptime(start_param, "%Y-%m-%d").date()
                slots = slots.filter(date__gte=start_date)
            except ValueError:
                return Response(
                    {"detail": "Invalid start format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        end_param = request.query_params.get("end")
        if end_param:
            try:
                end_date = timezone.datetime.strptime(end_param, "%Y-%m-%d").date()
                slots = slots.filter(date__lte=end_date)
            except ValueError:
                return Response(
                    {"detail": "Invalid end format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        data = PatientAvailableSlotSerializer(slots, many=True).data
        return Response({"slots": data}, status=status.HTTP_200_OK)


class PatientAppointmentsView(BasePatientAPIView):
    def get(self, request):
        patient_profile, error_response = self._get_patient_profile_or_response(request)
        if error_response:
            return error_response

        queryset = (
            Appointment.objects.filter(patient=patient_profile)
            .select_related("slot", "doctor", "doctor__user")
            .order_by("-requested_at")
        )

        status_filter = request.query_params.get("status")
        if status_filter:
            normalized = status_filter.strip().upper()
            valid_statuses = {choice[0] for choice in Appointment.Status.choices}
            if normalized not in valid_statuses:
                return Response(
                    {"detail": "Invalid status filter."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(status=normalized)

        data = PatientAppointmentSerializer(queryset, many=True).data
        return Response({"appointments": data}, status=status.HTTP_200_OK)

    def post(self, request):
        patient_profile, error_response = self._get_patient_profile_or_response(request)
        if error_response:
            return error_response

        serializer = PatientAppointmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        slot_id = serializer.validated_data["slot_id"]
        reason = serializer.validated_data.get("reason", "")

        with transaction.atomic():
            slot = (
                AppointmentAvailableSlot.objects.select_for_update()
                .select_related("doctor")
                .filter(id=slot_id)
                .first()
            )
            if not slot:
                return Response(
                    {"detail": "Appointment slot not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if not slot.is_active:
                return Response(
                    {"detail": "This slot is not active."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if is_slot_in_past(slot):
                return Response(
                    {"detail": "Cannot book an appointment in the past."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Prevent duplicate active booking by same patient for same slot
            existing = Appointment.objects.filter(
                slot=slot,
                patient=patient_profile,
                status__in=[Appointment.Status.PENDING, Appointment.Status.ACCEPTED],
            ).exists()
            if existing:
                return Response(
                    {"detail": "You already have an active appointment for this slot."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            current_booked = (
                slot.booked_count
                if slot.booked_count is not None
                else slot.appointments.count()
            )
            if current_booked >= slot.patient_limit:
                return Response(
                    {"detail": "This slot is full."}, status=status.HTTP_400_BAD_REQUEST
                )

            appointment = Appointment.objects.create(
                slot=slot,
                doctor=slot.doctor,
                patient=patient_profile,
                reason=reason,
                status=Appointment.Status.ACCEPTED,  # auto-accepted
                hospital=Hospital.objects.filter(name=slot.hospital).first(),
            )

            slot.booked_count = current_booked + 1
            slot.remaining_count = max(slot.patient_limit - slot.booked_count, 0)
            slot.save(update_fields=["booked_count", "remaining_count"])

        payload = PatientAppointmentSerializer(appointment).data
        return Response(
            {"message": "Appointment booked successfully.", "appointment": payload},
            status=status.HTTP_201_CREATED,
        )


class PatientAppointmentCancelView(BasePatientAPIView):
    def patch(self, request, appointment_id):
        patient_profile, error_response = self._get_patient_profile_or_response(request)
        if error_response:
            return error_response

        appointment = (
            Appointment.objects.filter(
                id=appointment_id,
                patient=patient_profile,
            )
            .select_related("slot", "doctor", "doctor__user")
            .first()
        )

        if not appointment:
            return Response(
                {"detail": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND
            )

        if appointment.status not in {
            Appointment.Status.PENDING,
            Appointment.Status.ACCEPTED,
        }:
            return Response(
                {
                    "detail": f"Cannot cancel an appointment in {appointment.status} state."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cancel_serializer = PatientAppointmentCancelSerializer(data=request.data)
        cancel_serializer.is_valid(raise_exception=True)
        cancel_reason = cancel_serializer.validated_data["reason"]

        deadline = appointment.requested_at + timedelta(hours=24)
        if timezone.now() > deadline:
            return Response(
                {"detail": "You can cancel only within 24 hours from booking time."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            locked_slot = (
                AppointmentAvailableSlot.objects.select_for_update()
                .filter(id=appointment.slot_id)
                .first()
            )

            appointment.status = Appointment.Status.CANCELLED
            appointment.cancelled_by = "PATIENT"
            appointment.cancellation_reason = cancel_reason
            appointment.cancelled_at = timezone.now()
            appointment.save(
                update_fields=[
                    "status",
                    "cancelled_by",
                    "cancellation_reason",
                    "cancelled_at",
                    "updated_at",
                ]
            )

            if locked_slot and locked_slot.booked_count > 0:
                locked_slot.booked_count -= 1
                locked_slot.remaining_count = max(
                    locked_slot.patient_limit - locked_slot.booked_count, 0
                )
                locked_slot.save(update_fields=["booked_count", "remaining_count"])

        payload = PatientAppointmentSerializer(appointment).data
        return Response(
            {"message": "Appointment cancelled successfully.", "appointment": payload},
            status=status.HTTP_200_OK,
        )
