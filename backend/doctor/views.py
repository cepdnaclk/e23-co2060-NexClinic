from collections import defaultdict

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import AppointmentAvailableSlot, DoctorOnlineAdviceAvailability
from .serializers import (
    AppointmentAvailableSlotSerializer,
    BulkAppointmentSlotCreateSerializer,
    AppointmentSlotUpdateSerializer,
    OnlineAdviceAvailabilitySerializer,
    BulkOnlineAdviceSlotCreateSerializer,
    OnlineAdviceSlotUpdateSerializer,
)


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

        upcoming_appointments = [
            {
                "id": "A-201",
                "patientName": "Kasun Madushanka",
                "type": "In-Person Appointment",
                "date": "Today",
                "time": "2:30 PM",
                "status": "Confirmed",
            },
            {
                "id": "A-202",
                "patientName": "Anjali Perera",
                "type": "In-Person Appointment",
                "date": "Today",
                "time": "4:00 PM",
                "status": "Confirmed",
            },
            {
                "id": "A-203",
                "patientName": "Nuwan Silva",
                "type": "In-Person Appointment",
                "date": "Tomorrow",
                "time": "10:00 AM",
                "status": "Pending",
            },
        ]

        recent_chats = [
            {
                "id": "C-101",
                "patientName": "Sanduni Jayasekara",
                "lastMessage": "Doctor, my headache is still there after medication.",
                "time": "5 min ago",
                "unreadCount": 2,
            },
            {
                "id": "C-102",
                "patientName": "Tharaka Fernando",
                "lastMessage": "Thank you doctor, I will follow your advice.",
                "time": "32 min ago",
                "unreadCount": 0,
            },
            {
                "id": "C-103",
                "patientName": "Iresha Perera",
                "lastMessage": "Can I get a quick follow-up appointment today?",
                "time": "1 hour ago",
                "unreadCount": 1,
            },
        ]

        unread_chats = sum(chat["unreadCount"] for chat in recent_chats)

        data = {
            "doctor": {
                "displayName": display_name,
                "email": user.email,
                "specialization": specialization,
            },
            "stats": {
                "todayAppointments": len([a for a in upcoming_appointments if a["date"] == "Today"]),
                "unreadChats": unread_chats,
                "monthEarnings": 98500,
                "onlineAdviceSessions": 26,
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
                "chatFee": 500,
                "appointmentFee": 3000,
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


class DoctorAppointmentSlotsView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _is_doctor(user):
        return getattr(user, 'role', None) == 'DOCTOR'

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and end_a > start_b

    def get(self, request):
        user = request.user

        if not self._is_doctor(user):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        doctor_profile = getattr(user, 'doctor_profile', None)
        if not doctor_profile:
            return Response({'detail': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        slots = AppointmentAvailableSlot.objects.filter(doctor=doctor_profile).order_by('date', 'start_time')
        data = AppointmentAvailableSlotSerializer(slots, many=True).data

        return Response({'slots': data}, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user

        if not self._is_doctor(user):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        doctor_profile = getattr(user, 'doctor_profile', None)
        if not doctor_profile:
            return Response({'detail': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = BulkAppointmentSlotCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        requested_slots = serializer.validated_data['slots']
        dates = {slot['date'] for slot in requested_slots}

        existing_slots = AppointmentAvailableSlot.objects.filter(
            doctor=doctor_profile,
            date__in=dates,
        ).order_by('date', 'start_time')

        intervals_by_date = defaultdict(list)
        for existing in existing_slots:
            intervals_by_date[existing.date].append((existing.start_time, existing.end_time))

        objects_to_create = []
        conflicts = []

        for idx, slot in enumerate(requested_slots):
            date_value = slot['date']
            start_time = slot['start_time']
            end_time = slot['end_time']

            has_overlap = any(
                self._overlaps(start_time, end_time, existing_start, existing_end)
                for existing_start, existing_end in intervals_by_date[date_value]
            )

            if has_overlap:
                conflicts.append(
                    {
                        'index': idx,
                        'date': str(date_value),
                        'start_time': start_time.strftime('%H:%M:%S'),
                        'end_time': end_time.strftime('%H:%M:%S'),
                        'error': 'Overlaps with an existing slot.',
                    }
                )
                continue

            intervals_by_date[date_value].append((start_time, end_time))
            objects_to_create.append(
                AppointmentAvailableSlot(
                    doctor=doctor_profile,
                    date=date_value,
                    day_of_week=slot['day_of_week'],
                    start_time=start_time,
                    end_time=end_time,
                )
            )

        if conflicts:
            return Response(
                {'detail': 'Some slots could not be created.', 'conflicts': conflicts},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = AppointmentAvailableSlot.objects.bulk_create(objects_to_create)
        created_data = AppointmentAvailableSlotSerializer(created, many=True).data

        return Response(
            {
                'message': f'{len(created)} appointment slots created successfully.',
                'slots': created_data,
            },
            status=status.HTTP_201_CREATED,
        )


class DoctorAppointmentSlotDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _is_doctor(user):
        return getattr(user, 'role', None) == 'DOCTOR'

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and end_a > start_b

    def patch(self, request, slot_id):
        user = request.user

        if not self._is_doctor(user):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        doctor_profile = getattr(user, 'doctor_profile', None)
        if not doctor_profile:
            return Response({'detail': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        slot = AppointmentAvailableSlot.objects.filter(id=slot_id, doctor=doctor_profile).first()
        if not slot:
            return Response({'detail': 'Appointment slot not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = AppointmentSlotUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        date_value = serializer.validated_data.get('date', slot.date)
        start_time = serializer.validated_data.get('start_time', slot.start_time)
        end_time = serializer.validated_data.get('end_time', slot.end_time)

        if start_time >= end_time:
            return Response(
                {'detail': 'start_time must be before end_time.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        overlapping = AppointmentAvailableSlot.objects.filter(
            doctor=doctor_profile,
            date=date_value,
        ).exclude(id=slot.id)

        has_overlap = any(
            self._overlaps(start_time, end_time, existing.start_time, existing.end_time)
            for existing in overlapping
        )
        if has_overlap:
            return Response(
                {'detail': 'Updated slot overlaps with an existing appointment slot.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        slot.date = date_value
        slot.day_of_week = date_value.strftime('%A')
        slot.start_time = start_time
        slot.end_time = end_time
        slot.save(update_fields=['date', 'day_of_week', 'start_time', 'end_time'])

        return Response(
            {
                'message': 'Appointment slot updated successfully.',
                'slot': AppointmentAvailableSlotSerializer(slot).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, slot_id):
        user = request.user

        if not self._is_doctor(user):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        doctor_profile = getattr(user, 'doctor_profile', None)
        if not doctor_profile:
            return Response({'detail': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        slot = AppointmentAvailableSlot.objects.filter(id=slot_id, doctor=doctor_profile).first()
        if not slot:
            return Response({'detail': 'Appointment slot not found.'}, status=status.HTTP_404_NOT_FOUND)

        slot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DoctorOnlineAdviceSlotsView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _is_doctor(user):
        return getattr(user, 'role', None) == 'DOCTOR'

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and end_a > start_b

    def get(self, request):
        user = request.user

        if not self._is_doctor(user):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        doctor_profile = getattr(user, 'doctor_profile', None)
        if not doctor_profile:
            return Response({'detail': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        slots = DoctorOnlineAdviceAvailability.objects.filter(doctor=doctor_profile).order_by('day_of_week', 'start_time')
        data = OnlineAdviceAvailabilitySerializer(slots, many=True).data

        return Response({'slots': data}, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user

        if not self._is_doctor(user):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        doctor_profile = getattr(user, 'doctor_profile', None)
        if not doctor_profile:
            return Response({'detail': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

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


class DoctorOnlineAdviceSlotDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _is_doctor(user):
        return getattr(user, 'role', None) == 'DOCTOR'

    @staticmethod
    def _overlaps(start_a, end_a, start_b, end_b):
        return start_a < end_b and end_a > start_b

    def patch(self, request, slot_id):
        user = request.user

        if not self._is_doctor(user):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        doctor_profile = getattr(user, 'doctor_profile', None)
        if not doctor_profile:
            return Response({'detail': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

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

        if not self._is_doctor(user):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        doctor_profile = getattr(user, 'doctor_profile', None)
        if not doctor_profile:
            return Response({'detail': 'Doctor profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        slot = DoctorOnlineAdviceAvailability.objects.filter(id=slot_id, doctor=doctor_profile).first()
        if not slot:
            return Response({'detail': 'Online advice slot not found.'}, status=status.HTTP_404_NOT_FOUND)

        slot.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
