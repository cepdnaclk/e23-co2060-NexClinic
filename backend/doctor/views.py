from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


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

        if doctor_profile:
            full_name = doctor_profile.full_name or user.email
            preferred_name = doctor_profile.preferred_name or "Dr."
            specialization = doctor_profile.specialization or "General"
            phone = doctor_profile.phone or ""
            license_number = doctor_profile.license_number or ""
            is_verified = bool(doctor_profile.is_verified)

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
                "experience": "12 years of experience",
                "location": "Not specified",
                "chatFee": 500,
                "appointmentFee": 3000,
                "availabilityForOnlineAdvice": False,
                "onlineAdviceSchedule": [
                    "Monday, 2:00 PM - 5:00 PM",
                    "Tuesday, 10:00 AM - 1:00 PM",
                    "Thursday, 3:00 PM - 6:00 PM",
                    "Friday, 11:00 AM - 2:00 PM",
                ],
                "qualifications": ["MBBS", "MD (Cardiology)"],
                "hospitals": ["General Hospital"],
                "languages": ["Sinhala", "English"],
            },
        }

        return Response(data)
