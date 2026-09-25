from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from users.models import CustomUser
from patient.models import PatientProfile
from doctor.models import DoctorProfile, AppointmentAvailableSlot, Appointment
from hospital.models import Hospital, HospitalAdmin, DoctorHospitalVerification


class E2EPrescriptionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Setup Patient
        self.patient_user = CustomUser.objects.create_user(
            email="patient.e2e@example.com",
            password="pass",
            role=CustomUser.Role.PATIENT,
        )
        self.patient_profile = PatientProfile.objects.create(
            user=self.patient_user,
            full_name="Patient E2E",
            date_of_birth=timezone.localdate() - timedelta(days=365 * 30),
            gender="male",
            phone="1234567890",
            address="123 Patient St",
        )

        # 2. Setup Doctor
        self.doctor_user = CustomUser.objects.create_user(
            email="doctor.e2e@example.com",
            password="pass",
            role=CustomUser.Role.DOCTOR,
        )
        self.doctor_profile = DoctorProfile.objects.create(
            user=self.doctor_user,
            full_name="Doctor E2E",
            specialization="General",
            gender="female",
            phone="0987654321",
            address="456 Doctor Ave",
            license_number="SLMC12345",
            is_verified=True,
        )

        # 3. Setup Hospital and Verification
        self.hospital_admin_user = CustomUser.objects.create_user(
            email="admin.e2e@example.com",
            password="pass",
            role=CustomUser.Role.HOSPITAL_ADMIN,
        )
        self.hospital = Hospital.objects.create(
            name="E2E Hospital",
            address="789 Hospital Rd",
            contact_numbers="1112223333",
            email="hospital@example.com",
        )
        HospitalAdmin.objects.create(
            user=self.hospital_admin_user,
            hospital=self.hospital,
            is_active=True,
        )
        DoctorHospitalVerification.objects.create(
            doctor=self.doctor_profile,
            hospital=self.hospital,
            status=DoctorHospitalVerification.Status.VERIFIED,
            verified_by=self.hospital_admin_user,
            verified_at=timezone.now(),
        )

        # 4. Create an Appointment Slot (Tomorrow)
        tomorrow = timezone.localdate() + timedelta(days=1)
        self.slot = AppointmentAvailableSlot.objects.create(
            doctor=self.doctor_profile,
            hospital=self.hospital,
            date=tomorrow,
            date_start=timezone.now() + timedelta(days=1),
            date_end=timezone.now() + timedelta(days=1, hours=1),
            start_time=(timezone.now() + timedelta(days=1)).time(),
            end_time=(timezone.now() + timedelta(days=1, hours=1)).time(),
            patient_limit=5,
            created_by=self.doctor_user,
            is_active=True,
        )

    def test_end_to_end_prescription_flow(self):
        # Step 1: Patient books the appointment
        self.client.force_authenticate(user=self.patient_user)
        book_response = self.client.post(
            "/api/patient/appointments/",
            {"slot_id": self.slot.id, "reason": "General Checkup"},
            format="json",
        )
        self.assertEqual(book_response.status_code, status.HTTP_201_CREATED)
        appointment_id = book_response.json()["appointment"]["id"]

        # Step 2: Doctor submits a medical record with prescriptions
        self.client.force_authenticate(user=self.doctor_user)
        prescriptions_text = "Amoxicillin 500mg, 3 times a day for 5 days."
        record_payload = {
            "observations": "Patient has mild fever.",
            "diagnosis": "Viral Infection",
            "prescriptions": prescriptions_text,
            "recommendedTests": "Blood Test",
        }
        record_response = self.client.post(
            f"/api/doctor/appointments/{appointment_id}/medical-record/",
            record_payload,
            format="json",
        )
        self.assertIn(record_response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])

        # Step 3: Patient checks their profile and verifies prescriptions are perfectly stored
        self.client.force_authenticate(user=self.patient_user)
        profile_response = self.client.get("/api/patient/profile/")
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        
        data = profile_response.json()
        medical_records = data.get("health", {}).get("medicalRecords", [])
        
        self.assertEqual(len(medical_records), 1)
        patient_record = medical_records[0]
        self.assertEqual(patient_record["prescriptions"], prescriptions_text)
        self.assertEqual(patient_record["diagnosis"], "Viral Infection")

    def test_structured_prescription_and_medications_unification_flow(self):
        # 1. Patient books appointment
        self.client.force_authenticate(user=self.patient_user)
        book_response = self.client.post(
            "/api/patient/appointments/",
            {"slot_id": self.slot.id, "reason": "Severe Cough"},
            format="json",
        )
        self.assertEqual(book_response.status_code, status.HTTP_201_CREATED)
        appointment_id = book_response.json()["appointment"]["id"]

        # 2. Patient creates a self-added medication
        add_med_response = self.client.post(
            "/api/patient/medications/",
            {
                "name": "Vitamin C",
                "dosage": "1000mg",
                "frequency": "Once daily",
                "duration": "30 days",
                "prescribing_doctor": "Dr. Self",
            },
            format="json",
        )
        self.assertEqual(add_med_response.status_code, status.HTTP_201_CREATED)
        self_med_id = add_med_response.json()["id"]

        # 3. Doctor submits structured prescriptions
        self.client.force_authenticate(user=self.doctor_user)
        record_payload = {
            "observations": "Clear symptoms of bronchitis.",
            "diagnosis": "Acute Bronchitis",
            "prescriptions": "Amoxicillin | Amount: 500 | Unit: mg | Duration: 5 days | Frequency: Twice daily | Timing: After meals | Notes: Drink plenty of water",
            "prescriptionItems": [
                {
                    "name": "Amoxicillin",
                    "amount": 500.0,
                    "unit": "mg",
                    "duration": "5 days",
                    "frequency": "Twice daily",
                    "timings": ["After meals"],
                    "notes": "Drink plenty of water",
                }
            ],
            "recommendedTests": "Chest X-Ray",
        }
        record_response = self.client.post(
            f"/api/doctor/appointments/{appointment_id}/medical-record/",
            record_payload,
            format="json",
        )
        self.assertIn(record_response.status_code, [status.HTTP_201_CREATED, status.HTTP_200_OK])

        # 4. Patient fetches their unified medications list
        self.client.force_authenticate(user=self.patient_user)
        meds_response = self.client.get("/api/patient/medications/")
        self.assertEqual(meds_response.status_code, status.HTTP_200_OK)
        
        meds_data = meds_response.json()["medications"]
        # Should have 2 items: 1 self-added, 1 doctor prescription
        self.assertEqual(len(meds_data), 2)
        
        # Verify self-added medication properties
        self_med = next(m for m in meds_data if m["id"] == self_med_id)
        self.assertEqual(self_med["name"], "Vitamin C")
        self.assertEqual(self_med.get("is_prescription"), None)
        
        # Verify doctor-prescribed medication properties
        pres_med = next(m for m in meds_data if str(m["id"]).startswith("prescription_"))
        self.assertEqual(pres_med["name"], "Amoxicillin")
        self.assertEqual(pres_med["dosage"], "500 mg")
        self.assertEqual(pres_med["is_prescription"], True)
        self.assertEqual(pres_med["prescribing_doctor"], "Doctor E2E (General)")

        # 5. Verify patient cannot delete the official prescription (returns 404, no 500 error)
        del_pres_response = self.client.delete(f"/api/patient/medications/{pres_med['id']}/")
        self.assertEqual(del_pres_response.status_code, status.HTTP_404_NOT_FOUND)

        # 6. Verify patient can delete their own self-added medication
        del_self_response = self.client.delete(f"/api/patient/medications/{self_med_id}/")
        self.assertEqual(del_self_response.status_code, status.HTTP_204_NO_CONTENT)

    def test_doctor_cannot_prescribe_on_cancelled_appointment(self):
        # 1. Patient books appointment
        self.client.force_authenticate(user=self.patient_user)
        book_response = self.client.post(
            "/api/patient/appointments/",
            {"slot_id": self.slot.id, "reason": "Checkup"},
            format="json",
        )
        self.assertEqual(book_response.status_code, status.HTTP_201_CREATED)
        appointment_id = book_response.json()["appointment"]["id"]

        # 2. Patient cancels the appointment
        cancel_response = self.client.patch(
            f"/api/patient/appointments/{appointment_id}/cancel/",
            {"reason": "Changed my mind"},
            format="json",
        )
        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)

        # 3. Doctor attempts to submit a medical record / prescription
        self.client.force_authenticate(user=self.doctor_user)
        record_payload = {
            "observations": "Should not be allowed.",
            "diagnosis": "N/A",
            "prescriptions": "None",
        }
        record_response = self.client.post(
            f"/api/doctor/appointments/{appointment_id}/medical-record/",
            record_payload,
            format="json",
        )
        self.assertEqual(record_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Cannot write a prescription", record_response.json()["detail"])

