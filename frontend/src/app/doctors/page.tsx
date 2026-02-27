'use client';
import Image from "next/image";
import Link from "next/link";
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

export default function DoctorsDirectory() {
  return (
    <>
      <DoctorsNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-8">
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
    </>
  );
  
  }

// import React, { useState } from 'react';

// interface Doctor {
//     id: number;
//     name: string;
//     specialty: string;
//     rating: number;
//     experience: string;
//     image: string;
//     available: boolean;
// }

// const sampleDoctors: Doctor[] = [
//     {
//         id: 1,
//         name: 'Dr. Sarah Johnson',
//         specialty: 'Cardiology',
//         rating: 4.8,
//         experience: '12 years',
//         image: '/doctors/doctor1.jpg',
//         available: true,
//     },
//     {
//         id: 2,
//         name: 'Dr. Michael Chen',
//         specialty: 'Neurology',
//         rating: 4.7,
//         experience: '10 years',
//         image: '/doctors/doctor2.jpg',
//         available: true,
//     },
//     {
//         id: 3,
//         name: 'Dr. Emma Wilson',
//         specialty: 'Dermatology',
//         rating: 4.9,
//         experience: '8 years',
//         image: '/doctors/doctor3.jpg',
//         available: false,
//     },
// ];

// export default function DoctorsPage() {
//     const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');

//     const specialties = ['All', ...new Set(sampleDoctors.map(d => d.specialty))];
//     const filteredDoctors = selectedSpecialty === 'All' 
//         ? sampleDoctors 
//         : sampleDoctors.filter(d => d.specialty === selectedSpecialty);

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
//             <div className="max-w-6xl mx-auto">
//                 <h1 className="text-4xl font-bold text-gray-800 mb-2">Our Doctors</h1>
//                 <p className="text-gray-600 mb-8">Find and connect with experienced healthcare professionals</p>

//                 {/* Filter Section */}
//                 <div className="mb-8 flex gap-3 flex-wrap">
//                     {specialties.map(specialty => (
//                         <button
//                             key={specialty}
//                             onClick={() => setSelectedSpecialty(specialty)}
//                             className={`px-6 py-2 rounded-full font-medium transition-all ${
//                                 selectedSpecialty === specialty
//                                     ? 'bg-indigo-600 text-white shadow-lg'
//                                     : 'bg-white text-gray-700 hover:bg-gray-100'
//                             }`}
//                         >
//                             {specialty}
//                         </button>
//                     ))}
//                 </div>

//                 {/* Doctors Grid */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {filteredDoctors.map(doctor => (
//                         <div
//                             key={doctor.id}
//                             className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
//                         >
//                             <div className="h-48 bg-gray-300 relative">
//                                 {/* Placeholder for doctor image */}
//                                 <div className="w-full h-full flex items-center justify-center text-gray-500">
//                                     {doctor.name}
//                                 </div>
//                             </div>
//                             <div className="p-6">
//                                 <h3 className="text-xl font-bold text-gray-800 mb-1">{doctor.name}</h3>
//                                 <p className="text-indigo-600 font-medium mb-3">{doctor.specialty}</p>
//                                 <div className="flex justify-between items-center mb-4">
//                                     <div className="flex items-center gap-1">
//                                         <span className="text-yellow-500">★</span>
//                                         <span className="text-gray-700 font-medium">{doctor.rating}</span>
//                                     </div>
//                                     <span className="text-sm text-gray-600">{doctor.experience}</span>
//                                 </div>
//                                 <div className="flex gap-3">
//                                     <button
//                                         className={`flex-1 py-2 rounded font-medium transition-colors ${
//                                             doctor.available
//                                                 ? 'bg-indigo-600 text-white hover:bg-indigo-700'
//                                                 : 'bg-gray-300 text-gray-600 cursor-not-allowed'
//                                         }`}
//                                         disabled={!doctor.available}
//                                     >
//                                         {doctor.available ? 'Book Appointment' : 'Unavailable'}
//                                     </button>
//                                     <button className="flex-1 py-2 rounded font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
//                                         View Profile
//                                     </button>
//                                 </div>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// 
