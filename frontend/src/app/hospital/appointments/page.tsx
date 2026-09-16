"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminHospitals,
  type HospitalAdminItem,
} from "@/lib/api/hospitalSlots";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import SlideOverDrawer from "@/components/modals/SlideOverDrawer";
import { User, Calendar, Clock, Activity, Phone, AlertCircle } from "lucide-react";
import { AppointmentTabs, AppointmentCategory } from "@/components/appointments/AppointmentTabs";

type AppointmentStatus = "Pending" | "Confirmed" | "Completed";

interface AppointmentItem {
  id: number;
  patientId: string;
  patientName: string;
  patientAge: number | null;
  patientGender: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  department: string;
  statusLabel: AppointmentStatus | string;
  status: string;
  cancellationReason?: string;
  cancelledBy?: string;
}

const statusStyles: Record<string, string> = {
  Confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Completed: "bg-slate-100 text-slate-700 ring-slate-200",
  Cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  "Cancellation Requested": "bg-orange-50 text-orange-700 ring-orange-200",
};

export default function HospitalAppointmentsPage() {
  const [hospitals, setHospitals] = useState<HospitalAdminItem[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [activeTab, setActiveTab] = useState<AppointmentCategory>("ALL");
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);

  const [acceptDialog, setAcceptDialog] = useState<{isOpen: boolean, appointmentId: number | null}>({isOpen: false, appointmentId: null});
  const [cancelDialog, setCancelDialog] = useState<{isOpen: boolean, appointmentId: number | null, reason: string}>({isOpen: false, appointmentId: null, reason: ""});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAcceptCancellation = async () => {
    if (!acceptDialog.appointmentId) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/hospital/appointments/${acceptDialog.appointmentId}/accept-cancellation/`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to accept cancellation");
      setAppointments(prev => prev.map(a => a.id === acceptDialog.appointmentId ? { ...a, statusLabel: "Cancelled", status: "CANCELLED" } : a));
      if (selectedAppointment?.id === acceptDialog.appointmentId) {
        setSelectedAppointment(prev => prev ? { ...prev, statusLabel: "Cancelled", status: "CANCELLED" } : null);
      }
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsProcessing(false);
      setAcceptDialog({isOpen: false, appointmentId: null});
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelDialog.appointmentId) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/hospital/appointments/${cancelDialog.appointmentId}/cancel/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelDialog.reason }),
      });
      if (!response.ok) throw new Error("Failed to cancel appointment");
      setAppointments(prev => prev.map(a => a.id === cancelDialog.appointmentId ? { ...a, statusLabel: "Cancelled", status: "CANCELLED", cancellationReason: cancelDialog.reason, cancelledBy: "ADMIN" } : a));
      if (selectedAppointment?.id === cancelDialog.appointmentId) {
        setSelectedAppointment(prev => prev ? { ...prev, statusLabel: "Cancelled", status: "CANCELLED", cancellationReason: cancelDialog.reason, cancelledBy: "ADMIN" } : null);
      }
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsProcessing(false);
      setCancelDialog({isOpen: false, appointmentId: null, reason: ""});
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingHospitals(true);
      try {
        const payload = await fetchAdminHospitals();
        const list = Array.isArray(payload?.hospitals) ? payload.hospitals : [];
        if (mounted) {
          setHospitals(list);
          const first = list[0];
          if (first) {
            setSelectedHospitalId(String(first.hospital ?? first.id ?? ""));
          }
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoadingHospitals(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedHospitalId) {
      setAppointments([]);
      setLoadingAppointments(false);
      return;
    }

    let mounted = true;
    (async () => {
      setLoadingAppointments(true);
      setError("");
      try {
        const response = await fetch(
          `/api/hospital/appointments?hospital_id=${selectedHospitalId}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(
            payload?.error || payload?.detail || "Failed to load appointments",
          );
        }

        const payload = await response.json();
        if (mounted) {
          setAppointments(
            Array.isArray(payload?.appointments) ? payload.appointments : [],
          );
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoadingAppointments(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedHospitalId]);

  const departmentOptions = useMemo(() => {
    const unique = new Set<string>();
    appointments.forEach((appointment) => {
      if (appointment.department) unique.add(appointment.department);
    });
    return Array.from(unique).sort((left, right) => left.localeCompare(right));
  }, [appointments]);

  const categorized = useMemo(() => {
    const buckets: Record<AppointmentCategory, AppointmentItem[]> = {
      ALL: [],
      UPCOMING: [],
      COMPLETED: [],
      CANCELLED: [],
      EXPIRED: [],
    };
    
    appointments.forEach(appt => {
      buckets.ALL.push(appt);
      
      const st = (appt.status || "").toUpperCase();
      const isPast = new Date(`${appt.appointmentDate}T${appt.appointmentTime}`) < new Date();
      
      if (st === "COMPLETED") {
        buckets.COMPLETED.push(appt);
      } else if (st === "CANCELLED" || st === "REJECTED" || st === "CANCELLATION_REQUESTED") {
        buckets.CANCELLED.push(appt);
      } else if (st === "EXPIRED" || ((st === "PENDING" || st === "ACCEPTED" || st === "CONFIRMED") && isPast)) {
        buckets.EXPIRED.push(appt);
      } else {
        buckets.UPCOMING.push(appt);
      }
    });
    
    return buckets;
  }, [appointments]);

  const counts = useMemo(() => {
    return {
      ALL: categorized.ALL.length,
      UPCOMING: categorized.UPCOMING.length,
      COMPLETED: categorized.COMPLETED.length,
      CANCELLED: categorized.CANCELLED.length,
      EXPIRED: categorized.EXPIRED.length,
    };
  }, [categorized]);

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const items = categorized[activeTab] || [];

    return items.filter((appointment) => {
      const searchableFields = [appointment.patientName, appointment.patientId]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || searchableFields.includes(query);
      const matchesDate =
        !selectedDate || appointment.appointmentDate === selectedDate;
      const matchesDepartment =
        !selectedDepartment || appointment.department === selectedDepartment;

      return matchesSearch && matchesDate && matchesDepartment;
    });
  }, [
    categorized,
    activeTab,
    searchQuery,
    selectedDate,
    selectedDepartment,
  ]);

  const visibleCount = filteredAppointments.length;
  const totalCount = appointments.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Patient Appointments
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Patient Appointments
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              View booked appointments for your hospital, search by patient name
              or ID, and filter by date, doctor or department, and appointment
              status.
            </p>
          </div>

          <div className="w-full lg:w-[320px]">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Hospital Branch
            </label>
            <select
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              value={selectedHospitalId}
              onChange={(event) => setSelectedHospitalId(event.target.value)}
              disabled={loadingHospitals || hospitals.length === 0}
            >
              {hospitals.length === 0 ? (
                <option value="">No hospitals available</option>
              ) : (
                hospitals.map((hospital) => {
                  const id = String(hospital.hospital ?? hospital.id ?? "");
                  const label =
                    hospital.hospitalName || hospital.name || `Hospital ${id}`;
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        </div>

        <div className="mt-6">
          <AppointmentTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            counts={counts} 
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by patient name or patient ID"
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Appointment Date
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Doctor / Department
            </span>
            <select
              value={selectedDepartment}
              onChange={(event) => setSelectedDepartment(event.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Doctors / Departments</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            {visibleCount} shown
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            {totalCount} total
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
            Clean dashboard layout
          </span>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Patient Appointment List
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Basic appointment records for quick hospital administration
                review.
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {loadingAppointments
                ? "Loading appointments..."
                : `${visibleCount} records`}
            </p>
          </div>
        </div>

        {loadingAppointments ? (
          <div className="space-y-4 p-6 sm:p-8">
            <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-10 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-600">
              No appointments match the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="min-w-[1100px] w-full text-left text-sm relative border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md text-xs uppercase tracking-wider text-slate-500 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold border-b border-slate-200">Patient Name</th>
                  <th className="px-4 py-4 font-semibold border-b border-slate-200">Patient ID</th>
                  <th className="px-4 py-4 font-semibold border-b border-slate-200">Age</th>
                  <th className="px-4 py-4 font-semibold border-b border-slate-200">Gender</th>
                  <th className="px-4 py-4 font-semibold border-b border-slate-200">Contact Number</th>
                  <th className="px-4 py-4 font-semibold border-b border-slate-200">Date</th>
                  <th className="px-4 py-4 font-semibold border-b border-slate-200">Time</th>
                  <th className="px-4 py-4 font-semibold border-b border-slate-200">Doctor / Dept</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-200">Status</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-200 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="transition-colors hover:bg-emerald-50/40"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {appointment.patientName}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-600">
                      {appointment.patientId}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {appointment.patientAge ?? "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {appointment.patientGender || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {appointment.patientPhone || "-"}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-slate-600">
                      {appointment.appointmentDate}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-slate-600">
                      {appointment.appointmentTime}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800">
                        {appointment.doctorName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {appointment.department || "General"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                          appointment.status === "EXPIRED" 
                            ? "bg-slate-100 text-slate-700 ring-slate-200" 
                            : statusStyles[appointment.statusLabel] || "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {appointment.status === "EXPIRED" ? "Expired" : appointment.statusLabel}
                      </span>
                      {appointment.cancellationReason && (
                        <div className="mt-2 max-w-[150px] text-[10px] text-slate-500 line-clamp-2" title={appointment.cancellationReason}>
                          Reason: {appointment.cancellationReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedAppointment(appointment)}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:text-emerald-800"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmationDialog
        isOpen={acceptDialog.isOpen}
        title="Accept Cancellation"
        message="Are you sure you want to accept this cancellation request from the patient?"
        confirmText="Accept"
        confirmButtonClass="bg-orange-500 hover:bg-orange-600"
        isLoading={isProcessing}
        onConfirm={handleAcceptCancellation}
        onCancel={() => setAcceptDialog({isOpen: false, appointmentId: null})}
      />

      {cancelDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-black">Cancel Appointment</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-3">Please provide a reason for cancelling this appointment.</p>
              <textarea
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                rows={3}
                placeholder="Reason (optional)"
                value={cancelDialog.reason}
                onChange={(e) => setCancelDialog(prev => ({...prev, reason: e.target.value}))}
              />
            </div>
            <div className="border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={() => setCancelDialog({isOpen: false, appointmentId: null, reason: ""})}
                disabled={isProcessing}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-60"
              >
                Back
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={isProcessing}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-60"
              >
                {isProcessing ? "Processing..." : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SlideOverDrawer
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        title="Appointment Details"
      >
        {selectedAppointment && (
          <div className="space-y-8 pb-8 animate-in slide-in-from-right-4 duration-300">
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
                  selectedAppointment.status === "EXPIRED" 
                    ? "bg-slate-100 text-slate-700 ring-slate-200"
                    : statusStyles[selectedAppointment.statusLabel] ||
                      "bg-slate-100 text-slate-700 ring-slate-200"
                }`}
              >
                {selectedAppointment.status === "EXPIRED" ? "Expired" : selectedAppointment.statusLabel}
              </span>
              <span className="text-xs font-medium text-slate-500">
                ID: #{selectedAppointment.id}
              </span>
            </div>

            {/* Patient Info Card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <User className="h-4 w-4 text-emerald-500" />
                Patient Information
              </h3>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <div className="text-xs font-medium text-slate-400">Name</div>
                  <div className="mt-1 font-semibold text-slate-900">{selectedAppointment.patientName}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400">System ID</div>
                  <div className="mt-1 font-medium text-slate-700">{selectedAppointment.patientId}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400">Age / Gender</div>
                  <div className="mt-1 font-medium text-slate-700">
                    {selectedAppointment.patientAge ?? "N/A"} • {selectedAppointment.patientGender || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400">Contact</div>
                  <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-700">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {selectedAppointment.patientPhone || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Details Card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <Activity className="h-4 w-4 text-emerald-500" />
                Clinical Details
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-50 pb-3">
                  <span className="text-slate-500">Doctor</span>
                  <span className="font-semibold text-slate-900">{selectedAppointment.doctorName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-3">
                  <span className="text-slate-500">Department</span>
                  <span className="font-medium text-slate-700">{selectedAppointment.department || "General"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 pb-3">
                  <span className="text-slate-500">Date</span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Calendar className="h-3 w-3 text-emerald-500" />
                    {selectedAppointment.appointmentDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time</span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Clock className="h-3 w-3 text-emerald-500" />
                    {selectedAppointment.appointmentTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Details if present */}
            {selectedAppointment.cancellationReason && (
              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-800">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Cancellation Info
                </h3>
                <div className="text-sm text-red-700">
                  <span className="font-semibold block mb-1">Reason:</span>
                  <p className="bg-white/60 p-3 rounded-lg border border-red-100">
                    {selectedAppointment.cancellationReason}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-3 border-t border-slate-100">
              {selectedAppointment.status === "CANCELLATION_REQUESTED" && (
                <button
                  onClick={() => setAcceptDialog({isOpen: true, appointmentId: selectedAppointment.id})}
                  className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  Accept Cancellation Request
                </button>
              )}
              
              {(selectedAppointment.status === "PENDING" || selectedAppointment.status === "ACCEPTED") && (
                <button
                  onClick={() => setCancelDialog({isOpen: true, appointmentId: selectedAppointment.id, reason: ""})}
                  className="w-full rounded-xl border-2 border-rose-100 bg-white py-3 text-sm font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 hover:border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={new Date(`${selectedAppointment.appointmentDate}T${selectedAppointment.appointmentTime}`) < new Date()}
                  title={new Date(`${selectedAppointment.appointmentDate}T${selectedAppointment.appointmentTime}`) < new Date() ? "Cannot cancel an expired appointment" : ""}
                >
                  Cancel Appointment
                </button>
              )}
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
