from django.db import transaction
from django.db import ProgrammingError

from django.utils import timezone
from datetime import timedelta
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, F, Q

from doctor.models import (
    Appointment,
    AppointmentAvailableSlot,
)
from chat.models import AdviceChatThread
from hospital.models import DoctorHospitalVerification

from .serializers import (
    PatientAppointmentSerializer,
    PatientAppointmentCreateSerializer,
    PatientAvailableSlotSerializer,
    PatientAppointmentCancelSerializer,
    PatientMedicalRecordSerializer,
    PatientProfileUpdateSerializer,
    PatientMedicationSerializer,
    is_slot_in_past,
)
from .models import PatientMedication, Prescription


class BasePatientAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _is_patient(user):
        return getattr(user, "role", None) == "PATIENT"

    def _get_patient_profile_or_response(self, request, allow_missing_profile=False):
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
            if allow_missing_profile:
                return None, None
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
    def _build_file_url(request, file_field):
        if not file_field:
            return ""

        return request.build_absolute_uri(file_field.url)

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
        doctor_comments = ""
        prescriptions = ""
        medical_records = []
        emergency_contact_name = ""
        emergency_contact_phone = ""
        emergency_contact_relation = ""
        emergency_contact_email = ""
        insurance_provider = ""
        insurance_policy_number = ""
        medical_reports = ""
        medical_documents = ""

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
            doctor_comments = patient_profile.doctor_comments or ""
            prescriptions = patient_profile.prescriptions or ""
            records_queryset = patient_profile.medical_records.select_related(
                "doctor",
                "appointment",
                "appointment__slot",
                "appointment__slot__hospital",
            ).order_by("-visit_date", "-created_at")
            medical_records = PatientMedicalRecordSerializer(
                records_queryset, many=True
            ).data
            emergency_contact_name = patient_profile.emergency_contact_name or ""
            emergency_contact_phone = patient_profile.emergency_contact_phone or ""
            emergency_contact_relation = (
                patient_profile.emergency_contact_relation or ""
            )
            emergency_contact_email = patient_profile.emergency_contact_email or ""
            insurance_provider = patient_profile.insurance_provider or ""
            insurance_policy_number = patient_profile.insurance_policy_number or ""
            medical_reports = PatientProfileView._build_file_url(
                request, patient_profile.medical_reports
            )
            medical_documents = PatientProfileView._build_file_url(
                request, patient_profile.medical_documents
            )

        chat_threads = (
            AdviceChatThread.objects.filter(patient=patient_profile).select_related(
                "doctor"
            )
            if patient_profile
            else AdviceChatThread.objects.none()
        )
        unread_chat_count = 0
        recent_chat_threads = []
        if patient_profile:
            for thread in chat_threads.order_by("-last_message_at", "-started_at")[:5]:
                unread_count = (
                    thread.messages.exclude(sender_user=user)
                    .filter(is_read=False)
                    .count()
                )
                unread_chat_count += unread_count
                last_message = thread.messages.order_by("-sent_at", "-id").first()
                recent_chat_threads.append(
                    {
                        "id": str(thread.id),
                        "doctorName": thread.doctor.full_name
                        or thread.doctor.preferred_name
                        or "Doctor",
                        "lastMessage": (
                            last_message.message_text if last_message else ""
                        ),
                        "unreadCount": unread_count,
                        "time": (
                            thread.last_message_at.strftime("%b %d, %I:%M %p")
                            if thread.last_message_at
                            else thread.started_at.strftime("%b %d, %I:%M %p")
                        ),
                    }
                )

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
                "comments": doctor_comments,
                "prescriptions": prescriptions,
                "medicalRecords": medical_records,
                "medicalReports": medical_reports,
                "medicalDocuments": medical_documents,
            },
            "emergencyContact": {
                "name": emergency_contact_name,
                "phone": emergency_contact_phone,
                "relation": emergency_contact_relation,
                "email": emergency_contact_email,
            },
            "insurance": {
                "provider": insurance_provider,
                "policyNumber": insurance_policy_number,
            },
            "chatSummary": {
                "unreadChats": unread_chat_count,
                "recentChats": recent_chat_threads,
            },
        }

    def get(self, request):
        user = request.user

        if not self._is_patient(user):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        patient_profile, error_response = self._get_patient_profile_or_response(
            request, allow_missing_profile=True
        )
        if error_response:
            return error_response

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
        # Debugging: log incoming request content type and data keys to trace 400 causes
        try:
            print("Patient profile PATCH content-type:", request.content_type)
            # request.data may be an immutable dict; list keys for readability
            try:
                keys = (
                    list(request.data.keys()) if hasattr(request.data, "keys") else []
                )
            except Exception:
                keys = []
            print("Patient profile PATCH data keys:", keys)
            try:
                file_keys = (
                    list(request.FILES.keys()) if hasattr(request, "FILES") else []
                )
            except Exception:
                file_keys = []
            print("Patient profile PATCH file keys:", file_keys)
        except Exception as _:
            pass
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as ve:
            # Log validation details for debugging and return them in response
            try:
                print("Patient profile update validation error:", ve.detail)
            except Exception:
                print("Patient profile update validation error (non-serializable)")
            return Response(ve.detail, status=status.HTTP_400_BAD_REQUEST)

        try:
            updated_profile = serializer.save()
        except Exception as exc:
            print("Patient profile update save error:", repr(exc))
            return Response(
                {"detail": "Internal server error while saving profile."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            self._build_profile_response(request, request.user, updated_profile),
            status=status.HTTP_200_OK,
        )


class PatientAvailableAppointmentSlotsView(BasePatientAPIView):
    def get(self, request):
        patient_profile, error_response = self._get_patient_profile_or_response(
            request, allow_missing_profile=True
        )
        if error_response:
            return error_response

        if not patient_profile:
            return Response({"appointments": []}, status=status.HTTP_200_OK)

        today = timezone.localdate()
        window_end = today + timedelta(days=90)

        slots = (
            AppointmentAvailableSlot.objects.filter(
                date__gte=today,
                date__lte=window_end,
                is_active=True,
            )
            .select_related("doctor", "doctor__user", "hospital")
            .filter(
                doctor__hospital_app_verifications__hospital_id=F("hospital_id"),
                doctor__hospital_app_verifications__status=DoctorHospitalVerification.Status.VERIFIED,
            )
            .annotate(
                active_booking_count=Count(
                    "appointments",
                    filter=Q(
                        appointments__status__in=[
                            Appointment.Status.PENDING,
                            Appointment.Status.ACCEPTED,
                        ]
                    ),
                )
            )
            .filter(active_booking_count__lt=F("patient_limit"))
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
        patient_profile, error_response = self._get_patient_profile_or_response(
            request, allow_missing_profile=True
        )
        if error_response:
            return error_response

        if not patient_profile:
            return Response({"appointments": []}, status=status.HTTP_200_OK)

        queryset = (
            Appointment.objects.filter(patient=patient_profile)
            .select_related("slot", "slot__hospital", "doctor", "doctor__user")
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

            # Ensure the doctor is verified for the hospital where this slot is offered
            if not DoctorHospitalVerification.objects.filter(
                doctor=slot.doctor,
                hospital_id=slot.hospital_id,
                status=DoctorHospitalVerification.Status.VERIFIED,
            ).exists():
                return Response(
                    {"detail": "Doctor is not verified for this hospital."},
                    status=status.HTTP_400_BAD_REQUEST,
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

            current_booked = slot.appointments.filter(
                status__in=[
                    Appointment.Status.PENDING,
                    Appointment.Status.ACCEPTED,
                ]
            ).count()
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
                hospital=slot.hospital,
                appointment_fee=slot.doctor.appointment_fee,
            )

            import uuid
            
            # Auto-activate a free AdviceChatThread for the patient
            # Expiring 24 hours from the time of booking
            expires_at = timezone.now() + timedelta(days=1)
            
            thread, created = AdviceChatThread.objects.get_or_create(
                patient=patient_profile,
                doctor=slot.doctor,
                defaults={
                    "thread_code": f"CHAT{uuid.uuid4().hex[:12].upper()}",
                    "expires_at": expires_at,
                    "is_active": True,
                    "status": AdviceChatThread.Status.OPEN,
                }
            )
            
            if not created:
                thread.expires_at = max(thread.expires_at or expires_at, expires_at)
                thread.is_active = True
                if thread.status == AdviceChatThread.Status.CLOSED:
                    thread.status = AdviceChatThread.Status.OPEN
                thread.save()

            # Appointment's post-save signal refreshes both counters from the
            # authoritative set of active bookings.

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


class PatientMedicationsView(BasePatientAPIView):
    def get(self, request, *args, **kwargs):
        patient_profile, error_response = self._get_patient_profile_or_response(request)
        if error_response:
            return error_response

        medications = PatientMedication.objects.filter(patient=patient_profile)
        serializer = PatientMedicationSerializer(medications, many=True)
        meds_data = list(serializer.data)
        
        prescriptions = Prescription.objects.filter(patient=patient_profile).select_related('doctor')
        for p in prescriptions:
            dosage_str = ""
            if p.amount is not None:
                amount_str = f"{p.amount:f}".rstrip("0").rstrip(".") if "." in f"{p.amount:f}" else str(p.amount)
                dosage_str = f"{amount_str} {p.unit}".strip()
            elif p.unit:
                dosage_str = p.unit
                
            meds_data.append({
                "id": f"prescription_{p.id}",
                "name": p.medicine_name,
                "dosage": dosage_str,
                "frequency": p.frequency,
                "duration": p.duration,
                "prescribing_doctor": p.doctor.full_name if p.doctor else "",
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "is_prescription": True,
            })
            
        return Response({"medications": meds_data})

    def post(self, request, *args, **kwargs):
        patient_profile, error_response = self._get_patient_profile_or_response(request)
        if error_response:
            return error_response

        serializer = PatientMedicationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(patient=patient_profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientMedicationDetailView(BasePatientAPIView):
    def delete(self, request, medication_id, *args, **kwargs):
        patient_profile, error_response = self._get_patient_profile_or_response(request)
        if error_response:
            return error_response

        try:
            medication = PatientMedication.objects.get(id=medication_id, patient=patient_profile)
            medication.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PatientMedication.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
