// frontend/src/data/patients.ts
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: string;
  city: string;
  postalCode: string;
  country: string;
  bloodType: string;
  allergies: string;
  medications: string;
  medicalReports: string;
  medicalDocuments: string;
  medicalHistory: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  emergencyContactEmail: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  profileImage?: string;
  lastUpdated?: string;
}

// Sample patient data
const patients: Patient[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    dateOfBirth: "1990-05-15",
    gender: "male",
    address: "123 Main Street",
    city: "New York",
    postalCode: "10001",
    country: "United States",
    bloodType: "O+",
    allergies: "Penicillin, Shellfish",
    medications: "Metformin, Lisinopril",
    medicalReports: "",
    medicalDocuments: "",
    medicalHistory: "Type 2 Diabetes, Hypertension",
    emergencyContactName: "Jane Doe",
    emergencyContactPhone: "+1 (555) 123-4568",
    emergencyContactRelation: "Spouse",
    emergencyContactEmail: "jane.doe@example.com",
    insuranceProvider: "Blue Cross",
    insurancePolicyNumber: "BC123456789",
    profileImage: "/images/user-profile-default.png",
    lastUpdated: "2024-02-27",
  },
];

export default patients;