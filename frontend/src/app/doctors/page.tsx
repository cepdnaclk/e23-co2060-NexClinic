'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

type AppRole = 'DOCTOR' | 'PATIENT' | 'ADMIN' | 'GUEST';

export default function DoctorsDirectory() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [role, setRole] = useState<AppRole>('GUEST');
  const [isRoleResolved, setIsRoleResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('userRole');
    if (authToken && storedRole === 'DOCTOR') {
      setRole('DOCTOR');
      setIsRoleResolved(true);
      return;
    }
    if (authToken && storedRole === 'PATIENT') {
      setRole('PATIENT');
      setIsRoleResolved(true);
      return;
    }
    if (authToken && storedRole === 'ADMIN') {
      setRole('ADMIN');
      setIsRoleResolved(true);
      return;
    }
    setRole('GUEST');
    setIsRoleResolved(true);
  }, []);

  useEffect(() => {
    if (!isRoleResolved) {
      setLoading(false);
      setDoctors([]);
      return;
    }

    if (!['DOCTOR', 'PATIENT', 'ADMIN', 'GUEST'].includes(role)) {
      setLoading(false);
      setDoctors([]);
      return;
    }

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
  }, [isRoleResolved, role]);

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
      <div className="fixed w-full top-0 left-0 z-20">
        <RoleBasedNavbar />
      </div>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_10%,rgba(16,185,129,0.20),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(45,212,191,0.18),transparent_35%),linear-gradient(180deg,#f7fcfa_0%,#eef7f3_55%,#e9f5f2_100%)] pt-24 sm:pt-28 pb-14">
        <div className="pointer-events-none absolute -top-16 -left-24 h-72 w-72 rounded-full bg-emerald-300/35 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -right-20 h-80 w-80 rounded-full bg-teal-300/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-white/40 blur-3xl" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="relative rounded-[2rem] border border-white/80 bg-white/85 p-6 sm:p-8 shadow-[0_30px_80px_rgba(16,185,129,0.10)] backdrop-blur overflow-hidden">
              <div className="pointer-events-none absolute -top-14 right-8 h-36 w-36 rounded-full bg-emerald-200/60 blur-2xl" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                <div className="lg:col-span-2">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight">Find Your Doctor</h1>
                  <p className="mt-2 text-gray-600">Discover verified specialists and book appointments confidently. Filter by specialty or availability.</p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Showing {filteredDoctors.length} of {doctors.length} doctors
                  </div>
                </div>

                <div className="w-full">
                  <div className="relative">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <line x1="16.65" y1="16.65" x2="21" y2="21" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search name, specialty or hospital"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <select
                      id="specialization"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="px-3 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-700 shadow-sm"
                    >
                      {specialties.map((specialty) => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setShowOnlineOnly((s) => !s)}
                      className={`px-3 py-2 rounded-full text-sm font-semibold ${showOnlineOnly ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                      {showOnlineOnly ? 'Online Now' : 'All'}
                    </button>

                    <button onClick={() => { setSearchQuery(''); setSelectedSpecialty('All'); setShowOnlineOnly(false); }} className="ml-auto px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-auto mt-6 max-w-6xl rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm font-medium text-rose-700 shadow-sm">
              {error}
            </div>
          )}

          {/* Doctors Grid */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
            {loading ? (
              <div className="col-span-full text-center py-16">
                <p className="text-gray-500 text-lg">Loading doctors...</p>
              </div>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="group flex h-full flex-col rounded-[1.5rem] border border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(16,185,129,0.06)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_65px_rgba(16,185,129,0.13)]">
                  <div className="relative">
                    <div className="h-2 w-full rounded-t-lg bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 absolute top-0 left-0" />
                    <div className="flex flex-col items-center pt-6">
                      <div className="relative">
                        <img src={doctor.photo} alt={doctor.fullName} className="w-28 h-28 rounded-full object-cover ring-4 ring-white shadow-[0_10px_30px_rgba(16,185,129,0.12)] transition-transform duration-300 group-hover:scale-105" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/user.png' }} />
                        {doctor.availableForChat && <span className="absolute bottom-0 right-0 -mb-1 -mr-1 bg-emerald-600 text-white text-xs font-semibold px-2 py-1 rounded-full">Online</span>}
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-gray-900 text-center">{doctor.fullName}</h3>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">{doctor.specialization}</p>
                      <p className="mt-1 text-sm text-gray-600">{doctor.experience} experience</p>
                      <div className="mt-3 flex flex-wrap gap-2 justify-center">
                        {doctor.hospitals.slice(0, 3).map((h) => (
                          <span key={h} className="text-xs px-3 py-1 rounded-full bg-white/80 border border-emerald-100 text-gray-700">{h}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-white/60 rounded-xl p-4 w-full border border-white/80">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">Online Session</div>
                      <div className="text-sm font-black text-gray-900">{doctor.chatFee}</div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm text-gray-600">In-person</div>
                      <div className="text-sm font-black text-gray-900">{doctor.appointmentFee}</div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    {role === 'PATIENT' ? (
                      <>
                        <GreenButton
                          onClick={() => router.push(`/user-self/chats?doctor=${doctor.id}`)}
                          disabled={!doctor.availableForChat}
                          className={`w-full ${!doctor.availableForChat ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {doctor.availableForChat ? 'Chat Now' : 'Offline'}
                        </GreenButton>
                        <div className={`w-full ${doctor.nextAvailable === 'Not available' ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}>
                          <Link href={doctor.nextAvailable !== 'Not available' ? `/user-self/book-appointment?doctor=${doctor.id}` : '#'} className="w-full">
                            <BlackButton className="w-full" disabled={doctor.nextAvailable === 'Not available'}>
                              {doctor.nextAvailable !== 'Not available' ? 'Book Appointment' : 'No Slots Available'}
                            </BlackButton>
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <GreenButton
                          disabled={true}
                          className="w-full opacity-60 cursor-not-allowed"
                        >
                          Chat Now
                        </GreenButton>
                        <BlackButton disabled={true} className="w-full opacity-60 cursor-not-allowed">
                          Book Appointment
                        </BlackButton>
                        <p className="text-xs text-gray-500 text-center">Chat and booking are available for patients.</p>
                      </>
                    )}

                    <Link href={`/doctors/${doctor.id}`} className="w-full">
                      <WhiteButton className="w-full">View Full Profile</WhiteButton>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <p className="text-gray-500 text-lg">No doctors found matching your criteria</p>
                <GreenButton onClick={() => { setSearchQuery(''); setSelectedSpecialty('All'); setShowOnlineOnly(false); }} className="mt-4">Reset Filters</GreenButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
