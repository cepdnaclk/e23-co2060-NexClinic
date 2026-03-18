"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AvailableSlot = {
  id: number;
  doctorId: string;
  doctorName: string;
  hospital: string;
  date: string;
  time: string;
};

const formatTimeForDisplay = (time: string): string => {
  const twentyFourHourMatch = time.match(/^(\d{2}):(\d{2})$/);
  if (!twentyFourHourMatch) {
    return time;
  }

  let hour = Number(twentyFourHourMatch[1]);
  const minute = twentyFourHourMatch[2];
  const suffix = hour >= 12 ? "PM" : "AM";

  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }

  return `${hour}:${minute} ${suffix}`;
};

const BookAppointmentPage = () => {
  const [doctorId, setDoctorId] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [date, setDate] = useState("");
  const [slotId, setSlotId] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

  useEffect(() => {
    const initialDoctorFromQuery = new URLSearchParams(window.location.search).get("doctor");
    if (initialDoctorFromQuery) {
      setDoctorId(initialDoctorFromQuery);
    }
  }, []);

  useEffect(() => {
    const loadAvailableSlots = async () => {
      setLoadingSlots(true);
      setError("");

      try {
        const response = await fetch("/api/patient/appointment-slots", {
          method: "GET",
          cache: "no-store",
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load available slots");
        }

        setAvailableSlots(Array.isArray(payload?.slots) ? payload.slots : []);
      } catch (err) {
        setAvailableSlots([]);
        setError(err instanceof Error ? err.message : "Failed to load available slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    void loadAvailableSlots();
  }, []);

  const doctors = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    availableSlots.forEach((slot) => {
      if (!map.has(slot.doctorId)) {
        map.set(slot.doctorId, { id: slot.doctorId, name: slot.doctorName });
      }
    });
    return Array.from(map.values());
  }, [availableSlots]);

  const hospitals = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    availableSlots
      .filter((slot) => (doctorId ? slot.doctorId === doctorId : true))
      .forEach((slot) => {
        if (!map.has(slot.hospital)) {
          map.set(slot.hospital, { id: slot.hospital, name: slot.hospital });
        }
      });
    return Array.from(map.values());
  }, [availableSlots, doctorId]);

  const filteredSlots = useMemo(() => {
    return availableSlots.filter((slot) => {
      const matchesDoctor = doctorId ? slot.doctorId === doctorId : true;
      const matchesHospital = hospitalId ? slot.hospital === hospitalId : true;
      const matchesDate = date ? slot.date === date : true;
      return matchesDoctor && matchesHospital && matchesDate;
    });
  }, [availableSlots, doctorId, hospitalId, date]);

  const selectedSlot = filteredSlots.find((slot) => String(slot.id) === slotId) || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !date || !slotId) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slot_id: Number(slotId),
          reason,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to book appointment");
      }

      setSuccess(true);
      setReason("");
      setSlotId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
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
                onChange={(e) => {
                  setDoctorId(e.target.value);
                  setHospitalId("");
                  setSlotId("");
                }}
                required
                disabled={loadingSlots}
              >
                <option value="">Select a doctor</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Hospital</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={hospitalId}
                onChange={(e) => {
                  setHospitalId(e.target.value);
                  setSlotId("");
                }}
                disabled={loadingSlots}
              >
                <option value="">Select a hospital</option>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Date</label>
              <input
                type="date"
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSlotId("");
                }}
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Time Slot</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                required
                disabled={loadingSlots || filteredSlots.length === 0}
              >
                <option value="">Select a time slot</option>
                {filteredSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>{`${slot.date} ${formatTimeForDisplay(slot.time)}`}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Reason For Visit</label>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional"
              />
            </div>

            {loadingSlots && <div className="text-gray-500 text-sm text-center">Loading available slots...</div>}
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            {!loadingSlots && availableSlots.length === 0 && (
              <div className="text-gray-500 text-sm text-center">
                No doctors or hospitals are shown because no future appointment slots are available yet.
              </div>
            )}
            {!loadingSlots && filteredSlots.length === 0 && (
              <div className="text-gray-500 text-sm text-center">No available slots for the selected filters.</div>
            )}
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow transition-all mt-2 disabled:opacity-60"
              disabled={submitting || loadingSlots}
            >
              {submitting ? "Booking..." : "Book Appointment"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentPage;
