"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchAdminHospitals,
  type HospitalAdminItem,
} from "@/lib/api/hospitalSlots";

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
}

const statusStyles: Record<string, string> = {
  Confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Completed: "bg-slate-100 text-slate-700 ring-slate-200",
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
  const [selectedStatus, setSelectedStatus] = useState("All");

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
    if (!selectedHospitalId) return;

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

  const filteredAppointments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const searchableFields = [appointment.patientName, appointment.patientId]
        .join(" ")
        .toLowerCase();
      const matchesSearch = !query || searchableFields.includes(query);
      const matchesDate =
        !selectedDate || appointment.appointmentDate === selectedDate;
      const matchesDepartment =
        !selectedDepartment || appointment.department === selectedDepartment;
      const matchesStatus =
        selectedStatus === "All" || appointment.statusLabel === selectedStatus;

      return matchesSearch && matchesDate && matchesDepartment && matchesStatus;
    });
  }, [
    appointments,
    searchQuery,
    selectedDate,
    selectedDepartment,
    selectedStatus,
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

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <label className="lg:col-span-2">
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
              Appointment Status
            </span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
            </select>
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
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Patient Name</th>
                  <th className="px-4 py-4 font-semibold">Patient ID</th>
                  <th className="px-4 py-4 font-semibold">Age</th>
                  <th className="px-4 py-4 font-semibold">Gender</th>
                  <th className="px-4 py-4 font-semibold">Contact Number</th>
                  <th className="px-4 py-4 font-semibold">Appointment Date</th>
                  <th className="px-4 py-4 font-semibold">Appointment Time</th>
                  <th className="px-4 py-4 font-semibold">
                    Doctor / Department
                  </th>
                  <th className="px-6 py-4 font-semibold">Status</th>
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
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[appointment.statusLabel] || "bg-slate-100 text-slate-700 ring-slate-200"}`}
                      >
                        {appointment.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
