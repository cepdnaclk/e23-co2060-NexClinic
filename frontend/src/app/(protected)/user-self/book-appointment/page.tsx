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

const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      year: "numeric", 
      month: "short", 
      day: "numeric" 
    });
  } catch {
    return dateString;
  }
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

      const rawSlots: unknown[] = Array.isArray(payload?.slots) ? payload.slots : [];
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f5faf7] via-white to-emerald-50/30 py-12 px-4 transition-colors dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 h-80 w-80 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 bg-lime-200/20 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V9.75M10.5 1.5v3a2 2 0 002 2h3M10.5 1.5L15.5 6.5" strokeWidth="0.5" stroke="currentColor" />
              </svg>
              Schedule Your Visit
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 md:text-5xl">
            Book an Appointment
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Find your preferred doctor and select a convenient time slot for your medical consultation with NexClinic
          </p>
        </div>

        {success ? (
          /* Success Message */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-emerald-100 dark:border-emerald-900 p-8 md:p-12">
            <div className="text-center">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                Appointment Confirmed!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Your appointment has been successfully booked. Check your email for confirmation details.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/user-self/appointments" className="flex-1">
                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl">
                    View My Appointments
                  </button>
                </Link>
                <button
                  type="button"
                  className="flex-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-green-600 dark:text-green-400 font-semibold py-3 px-6 rounded-xl border-2 border-green-200 dark:border-green-700 transition-all"
                  onClick={() => {
                    setSuccess(false);
                    setError("");
                  }}
                >
                  Book Another
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-colors">
            <form className="p-8 md:p-10 flex flex-col gap-7" onSubmit={handleSubmit}>
              {/* Doctor Selection */}
              <div>
                <label className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  Select a Doctor
                </label>
                <select
                  className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
                  value={doctorId}
                  onChange={(e) => {
                    setDoctorId(e.target.value);
                    setSlotId("");
                  }}
                  required
                  disabled={loadingSlots}
                >
                  <option value="">Choose your preferred doctor...</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>

              {/* Slot Selection */}
              <div>
                <label className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                  </svg>
                  Select Time Slot
                </label>
                <select
                  className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all"
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  required
                  disabled={loadingSlots || filteredSlots.length === 0}
                >
                  <option value="">Choose an available time...</option>
                  {filteredSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {`${slot.hospital} • ${formatDateForDisplay(slot.date)} at ${formatTimeForDisplay(slot.time)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason For Visit */}
              <div>
                <label className="block mb-3 font-semibold text-gray-800 dark:text-gray-200 text-lg flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                  Reason for Visit (Optional)
                </label>
                <textarea
                  className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none transition-all resize-none"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your symptoms or reason for the visit (optional)..."
                />
              </div>

              {/* Selected Appointment Summary */}
              {selectedSlot && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center flex-shrink-0">
                      <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Appointment Summary</h3>
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedSlot.doctorName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{selectedSlot.hospital}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Date & Time:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{formatDateForDisplay(selectedSlot.date)} at {formatTimeForDisplay(selectedSlot.time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl p-4 text-red-700 dark:text-red-300 flex items-start gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Loading State */}
              {loadingSlots && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 text-blue-700 dark:text-blue-300 text-center flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
                  Loading available slots...
                </div>
              )}

              {/* No Slots Message */}
              {!loadingSlots && availableSlots.length === 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">
                    No doctors or hospitals are currently available. Please check back later.
                  </p>
                </div>
              )}

              {!loadingSlots && doctorId && filteredSlots.length === 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 text-center">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10a4 4 0 118 0 4 4 0 01-8 0z" />
                  </svg>
                  <p className="text-gray-600 dark:text-gray-400">
                    No available slots for the selected doctor. Try another doctor or check back soon.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || loadingSlots || !doctorId || !slotId}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed disabled:opacity-60 mt-4 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Booking Appointment...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Book Appointment
                  </>
                )}
              </button>

              {/* Additional Help */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-2">
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Need help? <Link href="/doctors" className="text-green-600 dark:text-green-400 font-semibold hover:underline">Browse all doctors</Link>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentPage;
