'use client';
import { useEffect, useState } from 'react';
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
  // nextAvailable: string;
  languages: string[];
};

export default function DoctorsDirectory() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/doctor/directory', {
          method: 'GET',
          cache: 'no-store',
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load doctors directory');
        }

        const doctorList = Array.isArray(payload?.doctors) ? payload.doctors : [];
        setDoctors(doctorList);
      } catch (err) {
        setDoctors([]);
        setError(err instanceof Error ? err.message : 'Failed to load doctors directory');
      } finally {
        setLoading(false);
      }
    };

    void loadDoctors();
  }, []);

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
      <div className="min-h-screen bg-gray-100 pt-24 sm:pt-28 pb-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-800 tracking-tight">
          Find your Doctor
        </h1>
        <p className="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Find and connect with experienced healthcare professionals</p>

        {error && (
          <p className="text-center text-red-500 mb-4">{error}</p>
        )}

        {/* Search & Filter Section */}
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8 space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          {/* Search Bar */}
          <div className="w-full">
            <input
              type="text"
              placeholder="Search by name, specialization, or working hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-end">
            {/* Specialization List */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <label htmlFor="specialization" className="text-sm font-semibold text-gray-700">
                Specialization:
              </label>
              <select
                id="specialization"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full sm:min-w-52 sm:w-auto px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
          {loading ? (
            <div className="col-span-full text-center py-16">
              <p className="text-gray-500 text-lg">Loading doctors...</p>
            </div>
          ) : filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex h-full flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-5 sm:p-6 hover:shadow-md transition-shadow"
              >
                {/* Doctor Image & Availability Badge */}
                <div className="relative flex justify-center mb-4 sm:mb-5">
                  <img
                    src={doctor.photo}
                    alt={doctor.fullName}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-gray-300"
                    onError={(event) => {
                      event.currentTarget.src = '/images/user.png';
                    }}
                  />
                  {doctor.availableForChat && (
                    <span className="absolute -top-1 right-1/2 translate-x-12 sm:translate-x-14 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap">
                      Online Now
                    </span>
                  )}
                </div>

                {/* Doctor Info */}
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 text-center leading-tight">
                  {doctor.fullName}
                </h2>
                <p className="text-green-600 font-semibold mb-1 text-center text-sm sm:text-base">{doctor.specialization}</p>
                <p className="text-sm text-gray-500 mb-3 text-center">
                  {doctor.experience} experience
                </p>
                <p className="text-sm text-gray-400 mb-3 text-center line-clamp-2 min-h-10">
                  {doctor.hospitals.join(", ")}
                </p>

                {/* Fees */}
                <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm border border-gray-100">
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
                {/* <p className="text-xs text-gray-500 mb-4 text-center">
                  Next Available: {doctor.nextAvailable}
                </p> */}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-auto">
                  {/* Chat Now Button */}
                  <GreenButton
                    disabled={!doctor.availableForChat}
                    className={`w-full text-sm ${!doctor.availableForChat ? 'bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
                  >
                    {doctor.availableForChat ? '💬 Chat Now' : '💬 Offline'}
                  </GreenButton>

                  {/* Book Appointment Button */}
                  <Link href={`/user-self/book-appointment?doctor=${doctor.id}`} className="w-full">
                    <BlackButton className="w-full text-sm">
                      📅 Book Appointment
                    </BlackButton>
                  </Link>

                  {/* See Profile Link */}
                  <Link href={`/doctors/${doctor.id}`} className="w-full">
                    <WhiteButton className="w-full text-sm">
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
      </div>
    </>
  );
}
