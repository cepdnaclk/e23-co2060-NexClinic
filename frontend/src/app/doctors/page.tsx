import Image from "next/image";
import Link from "next/link";

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

// Sample doctors array (reuse the same as in profile page)
const doctors: Doctor[] = [
  {
    id: "1",
    fullName: "Dr. Amara Perera",
    slmcId: "SLMC/12345",
    photo: "/images/male-doctor-profile-pic.jpg",
    gender: "Male",
    specialization: "Cardiologist",
    hospitals: ["Asiri Hospital", "National Hospital Colombo"],
    qualifications: ["MBBS", "MD (Cardiology)"],
    contactNumber: "+94 77 123 4567",
    tel: "011-2345678",
    email: "amara.perera@example.com",
    reviews: 4.5,
  },
  {
    id: "2",
    fullName: "Dr. Nimal Silva",
    slmcId: "SLMC/67890",
    photo: "/images/female-doctor-profile-pic.jpg",
    gender: "Female",
    specialization: "Dermatologist",
    hospitals: ["Lanka Hospitals"],
    qualifications: ["MBBS", "Diploma in Dermatology"],
    contactNumber: "+94 71 987 6543",
    tel: "011-8765432",
    email: "nimal.silva@example.com",
    reviews: 4.2,
  },
];

export default function DoctorsDirectory() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-blue-700">
        Doctors Directory
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col items-center p-6"
          >
            <Image
              src={doctor.photo}
              alt={doctor.fullName}
              width={120}
              height={120}
              className="rounded-full object-cover mb-4 border-2 border-blue-300"
            />

            <h2 className="text-xl font-bold text-blue-600 mb-1">
              {doctor.fullName}
            </h2>
            <p className="text-gray-600 mb-2">{doctor.specialization}</p>
            <p className="text-sm text-gray-500 mb-4">
              Reviews: {doctor.reviews} ⭐
            </p>
            <p className="text-sm text-gray-400 mb-6 text-center">
              {doctor.hospitals.join(", ")}
            </p>

            {/* See Profile Button */}
            <Link
              href={`/doctors/${doctor.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-300"
            >
              See Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
