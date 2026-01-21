'use client';

import Link from 'next/link';

type Doctor = {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
};

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="border rounded-lg p-4 shadow-md hover:shadow-lg transition">
      <h2 className="text-xl font-semibold">{doctor.name}</h2>
      <p className="text-gray-600">{doctor.specialization}</p>
      <p className="text-gray-500">{doctor.hospital}</p>

      <Link
        href={`/doctors/${doctor.id}`}
        className="inline-block mt-3 text-blue-600 font-medium hover:underline"
      >
        View Profile →
      </Link>
    </div>
  );
}
