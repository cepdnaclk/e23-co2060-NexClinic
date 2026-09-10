"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";

interface LinkedHospital {
  id: string | number;
  name: string;
}

interface AdminUserInfo {
  email: string;
  role: string;
  hospitals: LinkedHospital[];
  full_name?: string;
  nic_number?: string;
  phone?: string;
  address?: string;
  employee_id?: string;
  designation?: string;
  date_of_joining?: string;
}

export default function HospitalAdminProfilePage() {
  const [adminInfo, setAdminInfo] = useState<AdminUserInfo | null>(null);

  useEffect(() => {
    const userInfo = typeof window !== "undefined" ? localStorage.getItem("userInfo") : null;
    if (userInfo) {
      try {
        setAdminInfo(JSON.parse(userInfo));
      } catch (err) {
        console.error("Failed to parse userInfo", err);
      }
    }

    (async () => {
      try {
        const res = await fetch("/api/hospital/profile", { method: "GET", credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setAdminInfo((prev) => ({
          ...prev,
          email: data.email,
          role: prev?.role || "HOSPITAL_ADMIN",
          full_name: data.full_name,
          nic_number: data.nic_number,
          phone: data.phone,
          address: data.address,
          employee_id: data.employee_id,
          designation: data.designation,
          date_of_joining: data.date_of_joining,
          hospitals: Array.isArray(data.hospitals) ? data.hospitals : prev?.hospitals || [],
        }));
      } catch (err) {
        console.error("Failed to load hospital admin profile", err);
      }
    })();
  }, []);

  const displayName = adminInfo?.full_name || adminInfo?.designation || "Hospital Administrator";

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Profile Header Card */}
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 sm:p-8 shadow-sm backdrop-blur relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/4 -translate-y-1/4 rounded-full bg-emerald-100/50 blur-3xl" />
        
        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Icon */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-500 shadow-lg shadow-emerald-500/20">
            <User className="h-10 w-10" />
          </div>

          <div className="text-center sm:text-left min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900 truncate">{displayName}</h1>
            <p className="text-sm font-semibold text-emerald-600 mt-1 uppercase tracking-wider">{adminInfo?.designation || "Operations Admin"}</p>
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                Hospital Role: Admin
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                Status: Active Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Card: Account details */}
        <div className="md:col-span-2 rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
              Credentials & Contact Details
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Primary Email Address</p>
                <p className="text-sm font-medium text-slate-800 mt-1 break-words">{adminInfo?.email || "Not Available"}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Phone Number</p>
                <p className="text-sm font-medium text-slate-800 mt-1">{adminInfo?.phone || "Not Configured"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">National Identity (NIC)</p>
                <p className="text-sm font-medium text-slate-800 mt-1">{adminInfo?.nic_number || "Not Configured"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Date of Joining</p>
                <p className="text-sm font-medium text-slate-800 mt-1">{adminInfo?.date_of_joining || "Not Configured"}</p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-slate-400 uppercase">Work Location Address</p>
                <p className="text-sm font-medium text-slate-800 mt-1">{adminInfo?.address || "Not Configured"}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
              Employment Details
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Employee Identification Code</p>
                <p className="text-sm font-mono text-slate-800 mt-1">{adminInfo?.employee_id || "Not Configured"}</p>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase">Assigned Designation</p>
                <p className="text-sm font-medium text-slate-800 mt-1">{adminInfo?.designation || "Operations Coordinator"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Linked Facilities & Privileges */}
        <div className="space-y-6">
          {/* Linked Facilities */}
          <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
              Associated Clinics
            </h3>
            <div className="space-y-3">
              {adminInfo?.hospitals && adminInfo.hospitals.length > 0 ? (
                adminInfo.hospitals.map((hosp) => (
                  <div key={hosp.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-slate-800 truncate">{hosp.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No linked hospital accounts found.</p>
              )}
            </div>
          </div>

          {/* Access Permissions info */}
          <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
              Security Roles
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Manage verified doctor list
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Configure doctor shift templates
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Trigger calendar slot generation
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Create direct doctor logins
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
