"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handlePatientSessionExpired } from "@/lib/patientSession";

type AvailableSlot = {
  id: number;
  doctorId: string;
  doctorName: string;
  hospital: string;
  date: string;
  time: string;
  bookedCount: number;
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
  const router = useRouter();
  const [doctorId, setDoctorId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

  const loadAvailableSlots = React.useCallback(async () => {
    setLoadingSlots(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (doctorId) {
        params.set("doctor_id", doctorId);
      }

      const endpoint = params.toString()
        ? `/api/patient/appointment-slots?${params.toString()}`
        : "/api/patient/appointment-slots";

      const response = await fetch(endpoint, {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401) {
        handlePatientSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load available slots");
      }

      const rawSlots = Array.isArray(payload?.slots) ? payload.slots : [];
      const slots: AvailableSlot[] = rawSlots
        .filter((slot): slot is AvailableSlot => {
          if (!slot || typeof slot !== "object") {
            return false;
          }

          const candidate = slot as Record<string, unknown>;
          return (
            typeof candidate.id === "number" &&
            typeof candidate.doctorId === "string" &&
            typeof candidate.doctorName === "string" &&
            typeof candidate.hospital === "string" &&
            typeof candidate.date === "string" &&
            typeof candidate.time === "string" &&
            typeof candidate.bookedCount === "number"
          );
        });
      setAvailableSlots(slots);

      setSlotId((currentSlotId) =>
        slots.some((slot) => String(slot.id) === currentSlotId) ? currentSlotId : ""
      );
    } catch (err) {
      setAvailableSlots([]);
      setError(err instanceof Error ? err.message : "Failed to load available slots");
    } finally {
      setLoadingSlots(false);
    }
  }, [date, doctorId, router]);
  }, [doctorId, router]);

  useEffect(() => {
    const initialDoctorFromQuery = new URLSearchParams(window.location.search).get("doctor");
    if (initialDoctorFromQuery) {
      setDoctorId(initialDoctorFromQuery);
    }
  }, []);

  useEffect(() => {
    void loadAvailableSlots();
  }, [loadAvailableSlots]);

  const doctors = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    availableSlots.forEach((slot) => {
      if (!map.has(slot.doctorId)) {
        map.set(slot.doctorId, { id: slot.doctorId, name: slot.doctorName });
      }
    });
    return Array.from(map.values());
  }, [availableSlots]);

  const filteredSlots = useMemo(() => {
    return availableSlots.filter((slot) => {
      const matchesDoctor = doctorId ? slot.doctorId === doctorId : true;
      return matchesDoctor;
    });
  }, [availableSlots, doctorId]);

  const selectedSlot = filteredSlots.find((slot) => String(slot.id) === slotId) || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !slotId) {
      setError("Please fill in all fields.");
      return;
    }

    if (!selectedSlot) {
      setError("Please select a valid available time slot.");
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

      if (response.status === 401) {
        handlePatientSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to book appointment");
      }

      await loadAvailableSlots();
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
            <button
              type="button"
              className="mt-4 bg-white/80 hover:bg-white text-green-700 font-semibold py-2 px-5 rounded-lg border border-green-300 transition-all"
              onClick={() => {
                setSuccess(false);
                setError("");
              }}
            >
              Book Another Appointment
            </button>
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
              <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">Appointment Slot</label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none"
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                required
                disabled={loadingSlots || filteredSlots.length === 0}
              >
                <option value="">Select a slot</option>
                {filteredSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>{`${slot.date} ${formatTimeForDisplay(slot.time)} (${slot.bookedCount} booked)`}</option>
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

            {selectedSlot && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-100">
                <div className="font-semibold">Selected Appointment</div>
                <div>{selectedSlot.doctorName}</div>
                <div>{selectedSlot.hospital}</div>
                <div>{selectedSlot.date} at {formatTimeForDisplay(selectedSlot.time)}</div>
                <div>{selectedSlot.bookedCount} appointment(s) already booked</div>
              </div>
            )}

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
