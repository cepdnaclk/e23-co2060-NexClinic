'use client';
import { useState } from 'react';
import Image from "next/image";
import Link from "next/link";
import RoleBasedNavbar from "@/components/common/RoleBasedNavbar";
import GreenButton from "@/components/buttons/GreenButton";
import WhiteButton from "@/components/buttons/WhiteButton";
import BlackButton from "@/components/buttons/BlackButton";

type Doctor = {
  id: string;
  fullName: string;
  slmcId: string;
  photo: string;
  specialization: string;
  hospitals: string[];
  qualifications: string[];
  experience: string;
  contactNumber: string;
  email: string;
  chatFee: string;
  appointmentFee: string;
  availableForChat: boolean;
  nextAvailable: string;
  languages: string[];
};


const doctors: Doctor[] = [
  {
    id: "1",
    fullName: "Dr. Nimal Perera",
    slmcId: "SLMC/12345",
    photo: "/images/male-doctor-profile-pic.jpg",
    specialization: "Cardiologist",
    hospitals: ["Asiri Hospital", "National Hospital Colombo"],
    qualifications: ["MBBS", "MD (Cardiology)"],
    experience: "12 years",
    contactNumber: "+94 77 123 4567",
    email: "nimal.perera@example.com",
    chatFee: "Rs. 500",
    appointmentFee: "Rs. 3,000",
    availableForChat: true,
    nextAvailable: "Today, 3:00 PM",
    languages: ["English", "Sinhala", "Tamil"],
  },
  {
    id: "2",
    fullName: "Dr. Amara Silva",
    slmcId: "SLMC/67890",
    photo: "/images/female-doctor-profile-pic.jpg",
    specialization: "Dermatologist",
    hospitals: ["Lanka Hospitals"],
    qualifications: ["MBBS", "Diploma in Dermatology"],
    experience: "8 years",
    contactNumber: "+94 71 987 6543",
    email: "amara.silva@example.com",
    chatFee: "Rs. 400",
    appointmentFee: "Rs. 2,500",
    availableForChat: false,
    nextAvailable: "Tomorrow, 10:00 AM",
    languages: ["English", "Sinhala"],
  },
  {
    id: "3",
    fullName: "Dr. Kamal Fernando",
    slmcId: "SLMC/34567",
    photo: "/images/male-doctor-profile-pic.jpg",
    specialization: "Pediatrician",
    hospitals: ["Nawaloka Hospital"],
    qualifications: ["MBBS", "DCH", "MD (Pediatrics)"],
    experience: "15 years",
    contactNumber: "+94 76 234 5678",
    email: "kamal.fernando@example.com",
    chatFee: "Rs. 600",
    appointmentFee: "Rs. 3,500",
    availableForChat: true,
    nextAvailable: "Today, 5:30 PM",
    languages: ["English", "Sinhala"],
  },
  {
    id: "4",
    fullName: "Dr. Rashmi Wijesinghe",
    slmcId: "SLMC/45678",
    photo: "/images/female-doctor-profile-pic.jpg",
    specialization: "Gynecologist",
    hospitals: ["Asiri Hospital"],
    qualifications: ["MBBS", "MD (Obstetrics & Gynecology)"],
    experience: "10 years",
    contactNumber: "+94 75 345 6789",
    email: "rashmi.wijesinghe@example.com",
    chatFee: "Rs. 500",
    appointmentFee: "Rs. 3,200",
    availableForChat: true,
    nextAvailable: "Today, 2:00 PM",
    languages: ["English", "Sinhala", "Tamil"],
  },
    {
    id: "5",
    fullName: "Dr. Rashmi Wijesinghe",
    slmcId: "SLMC/45678",
    photo: "/images/female-doctor-profile-pic.jpg",
    specialization: "Gynecologist",
    hospitals: ["Asiri Hospital"],
    qualifications: ["MBBS", "MD (Obstetrics & Gynecology)"],
    experience: "10 years",
    contactNumber: "+94 75 345 6789",
    email: "rashmi.wijesinghe@example.com",
    chatFee: "Rs. 500",
    appointmentFee: "Rs. 3,200",
    availableForChat: true,
    nextAvailable: "Today, 2:00 PM",
    languages: ["English", "Sinhala", "Tamil"],
  },
    {
    id: "6",
    fullName: "Dr. Rashmi Wijesinghe",
    slmcId: "SLMC/45678",
    photo: "/images/female-doctor-profile-pic.jpg",
    specialization: "Gynecologist",
    hospitals: ["Asiri Hospital"],
    qualifications: ["MBBS", "MD (Obstetrics & Gynecology)"],
    experience: "10 years",
    contactNumber: "+94 75 345 6789",
    email: "rashmi.wijesinghe@example.com",
    chatFee: "Rs. 500",
    appointmentFee: "Rs. 3,200",
    availableForChat: true,
    nextAvailable: "Today, 2:00 PM",
    languages: ["English", "Sinhala", "Tamil"],
  },
    {
    id: "7",
    fullName: "Dr. Rashmi Wijesinghe",
    slmcId: "SLMC/45678",
    photo: "/images/female-doctor-profile-pic.jpg",
    specialization: "Gynecologist",
    hospitals: ["Asiri Hospital"],
    qualifications: ["MBBS", "MD (Obstetrics & Gynecology)"],
    experience: "10 years",
    contactNumber: "+94 75 345 6789",
    email: "rashmi.wijesinghe@example.com",
    chatFee: "Rs. 500",
    appointmentFee: "Rs. 3,200",
    availableForChat: true,
    nextAvailable: "Today, 2:00 PM",
    languages: ["English", "Sinhala", "Tamil"],
  },
];

export default function DoctorsDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  // Get unique specializations
  const specialties = ['All', ...Array.from(new Set(doctors.map(d => d.specialization)))];

  // Filter doctors based on search and filters
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.hospitals.some(h => h.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSpecialty = selectedSpecialty === 'All' || doctor.specialization === selectedSpecialty;
    const matchesOnline = !showOnlineOnly || doctor.availableForChat;

    return matchesSearch && matchesSpecialty && matchesOnline;
  });

  return (
    <>
      <div className="fixed w-full top-0 left-0 z-10">
        <RoleBasedNavbar />
      </div>
      <div className="min-h-screen bg-gray-100 p-8 pt-24">
        <h1 className="text-4xl font-bold text-center mb-6 text-gray-800">
          Find your Doctor
        </h1>
        <p className="text-center text-gray-600 mb-8">Find and connect with experienced healthcare professionals</p>

        {/* Search & Filter Section */}
        <div className="max-w-6xl mx-auto mb-8 space-y-4">
          {/* Search Bar */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search by name, specialization, or working hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            {/* Specialization List */}
            <div className="flex items-center gap-2">
              <label htmlFor="specialization" className="text-sm font-semibold text-gray-700">
                Specialization:
              </label>
              <select
                id="specialization"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="min-w-52 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Online Availability Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="onlineOnly"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="w-4 h-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="onlineOnly" className="text-sm font-medium text-gray-700">
                Available for Chat Now
              </label>
            </div>
          </div>

          {/* Results Count */}
          {/* <p className="text-sm text-gray-600">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </p> */}
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex flex-col w-full bg-white rounded-xl shadow-lg overflow-hidden p-8 hover:shadow-xl transition-shadow"
              >
                {/* Doctor Image & Availability Badge */}
                <div className="relative flex justify-center mb-4">
                  <Image
                    src={doctor.photo}
                    alt={doctor.fullName}
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-2 border-gray-300"
                  />
                  {doctor.availableForChat && (
                    <span className="absolute top-0 right-16 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                      Online Now
                    </span>
                  )}
                </div>

                {/* Doctor Info */}
                <h2 className="text-xl font-bold text-gray-800 mb-1 text-center">
                  {doctor.fullName}
                </h2>
                <p className="text-green-500 font-semibold mb-1 text-center">{doctor.specialization}</p>
                <p className="text-sm text-gray-500 mb-3 text-center">
                  {doctor.experience} experience
                </p>
                <p className="text-sm text-gray-400 mb-2 text-center">
                  {doctor.hospitals.join(", ")}
                </p>

                {/* Fees */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Chat Session:</span>
                    <span className="font-semibold text-gray-800">{doctor.chatFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Appointment:</span>
                    <span className="font-semibold text-gray-800">{doctor.appointmentFee}</span>
                  </div>
                </div>

                {/* Next Available */}
                <p className="text-xs text-gray-500 mb-4 text-center">
                  Next Available: {doctor.nextAvailable}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-auto">
                  {/* Chat Now Button */}
                  <GreenButton
                    disabled={!doctor.availableForChat}
                    className={`w-full ${!doctor.availableForChat ? 'bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
                  >
                    {doctor.availableForChat ? '💬 Chat Now' : '💬 Offline'}
                  </GreenButton>

                  {/* Book Appointment Button */}
                  <Link href={`/user-self/book-appointment?doctor=${doctor.id}`} className="w-full">
                    <BlackButton className="w-full">
                      📅 Book Appointment
                    </BlackButton>
                  </Link>

                  {/* See Profile Link */}
                  <Link href={`/doctors/${doctor.id}`} className="w-full">
                    <WhiteButton className="w-full">
                    View Full Profile
                    </WhiteButton>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <p className="text-gray-500 text-lg">No doctors found matching your criteria</p>
              <GreenButton
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialty('All');
                  setShowOnlineOnly(false);
                }}
                className="mt-4"
              >
                Reset Filters
              </GreenButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
