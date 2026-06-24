"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSlotTemplates, fetchAdminHospitals } from "@/lib/api/hospitalSlots";

export default function HospitalAdminDashboard() {
  const [hospitalName, setHospitalName] = useState<string>("");
  const [hospitalId, setHospitalId] = useState<string>("");
  const [stats, setStats] = useState({
    doctorsCount: 0,
    templatesCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      let currentHospitalId = "";

      // 1. Fetch Hospital Profile
      try {
        const res = await fetch("/api/hospital/profile", { method: "GET", credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setHospitalName(data?.name || "Hospital");
        }
      } catch (err) {
        console.error("Profile API error:", err);
      }

      // Fallback/fallback fetch for hospital admin profile
      const userInfo = typeof window !== "undefined" ? localStorage.getItem("userInfo") : null;
      if (userInfo) {
        try {
          const u = JSON.parse(userInfo);
          if (!hospitalName) {
            setHospitalName(u?.full_name || u?.name || "Hospital");
          }
          if (u?.hospitals && u.hospitals[0]) {
            currentHospitalId = String(u.hospitals[0].id);
            setHospitalId(currentHospitalId);
          }
        } catch { }
      }

      // 2. Fetch Active Hospitals & Doctor Counts
      try {
        const hospitalsPayload = await fetchAdminHospitals();
        const firstHospital = hospitalsPayload?.hospitals?.[0];
        if (firstHospital && !currentHospitalId) {
          currentHospitalId = String(firstHospital.hospital ?? firstHospital.id ?? "");
          setHospitalId(currentHospitalId);
          setHospitalName(firstHospital.hospitalName || firstHospital.name || "Hospital");
        }

        if (currentHospitalId) {
          // Fetch available doctors
          const docRes = await fetch("/api/hospital/available-doctors");
          let docCount = 0;
          if (docRes.ok) {
            const docData = await docRes.json();
            const docs = Array.isArray(docData.doctors) ? docData.doctors : [];
            docCount = docs.filter((d: any) => d.is_added).length;
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
              Welcome back!
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600">
              Manage your medical staff, verify doctor associations, customize appointment slot templates, and generate calendars from your dedicated command center.
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
        </div>
      </div>
    </div>
  );
}