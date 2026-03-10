"use client";
import React, { useState } from "react";
import Link from "next/link";

// Mock data for doctors, hospitals, and slots
const doctors = [
  { id: 1, name: "Dr. John Doe" },
  { id: 2, name: "Dr. Jane Smith" },
  { id: 3, name: "Dr. Alice Brown" },
];
const hospitals = [
  { id: 1, name: "City Hospital" },
  { id: 2, name: "Green Valley Clinic" },
  { id: 3, name: "Sunrise Medical Center" },
];
const slots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"
];

const BookAppointmentPage = () => {
  const [doctorId, setDoctorId] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !hospitalId || !date || !slot) {
      setError("Please fill in all fields.");
      return;
    }
    // TODO: Send booking data to backend
    setSuccess(true);
    setError("");
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-10 flex flex-col gap-6 transition-colors">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">Book an Appointment</h2>
        {success ? (
          <div className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 p-4 rounded-lg text-center">
            Appointment booked successfully!
            <div className="mt-4">
              <Link href="/user-self/appointments" className="text-green-600 hover:underline font-semibold">Go to My Appointments</Link>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Doctor</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={doctorId}
                onChange={e => setDoctorId(e.target.value)}
                required
              >
                <option value="">Select a doctor</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Hospital</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={hospitalId}
                onChange={e => setHospitalId(e.target.value)}
                required
              >
                <option value="">Select a hospital</option>
                {hospitals.map(hos => (
                  <option key={hos.id} value={hos.id}>{hos.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Time Slot</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={slot}
                onChange={e => setSlot(e.target.value)}
                required
              >
                <option value="">Select a time slot</option>
                {slots.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow transition-all mt-2"
            >
              Book Appointment
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentPage;
