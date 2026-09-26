"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface PatientProfile {
  id: number;
  full_name: string;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  emergency_contact_email: string;
}

interface ActivityLogItem {
  id: number | string;
  user_email: string | null;
  hospital_id: number | string | null;
  action: string;
  model_name: string;
  object_id: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

interface AppointmentItem {
  id: number | string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  department: string;
  statusLabel: string;
  status: string;
  queueNumber?: number;
}

const ACTION_LABELS: Record<string, string> = {
  doctor_created_by_admin: "Doctor account created",
  doctor_delinked_by_admin: "Doctor removed from hospital",
};

function formatAction(action: string) {
  return ACTION_LABELS[action] || action.replace(/_/g, " ");
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"appointments" | "logs">("appointments");
  const [logSearch, setLogSearch] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!patientId) return;
      setLoading(true);
      setError("");

      try {
        const [profRes, logsRes, apptsRes] = await Promise.all([
          fetch(`/api/hospital/patients/${patientId}/`),
          fetch(`/api/hospital/patients/${patientId}/logs/`),
          fetch(`/api/hospital/patients/${patientId}/appointments/`),
        ]);

        if (!profRes.ok) {
          const payload = await profRes.json().catch(() => ({}));
          throw new Error(payload?.detail || "You do not have permission to view this patient (they may not have booked at your hospital).");
        }

        const profData = await profRes.json();
        const logsData = await logsRes.json();
        const apptsData = await apptsRes.json();

        if (mounted) {
          setProfile(profData);
          setLogs(Array.isArray(logsData) ? logsData : []);
          setAppointments(Array.isArray(apptsData) ? apptsData : []);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-500 font-medium animate-pulse">Loading patient data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center mt-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-red-900 mb-2">Access Denied or Not Found</h3>
        <p className="text-base text-red-700">{error}</p>
        <button
          onClick={() => router.push("/hospital/patients")}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const filteredLogs = logs.filter((log) => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      formatAction(log.action).toLowerCase().includes(q) ||
      log.model_name.toLowerCase().includes(q) ||
      log.object_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/hospital/patients" className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{profile.full_name}</h1>
            <p className="text-sm text-slate-500 mt-1">Patient ID: P-{profile.id}</p>
          </div>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Contact Information
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-slate-500">Email Address</dt>
              <dd className="mt-1 text-base text-slate-900">{profile.email || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Phone Number</dt>
              <dd className="mt-1 text-base text-slate-900">{profile.phone || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Address</dt>
              <dd className="mt-1 text-base text-slate-900">
                {[profile.address, profile.city, profile.postal_code, profile.country].filter(Boolean).join(", ") || "N/A"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Emergency Contact
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-slate-500">Name & Relation</dt>
              <dd className="mt-1 text-base text-slate-900">
                {profile.emergency_contact_name || "N/A"}
                {profile.emergency_contact_relation && <span className="text-slate-500 ml-2">({profile.emergency_contact_relation})</span>}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Phone</dt>
              <dd className="mt-1 text-base text-slate-900">{profile.emergency_contact_phone || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Email</dt>
              <dd className="mt-1 text-base text-slate-900">{profile.emergency_contact_email || "N/A"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === "appointments" ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            Hospital Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === "logs" ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            Activity Logs ({logs.length})
          </button>
        </div>

        <div className="p-0">
          {activeTab === "appointments" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Queue No.</th>
                    <th className="px-6 py-4 font-semibold">Date & Time</th>
                    <th className="px-6 py-4 font-semibold">Doctor</th>
                    <th className="px-6 py-4 font-semibold">Department</th>
                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No appointments found for this hospital.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {appt.queueNumber ? (
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm">
                              {appt.queueNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{appt.appointmentDate}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{appt.appointmentTime}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">Dr. {appt.doctorName}</td>
                        <td className="px-6 py-4">{appt.department}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            appt.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                            appt.status === "cancelled" || appt.status === "rejected" ? "bg-rose-100 text-rose-700" :
                            appt.status === "accepted" ? "bg-blue-100 text-blue-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {appt.statusLabel}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <input
                  type="text"
                  placeholder="Search logs by action, record type, or record ID..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Time</th>
                    <th className="px-6 py-4 font-semibold">Action</th>
                    <th className="px-6 py-4 font-semibold">Record Type</th>
                    <th className="px-6 py-4 font-semibold">Record ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        {logSearch ? "No activity logs match your search." : "No activity logs found for this patient."}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 capitalize">
                          {formatAction(log.action)}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{log.model_name}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 font-mono">
                            {log.object_id}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
