import Image from "next/image";
import ProfileItem from "@/components/doctors/ProfileItem";
import DoctorsNavbar from "@/components/doctors/DoctorsNavbar";

type Doctor = {
  id: string;
  fullName: string;
  slmcId: string;
  photo: string;
  gender: string;
  specialization: string;
  hospitals: string[];
  qualifications: string[];
  contactNumber: string;
  tel: string;
  email: string;
  reviews: number;
};

const doctors: Doctor[] = [
  {
    id: "1",
    fullName: "Dr. Nimal Perera",
    slmcId: "SLMC/12345",
    photo: "/images/male-doctor-profile-pic.jpg",
    gender: "Male",
    specialization: "Cardiologist",
    hospitals: ["Asiri Hospital", "National Hospital Colombo"],
    qualifications: ["MBBS", "MD (Cardiology)"],
    contactNumber: "+94 77 123 4567",
    tel: "011-2345678",
    email: "nimal.perera@example.com",
    reviews: 4.5,
  },
  {
    id: "2",
    fullName: "Dr. Amara Silva",
    slmcId: "SLMC/67890",
    photo: "/images/female-doctor-profile-pic.jpg",
    gender: "Female",
    specialization: "Dermatologist",
    hospitals: ["Lanka Hospitals"],
    qualifications: ["MBBS", "Diploma in Dermatology"],
    contactNumber: "+94 71 987 6543",
    tel: "011-8765432",
    email: "amara.silva@example.com",
    reviews: 4.2,
  },
];

export default async function DoctorProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const doctor = doctors.find((d) => d.id === id);

  if (!doctor) {
    return <p className="p-6">Doctor not found</p>;
  }

  return (
    <>
      <DoctorsNavbar />
      {/* Outer background */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 flex justify-center items-start py-10">
      
      {/* Profile Card */}
      <div className="max-w-5xl w-full bg-white rounded-xl shadow-xl p-8">
        
        {/* Header */}
        <div className="flex gap-6 items-center mb-8">
          <Image
            src={doctor.photo}
            alt={doctor.fullName}
            width={140}
            height={140}
            className="rounded-full object-cover border-4 border-blue-300"
          />

          <div>
            <h1 className="text-3xl font-bold text-blue-600">{doctor.fullName}</h1>
            <p className="text-green-500 font-semibold">{doctor.specialization}</p>
            <p className="text-purple-500 text-sm">{`SLMC ID: ${doctor.slmcId}`}</p>
          </div>

        </div>

        {/* Profile Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <ProfileItem label="Gender" value={doctor.gender} />
          <ProfileItem label="Working Hospitals" value={doctor.hospitals.join(", ")} />
          <ProfileItem label="Qualifications" value={doctor.qualifications.join(", ")} />
          <ProfileItem label="Contact Number" value={doctor.contactNumber} />
          <ProfileItem label="Telephone" value={doctor.tel} />
          <ProfileItem label="Email" value={doctor.email} />
          <ProfileItem label="Reviews" value={`${doctor.reviews} ⭐`} />
        </div>
  </div>
      </div>
    </>
  );
}
