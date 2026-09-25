"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handlePatientSessionExpired } from "@/lib/patientSession";
import MockPaymentGateway from "@/components/payment/MockPaymentGateway";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { fetchAvailableSlots } from "@/app/api/appointmentApi";

type AvailableSlot = {
  id: number;
  doctorId: string;
  doctorName: string;
  hospital: string;
  date: string;
  time: string;
  bookedCount: number;
  patientLimit: number;
  remainingCount: number;
  isFull: boolean;
  appointmentFee: number;
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
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

const BookAppointmentPage = () => {
  const router = useRouter();
  const [selectedHospital, setSelectedHospital] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const loadAvailableSlots = React.useCallback(async () => {
    setLoadingSlots(true);
    setError("");

    try {
      const payload = await fetchAvailableSlots(undefined, router);

      const rawSlots: unknown[] = Array.isArray(payload?.slots)
        ? payload.slots
        : [];
      const slots: AvailableSlot[] = rawSlots.filter(
        (slot): slot is AvailableSlot => {
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
            typeof candidate.bookedCount === "number" &&
            typeof candidate.patientLimit === "number" &&
            typeof candidate.remainingCount === "number" &&
            typeof candidate.isFull === "boolean" &&
            typeof candidate.appointmentFee === "number"
          );
        }
      );
      setAvailableSlots(slots);

      const params = new URLSearchParams(window.location.search);
      const requestedDoctorId = params.get("doctor");
      const requestedSlotId = params.get("slot");
      const requestedSlot = requestedSlotId
        ? slots.find((slot) => String(slot.id) === requestedSlotId)
        : undefined;
      const requestedDoctorSlot = requestedDoctorId
        ? slots.find((slot) => slot.doctorId === requestedDoctorId)
        : undefined;
      const initialSlot = requestedSlot ?? requestedDoctorSlot;

      if (initialSlot) {
        setSelectedHospital(initialSlot.hospital);
        setDoctorId(initialSlot.doctorId);
        if (requestedSlot) {
          setSlotId(String(requestedSlot.id));
        }
      }

      setSlotId((currentSlotId) =>
        slots.some((slot) => String(slot.id) === currentSlotId)
          ? currentSlotId
          : ""
      );
    } catch (err) {
      setAvailableSlots([]);
      setError(
        err instanceof Error ? err.message : "Failed to load available slots"
      );
    } finally {
      setLoadingSlots(false);
    }
  }, [router]);

  useEffect(() => {
    void loadAvailableSlots();
  }, [loadAvailableSlots]);

  const hospitalOptions = useMemo(() => {
    const filteredByDoctor = doctorId 
      ? availableSlots.filter(s => s.doctorId === doctorId)
      : availableSlots;
      
    const hospitals = Array.from(new Set(filteredByDoctor.map((s) => s.hospital)));
    return hospitals.map((h) => ({ value: h, label: h }));
  }, [availableSlots, doctorId]);

  const doctorOptions = useMemo(() => {
    const filteredByHospital = selectedHospital
      ? availableSlots.filter((s) => s.hospital === selectedHospital)
      : availableSlots;

    const map = new Map<string, { id: string; name: string }>();
    filteredByHospital.forEach((slot) => {
      if (!map.has(slot.doctorId)) {
        map.set(slot.doctorId, { id: slot.doctorId, name: slot.doctorName });
      }
    });
    return Array.from(map.values()).map((d) => ({
      value: d.id,
      label: d.name,
    }));
  }, [availableSlots, selectedHospital]);

  const filteredSlots = useMemo(() => {
    return availableSlots.filter((slot) => {
      const matchesHospital = selectedHospital ? slot.hospital === selectedHospital : true;
      const matchesDoctor = doctorId ? slot.doctorId === doctorId : true;
      return matchesHospital && matchesDoctor;
    });
  }, [availableSlots, selectedHospital, doctorId]);

  const slotsByDate = useMemo(() => {
    const grouped = new Map<string, AvailableSlot[]>();
    filteredSlots.forEach(slot => {
      if (!grouped.has(slot.date)) grouped.set(slot.date, []);
      grouped.get(slot.date)!.push(slot);
    });
    
    return Array.from(grouped.keys())
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map(date => ({
        date,
        slots: grouped.get(date)!.sort((a, b) => a.time.localeCompare(b.time))
      }));
  }, [filteredSlots]);

  const selectedSlot =
    availableSlots.find((slot) => String(slot.id) === slotId) || null;

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !slotId || !selectedHospital) {
      setError("Please fill in all fields (Hospital, Doctor, Slot).");
      return;
    }

    if (!selectedSlot) {
      setError("Please select a valid available time slot.");
      return;
    }

    setError("");
    setSubmitting(true);

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

      if (response.status === 401 || response.status === 403) {
        handlePatientSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to book appointment");
      }

      const appointment = payload.appointment;
      setPendingAppointmentId(appointment.id);
      setShowPaymentModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!pendingAppointmentId) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/patient/appointments/${pendingAppointmentId}/pay`, {
        method: "PATCH",
      });

      if (response.status === 401 || response.status === 403) {
        handlePatientSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to confirm payment");
      }

      await loadAvailableSlots();
      setShowPaymentModal(false);
      setSuccess(true);
      setReason("");
      setSlotId("");
      setDoctorId("");
      setSelectedHospital("");
      
      setTimeout(() => {
        router.push("/user-self/appointments");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to confirm payment"
      );
      setShowPaymentModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    router.push("/user-self/appointments");
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 py-6 px-3 sm:px-4 sm:py-8 lg:px-6">
      <div className="mx-auto w-full max-w-2xl">
        {success ? (
          <div className="relative overflow-hidden rounded-[2rem] border border-green-100 bg-white shadow-xl shadow-green-900/5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.05),transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.05),transparent_40%)]" />
            <div className="relative space-y-6 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 h-20 w-20 rounded-full bg-green-50 flex items-center justify-center shadow-sm">
                  <svg
                    className="h-10 w-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Appointment Confirmed
                </h2>
                <p className="mt-3 max-w-lg text-base text-slate-500">
                  Your appointment has been successfully booked. We've sent a
                  confirmation email with all the details.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center w-full">
                  <Link href="/user-self/appointments" className="flex-1">
                    <button className="w-full rounded-2xl bg-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 active:scale-[0.98]">
                      View My Appointments
                    </button>
                  </Link>
                  <Link href="/user-self/chats" className="flex-1">
                    <button type="button" className="w-full rounded-2xl border border-green-600 text-green-600 bg-white px-6 py-3.5 text-sm font-semibold shadow-sm transition-all hover:bg-green-50 active:scale-[0.98]">
                      Go to Chat
                    </button>
                  </Link>
                  <button
                    type="button"
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
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
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/40">
            <div className="relative space-y-8 p-6 sm:p-8 lg:p-10">
              <div className="mb-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Book an Appointment
                </h1>
                <p className="mt-2 text-base text-slate-500">
                  Select a hospital, choose a doctor, and pick a convenient time slot.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Hospital
                  </label>
                  <SearchableSelect
                    options={hospitalOptions}
                    value={selectedHospital}
                    onChange={(val) => {
                      setSelectedHospital(val);
                      setDoctorId(""); 
                      setSlotId(""); 
                    }}
                    placeholder="Search hospitals..."
                    disabled={loadingSlots || hospitalOptions.length === 0}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Doctor
                  </label>
                  <SearchableSelect
                    options={doctorOptions}
                    value={doctorId}
                    onChange={(val) => {
                      setDoctorId(val);
                      setSlotId(""); 
                    }}
                    placeholder="Search doctors..."
                    disabled={loadingSlots || doctorOptions.length === 0 || !selectedHospital}
                  />
                  
                  {doctorId && (
                    <div className="mt-3 flex items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-white to-emerald-50/30 p-4 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-bold text-emerald-700 shadow-inner">
                        {doctorOptions.find(d => d.value === doctorId)?.label.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "DR"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate">{doctorOptions.find(d => d.value === doctorId)?.label}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 truncate">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                            Available Now
                          </span>
                          <span>•</span>
                          <span className="truncate">{selectedHospital || "Multiple Locations"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-slate-900">
                    Available Time Slots
                  </label>
                  
                  {(!selectedHospital || !doctorId) ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      Please select a hospital and doctor to view available times.
                    </div>
                  ) : slotsByDate.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 mb-2">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <p className="text-slate-900 font-medium text-sm mb-1">Fully Booked</p>
                      <p className="text-slate-500 text-xs">No available slots for this doctor at this hospital.</p>
                    </div>
                  ) : (
                    <div className="space-y-5 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                      {slotsByDate.map((dateGroup) => (
                        <div key={dateGroup.date} className="space-y-2 animate-in fade-in">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                            {formatDateForDisplay(dateGroup.date)}
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                            {dateGroup.slots.map((slot) => {
                              const isSelected = slotId === String(slot.id);
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => setSlotId(String(slot.id))}
                                  className={`flex flex-col items-center justify-center rounded-xl py-2 px-1 text-xs font-semibold transition-all ${
                                    isSelected 
                                      ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600 ring-offset-1" 
                                      : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                                  }`}
                                >
                                  {formatTimeForDisplay(slot.time)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Reason for Visit (Optional)
                  </label>
                  <textarea
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-green-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-green-400/10 transition-all resize-none"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe your symptoms..."
                  />
                </div>

                {selectedSlot && (
                  <div className="rounded-2xl border border-green-100 bg-green-50/50 p-5">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-green-100 pb-3">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <svg
                            className="h-4 w-4 text-green-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-900">
                          Summary
                        </h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Doctor</span>
                          <span className="font-medium text-slate-900">
                            {selectedSlot.doctorName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Location</span>
                          <span className="font-medium text-slate-900">
                            {selectedSlot.hospital}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Date & Time</span>
                          <span className="font-medium text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                            {formatDateForDisplay(selectedSlot.date)} at{" "}
                            {formatTimeForDisplay(selectedSlot.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <div className="flex items-start gap-3">
                      <svg
                        className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {loadingSlots && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-500 text-sm text-center flex items-center justify-center gap-3">
                    <div className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    Loading available slots...
                  </div>
                )}

                {!loadingSlots && availableSlots.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                      <svg
                        className="h-6 w-6 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-slate-900 font-medium text-sm mb-1">No Availability</p>
                    <p className="text-slate-500 text-sm">
                      No doctors or hospitals are currently available. Please check back later.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBookAppointment}
                  disabled={submitting || loadingSlots || !doctorId || !slotId || !selectedHospital}
                  className="mt-4 w-full rounded-2xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <MockPaymentGateway
          amount={selectedSlot?.appointmentFee ? `Rs. ${selectedSlot.appointmentFee.toFixed(2)}` : "Rs. 3,500.00"}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
          isProcessing={submitting}
        />
      )}
    </div>
  );
};

export default BookAppointmentPage;
