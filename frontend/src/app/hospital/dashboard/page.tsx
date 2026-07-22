"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSlotTemplates, fetchAdminHospitals } from "@/lib/api/hospitalSlots";

type PeriodKey = "daily" | "weekly" | "monthly";

type DoctorAppointmentCount = {
  id: number;
  name: string;
  daily: number;
  weekly: number;
  monthly: number;
  appointment_fee: number;
  patient_count: number;
  income: Record<PeriodKey, number>;
};

type AppointmentAnalytics = {
  periods: Record<PeriodKey, { start: string; end: string }>;
  doctors: DoctorAppointmentCount[];
};

const lkrFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

function AppointmentChart({
  title,
  subtitle,
  period,
  doctors,
}: {
  title: string;
  subtitle: string;
  period: PeriodKey;
  doctors: DoctorAppointmentCount[];
}) {
  const maximum = Math.max(1, ...doctors.map((doctor) => doctor[period]));
  const axisMaximum = maximum <= 5 ? 5 : Math.ceil(maximum / 5) * 5;
  const ticks = Array.from({ length: 6 }, (_, index) => Math.round((axisMaximum * (5 - index)) / 5));

  return (
    <article className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
        <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>
      </div>
      {doctors.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
          No affiliated doctors found.
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[420px]">
            <div className="flex h-64 w-9 shrink-0 flex-col justify-between pb-10 pr-2 text-right text-[10px] font-medium tabular-nums text-slate-400">
              {ticks.map((tick, index) => <span key={`${tick}-${index}`}>{tick}</span>)}
            </div>
            <div className="relative h-64 min-w-0 flex-1 border-b border-l border-slate-200">
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-10 flex flex-col justify-between">
                {ticks.map((tick, index) => (
                  <div key={`${tick}-${index}`} className="border-t border-dashed border-slate-200" />
                ))}
              </div>
              <div
                className="absolute inset-x-2 top-0 bottom-10 grid items-end gap-2"
                style={{ gridTemplateColumns: `repeat(${doctors.length}, minmax(32px, 1fr))` }}
              >
                {doctors.map((doctor) => {
                  const count = doctor[period];
                  const barHeight = count === 0 ? 0 : Math.max(4, (count / axisMaximum) * 100);
                  return (
                    <div key={doctor.id} className="group relative flex h-full items-end justify-center">
                      <span
                        className="absolute z-10 -translate-y-1 text-xs font-bold tabular-nums text-emerald-700"
                        style={{ bottom: `${barHeight}%` }}
                      >
                        {count}
                      </span>
                      <div
                        className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 shadow-[0_-4px_14px_rgba(16,185,129,0.18)] transition-all duration-500 group-hover:from-emerald-700 group-hover:to-teal-500"
                        style={{ height: `${barHeight}%` }}
                        role="img"
                        aria-label={`${doctor.name}: ${count} appointments`}
                        title={`${doctor.name}: ${count} appointments`}
                      />
                    </div>
                  );
                })}
              </div>
              <div
                className="absolute inset-x-2 bottom-0 grid h-10 items-start gap-2 pt-2"
                style={{ gridTemplateColumns: `repeat(${doctors.length}, minmax(32px, 1fr))` }}
              >
                {doctors.map((doctor) => (
                  <span key={doctor.id} className="truncate text-center text-[10px] font-semibold text-slate-500" title={doctor.name}>
                    {doctor.name.replace(/^Dr\.?\s*/i, "Dr. ")}
                  </span>
                ))}
              </div>
              <span className="absolute -left-8 top-1/2 -rotate-90 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                Count
              </span>
              <div className="sr-only">
                {doctors.map((doctor) => (
                  <span key={doctor.id}>{doctor.name}: {doctor[period]} appointments. </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default function HospitalAdminDashboard() {
  const [hospitalName, setHospitalName] = useState<string>("");
  const [adminName, setAdminName] = useState<string>("");
  const [hospitalId, setHospitalId] = useState<string>("");
  const [stats, setStats] = useState({
    doctorsCount: 0,
    templatesCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [analytics, setAnalytics] = useState<AppointmentAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      let currentHospitalId = "";

      // Fallback data from cached login payload, used until the profile call resolves
      const userInfo = typeof window !== "undefined" ? localStorage.getItem("userInfo") : null;
      if (userInfo) {
        try {
          const u = JSON.parse(userInfo);
          if (u?.hospitals && u.hospitals[0]) {
            currentHospitalId = String(u.hospitals[0].id);
            setHospitalId(currentHospitalId);
            setHospitalName(u.hospitals[0].name || "Hospital");
          }
        } catch { }
      }

      // 1. Fetch Hospital Admin Profile
      try {
        const res = await fetch("/api/hospital/profile", { method: "GET", credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data?.full_name) setAdminName(data.full_name);
          if (data?.hospitals?.[0]) {
            currentHospitalId = String(data.hospitals[0].id);
            setHospitalId(currentHospitalId);
            setHospitalName(data.hospitals[0].name || "Hospital");
          }
        }
      } catch (err) {
        console.error("Profile API error:", err);
      }

      // 2. Fetch Active Hospitals & Doctor Counts
      try {
        const hospitalsPayload = await fetchAdminHospitals();
        const firstHospital = hospitalsPayload?.hospitals?.[0];
        if (firstHospital && !currentHospitalId) {
          currentHospitalId = String(firstHospital.hospital ?? firstHospital.id ?? "");
        }

        if (currentHospitalId) {
          // Fetch available doctors
          const docRes = await fetch("/api/hospital/available-doctors");
          let docCount = 0;
          if (docRes.ok) {
            const docData = await docRes.json();
            const docs: Array<{ is_added?: boolean }> = Array.isArray(docData.doctors) ? docData.doctors : [];
            docCount = docs.filter((doctor) => doctor.is_added).length;
          }

          // Fetch slot templates count
          let tempCount = 0;
          try {
            const templatesPayload = await fetchSlotTemplates(currentHospitalId);
            const templates = Array.isArray(templatesPayload)
              ? templatesPayload
              : templatesPayload?.slot_templates || templatesPayload?.templates || templatesPayload?.results || [];
            tempCount = templates.length;
          } catch { }

          setStats({
            doctorsCount: docCount,
            templatesCount: tempCount,
          });
        }
      } catch (err) {
        console.error("Dashboard stats loader error:", err);
      } finally {
        setLoadingStats(false);
      }

      try {
        const analyticsResponse = await fetch("/api/hospital/appointment-analytics", {
          credentials: "include",
          cache: "no-store",
        });
        const analyticsPayload = await analyticsResponse.json().catch(() => ({}));
        if (!analyticsResponse.ok) {
          throw new Error(analyticsPayload?.detail || analyticsPayload?.error || "Failed to load appointment graphs");
        }
        setAnalytics(analyticsPayload as AppointmentAnalytics);
      } catch (err) {
        setAnalyticsError(err instanceof Error ? err.message : "Failed to load appointment graphs");
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner Card */}
      <section className="relative overflow-hidden rounded-[2rem] border border-emerald-100/70 bg-white/80 p-6 sm:p-8 lg:p-10 shadow-[0_24px_80px_rgba(16,185,129,0.06)] backdrop-blur">
        <div className="absolute right-0 top-0 h-48 w-48 translate-x-1/4 -translate-y-1/4 rounded-full bg-emerald-100/50 blur-3xl" aria-hidden="true" />
        <div className="absolute left-1/3 bottom-0 h-36 w-36 rounded-full bg-emerald-100/40 blur-2xl" aria-hidden="true" />
 
        <div className="relative flex flex-col lg:flex-row gap-8 items-center justify-between">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold tracking-[0.2em] text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM PORTAL
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Welcome back{adminName ? `, ${adminName}` : ""}!
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600">
              Manage your medical staff, verify doctor associations, customize appointment slot templates, and generate calendars from your dedicated command center{hospitalName ? ` at ${hospitalName}` : ""}.
            </p>
          </div>
 
          <div className="w-full lg:max-w-sm rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Overview Stats</p>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-slate-400 text-sm">Affiliated Doctors</span>
                <span className="font-bold text-lg text-white">
                  {loadingStats ? (
                    <span className="inline-block h-4 w-6 bg-slate-800 animate-pulse rounded" />
                  ) : (
                    stats.doctorsCount
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-slate-400 text-sm">Active Slot Templates</span>
                <span className="font-bold text-lg text-white">
                  {loadingStats ? (
                    <span className="inline-block h-4 w-6 bg-slate-800 animate-pulse rounded" />
                  ) : (
                    stats.templatesCount
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Status</span>
                <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Appointments by Doctor</h2>
            <p className="mt-1 text-sm text-slate-500">Active scheduled appointments; cancelled and rejected bookings are excluded.</p>
          </div>
        </div>
        {analyticsError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{analyticsError}</div>
        ) : !analytics ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-3xl bg-white/70" />)}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <AppointmentChart title="Daily" subtitle={analytics.periods.daily.start} period="daily" doctors={analytics.doctors} />
              <AppointmentChart title="Weekly" subtitle={`${analytics.periods.weekly.start} to ${analytics.periods.weekly.end}`} period="weekly" doctors={analytics.doctors} />
              <AppointmentChart title="Monthly" subtitle={`${analytics.periods.monthly.start} to ${analytics.periods.monthly.end}`} period="monthly" doctors={analytics.doctors} />
            </div>

            <article className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="text-lg font-bold text-slate-950">Individual Doctor Income</h3>
                <p className="mt-1 text-xs text-slate-500">Patient totals are unique per doctor. Income is calculated from completed appointments × the current appointment fee.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Doctor</th>
                      <th className="px-4 py-4 text-right font-semibold">Patients</th>
                      <th className="px-4 py-4 text-right font-semibold">Fee</th>
                      <th className="px-4 py-4 text-right font-semibold">Daily income</th>
                      <th className="px-4 py-4 text-right font-semibold">Weekly income</th>
                      <th className="px-6 py-4 text-right font-semibold">Monthly income</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.doctors.map((doctor) => (
                      <tr key={doctor.id} className="transition-colors hover:bg-emerald-50/50">
                        <td className="px-6 py-4 font-semibold text-slate-800">{doctor.name}</td>
                        <td className="px-4 py-4 text-right font-bold tabular-nums text-sky-700">{doctor.patient_count}</td>
                        <td className="px-4 py-4 text-right tabular-nums text-slate-600">{lkrFormatter.format(doctor.appointment_fee)}</td>
                        <td className="px-4 py-4 text-right font-semibold tabular-nums text-emerald-700">{lkrFormatter.format(doctor.income.daily)}</td>
                        <td className="px-4 py-4 text-right font-semibold tabular-nums text-emerald-700">{lkrFormatter.format(doctor.income.weekly)}</td>
                        <td className="px-6 py-4 text-right font-bold tabular-nums text-emerald-800">{lkrFormatter.format(doctor.income.monthly)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </div>
        )}
      </section>

      {/* Quick Action Navigation Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2.5">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Operations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link
            href="/hospital/doctors"
            className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-950">Manage Doctor Listing</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Add registered practitioners, remove doctor affiliations, or create direct doctor profiles for your hospital.
            </p>
            <div className="mt-6 flex items-center text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
              Go to Doctors
              <svg className="ml-1.5 h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 2 */}
          <Link
            href="/hospital/slots"
            className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-950">Configure Appointment Slots</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Set standard weekly shift templates for doctors, set patient limits, and generate calendar entries.
            </p>
            <div className="mt-6 flex items-center text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
              Go to Slots
              <svg className="ml-1.5 h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 3 */}
          <Link
            href="/hospital/profile"
            className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 mb-5 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-950">Hospital Admin Profile</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Review your verified professional credentials, corporate designation details, and linked hospital branches.
            </p>
            <div className="mt-6 flex items-center text-xs font-semibold text-purple-600 group-hover:text-purple-700">
              View Profile
              <svg className="ml-1.5 h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 4 */}
          <Link
            href="/hospital/reports"
            className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-5 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-950">Reports</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Track total appointments, recent bookings, and slot fill rates for your hospital.
            </p>
            <div className="mt-6 flex items-center text-xs font-semibold text-sky-600 group-hover:text-sky-700">
              View Reports
              <svg className="ml-1.5 h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 5 */}
          <Link
            href="/hospital/activity-logs"
            className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-950">Activity Log</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Review an audit trail of doctor additions, removals, and other admin actions.
            </p>
            <div className="mt-6 flex items-center text-xs font-semibold text-amber-600 group-hover:text-amber-700">
              View Activity Log
              <svg className="ml-1.5 h-3 w-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}