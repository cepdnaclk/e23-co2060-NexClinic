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
    <div className="min-h-screen w-full bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white py-6 px-3 sm:px-4 sm:py-8 lg:px-6">
      <div className="mx-auto w-full max-w-2xl">
        {success ? (
          /* Success Message */
          <div className="relative overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-[0_20px_60px_rgba(16,185,129,0.14)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,173,133,0.08),transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(0,119,88,0.08),transparent_40%)]" />
            <div className="relative space-y-6 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-xl">
                  <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Appointment Confirmed!
                </h2>
                <p className="mt-3 max-w-lg text-base leading-6 text-slate-600">
                  Your appointment has been successfully booked. Check your email for confirmation details and appointment reminders.
                </p>
                
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center w-full">
                  <Link href="/user-self/appointments" className="flex-1">
                    <button className="w-full rounded-2xl border border-green-100 bg-gradient-to-br from-green-600 to-emerald-700 px-6 py-3 text-base font-semibold text-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-lg">
                      View My Appointments
                    </button>
                  </Link>
                  <button
                    type="button"
                    className="flex-1 rounded-2xl border border-green-100 bg-white/90 px-6 py-3 text-base font-semibold text-slate-900 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-200 hover:shadow-md"
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
          </div>
        ) : (
          /* Booking Form */
          <div className="relative overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-[0_20px_60px_rgba(16,185,129,0.14)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,173,133,0.08),transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(0,119,88,0.08),transparent_40%)]" />
            <div className="relative space-y-6 p-6 sm:p-8 lg:p-10">
              {/* Header */}
              <div className="mb-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">Book Your Appointment</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Schedule with a Doctor
                </h1>
                <p className="mt-3 max-w-xl text-base leading-6 text-slate-600">
                  Find your preferred doctor and select a convenient time slot for your medical consultation.
                </p>
              </div>

              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Select a Doctor</label>
                  <select
                    className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-slate-900 focus:border-green-300 focus:outline-none focus:ring-1 focus:ring-green-300 transition-all"
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
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Select Time Slot</label>
                  <select
                    className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-slate-900 focus:border-green-300 focus:outline-none focus:ring-1 focus:ring-green-300 transition-all"
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
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Reason for Visit (Optional)</label>
                  <textarea
                    className="w-full rounded-2xl border border-green-100 bg-white px-4 py-3 text-slate-900 focus:border-green-300 focus:outline-none focus:ring-1 focus:ring-green-300 transition-all resize-none"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe your symptoms or reason for the visit..."
                  />
                </div>

                {/* Selected Appointment Summary */}
                {selectedSlot && (
                  <div className="rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 via-white to-emerald-50 p-4 sm:p-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                        <h3 className="font-semibold text-slate-900">Appointment Summary</h3>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600 ml-7">
                        <div className="flex justify-between items-center">
                          <span>Doctor:</span>
                          <span className="font-medium text-slate-900">{selectedSlot.doctorName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Location:</span>
                          <span className="font-medium text-slate-900">{selectedSlot.hospital}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Date & Time:</span>
                          <span className="font-medium text-slate-900">{formatDateForDisplay(selectedSlot.date)} at {formatTimeForDisplay(selectedSlot.time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {loadingSlots && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700 text-sm text-center flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin" />
                    Loading available slots...
                  </div>
                )}

                {/* No Slots Message */}
                {!loadingSlots && availableSlots.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <svg className="h-12 w-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-slate-600 text-sm">
                      No doctors or hospitals are currently available. Please check back later.
                    </p>
                  </div>
                )}

                {!loadingSlots && doctorId && filteredSlots.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <svg className="h-12 w-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10a4 4 0 118 0 4 4 0 01-8 0z" />
                    </svg>
                    <p className="text-slate-600 text-sm">
                      No available slots for the selected doctor. Try another doctor or check back soon.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || loadingSlots || !doctorId || !slotId}
                  className="mt-2 w-full rounded-2xl bg-gradient-to-br from-green-700 via-emerald-700 to-green-800 px-6 py-3 text-base font-semibold text-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Booking Appointment...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v2h16V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                      </svg>
                      Book Appointment
                    </>
                  )}
                </button>

                {/* Help Text */}
                <p className="text-center text-sm text-slate-600">
                  Need help? <Link href="/doctors" className="font-semibold text-green-700 hover:text-green-800 transition-colors">Browse all doctors</Link>
                </p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentPage;
