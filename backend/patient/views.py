from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class PatientProfileView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user

		if getattr(user, "role", None) != "PATIENT":
			return Response({"detail": "Forbidden"}, status=403)

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
