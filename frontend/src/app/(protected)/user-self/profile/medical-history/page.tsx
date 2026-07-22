"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

import GreenButton from "@/components/buttons/GreenButton";
import { handlePatientSessionExpired } from "@/lib/patientSession";

type PatientProfileResponse = {
  patient: {
    fullName: string;
    email: string;
  };
  health: {
    bloodType: string;
    allergies: string;
    medications: string;
    medicalHistory: string;
    comments: string;
    prescriptions: string;
    medicalReports: string;
    medicalDocuments: string;
    medicalRecords: Array<{
      id: string;
      visit_date: string;
      doctorName: string;
      hospitalName: string;
      observations: string;
      diagnosis: string;
      comments: string;
      prescriptions: string;
      recommended_tests: string;
      followUpDate: string;
      follow_up_notes: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
};

const splitNotes = (value: string) =>
  value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function PatientMedicalHistoryPage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<PatientProfileResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"records" | "documents">("records");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/patient/profile", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          handlePatientSessionExpired(router);
          return;
        }

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(
            errorPayload?.error || "Failed to load medical history",
          );
        }

        const data: PatientProfileResponse = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load medical history",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  const patientName = profileData?.patient.fullName || "Patient";
  const patientEmail = profileData?.patient.email || "Not available";
  const bloodType = profileData?.health.bloodType || "Unknown";
  const allergies = profileData?.health.allergies || "None reported";
  const medications = profileData?.health.medications || "None reported";
  const medicalHistory = profileData?.health.medicalHistory || "None reported";
  const comments =
    profileData?.health.comments ||
    "No clinical comments have been recorded yet.";
  const prescriptions =
    profileData?.health.prescriptions ||
    "No prescriptions have been recorded yet.";
  const medicalReports = profileData?.health.medicalReports || "";
  const medicalDocuments = profileData?.health.medicalDocuments || "";
  const medicalRecords = profileData?.health.medicalRecords || [];

  const historyItems = splitNotes(medicalHistory);
  const allergyItems = splitNotes(allergies);

  const filteredRecords = useMemo(() => {
    let records = [...medicalRecords];
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter(r => 
        (r.doctorName && r.doctorName.toLowerCase().includes(q)) ||
        (r.hospitalName && r.hospitalName.toLowerCase().includes(q)) ||
        (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
        (r.observations && r.observations.toLowerCase().includes(q))
      );
    }
    
    records.sort((a, b) => {
      const dateA = new Date(a.visit_date).getTime();
      const dateB = new Date(b.visit_date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    
    return records;
  }, [medicalRecords, searchQuery, sortOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white pb-8">
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Medical Records
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Medical Records
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              A detailed view of your appointment history, clinical notes, and uploaded medical files.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/user-self/profile"
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              Back to Profile
            </Link>
            <GreenButton
              className="rounded-full px-6 py-3"
              onClick={() => router.push("/user-self/edit-profile")}
            >
              Edit Profile
            </GreenButton>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-green-100 bg-white p-8 text-center shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
            <p className="text-sm font-semibold text-emerald-700">
              Loading medical history...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-100 bg-white p-8 text-center shadow-[0_18px_50px_rgba(239,68,68,0.08)]">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Tab Navigation */}
            <div className="flex w-full flex-col sm:flex-row items-center gap-2 overflow-x-auto rounded-[2rem] border border-emerald-100 bg-white p-2 shadow-sm">
              <button
                onClick={() => setActiveTab("records")}
                className={`flex-1 w-full whitespace-nowrap rounded-[1.5rem] px-6 py-3 text-sm font-semibold transition-all duration-300 ${activeTab === "records" ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-transparent text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
              >
                Medical Records
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`flex-1 w-full whitespace-nowrap rounded-[1.5rem] px-6 py-3 text-sm font-semibold transition-all duration-300 ${activeTab === "documents" ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-transparent text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
              >
                Medical Documents
              </button>
            </div>

            {/* Tab Content */}
            <div className="w-full">
              {activeTab === "records" && (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <section className="rounded-[2rem] border border-green-100 bg-white p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-7">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Appointment Records
                      </h2>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          placeholder="Search records..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
                          className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="desc">Newest First</option>
                          <option value="asc">Oldest First</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredRecords.length ? (
                        filteredRecords.map((record) => (
                          <div
                            key={record.id}
                            className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                              <p className="text-base font-bold text-slate-900">
                                {new Date(record.visit_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                Dr. {record.doctorName}
                              </p>
                            </div>
                            
                            <div className="mt-3 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                                {record.hospitalName}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              {record.diagnosis && (
                                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Diagnosis</span>
                                  <span className="mt-1 block text-sm font-medium text-slate-900">{record.diagnosis}</span>
                                </div>
                              )}
                              
                              {record.observations && (
                                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Observations</span>
                                  <span className="mt-1 block text-sm text-slate-700">{record.observations}</span>
                                </div>
                              )}
                              
                              {record.prescriptions && (
                                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 sm:col-span-2">
                                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Medications / Prescriptions</span>
                                  <span className="mt-1 block text-sm font-medium text-slate-900 whitespace-pre-line">{record.prescriptions}</span>
                                </div>
                              )}
                              
                              {record.comments && (
                                <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100 sm:col-span-2">
                                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Comments</span>
                                  <span className="mt-1 block text-sm text-slate-700 whitespace-pre-line">{record.comments}</span>
                                </div>
                              )}
                              
                              {record.recommended_tests && (
                                <div className="rounded-2xl bg-emerald-50/50 p-3 shadow-sm ring-1 ring-emerald-100 sm:col-span-2">
                                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-emerald-700">Recommended Tests</span>
                                  <span className="mt-1 block text-sm font-medium text-emerald-900">{record.recommended_tests}</span>
                                </div>
                              )}
                              
                              {(record.followUpDate || record.follow_up_notes) && (
                                <div className="rounded-2xl bg-amber-50/50 p-3 shadow-sm ring-1 ring-amber-100 sm:col-span-2">
                                  <div className="flex items-center justify-between">
                                    <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-amber-800">Follow-up</span>
                                    {record.followUpDate && (
                                      <span className="rounded bg-amber-200/50 px-2 py-0.5 text-xs font-semibold text-amber-900">
                                        {new Date(record.followUpDate).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  {record.follow_up_notes && (
                                    <span className="mt-2 block text-sm text-amber-900">{record.follow_up_notes}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                          {searchQuery ? "No records found matching your search." : "No saved medical records yet."}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <section className="rounded-[2rem] border border-green-100 bg-white p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-7">
                    <h2 className="mb-6 text-2xl font-bold text-slate-900">
                      Medical Documents
                    </h2>
                    
                    <div className="flex flex-col gap-4">
                      {!medicalReports && !medicalDocuments && (
                        <div className="flex w-full items-center justify-center rounded-xl bg-slate-50 px-4 py-8 text-sm font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                          No documents or reports uploaded yet.
                        </div>
                      )}

                      {medicalReports && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[1.5rem] border border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white p-5 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Diagnostic Report</p>
                              <p className="text-sm text-slate-500">Lab results, scans, and clinical tests.</p>
                            </div>
                          </div>
                          <a
                            href={medicalReports}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-200 transition-colors hover:bg-emerald-50"
                          >
                            View File
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}

                      {medicalDocuments && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[1.5rem] border border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white p-5 shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">General Document</p>
                              <p className="text-sm text-slate-500">Referral letters, certificates, or discharge summaries.</p>
                            </div>
                          </div>
                          <a
                            href={medicalDocuments}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-200 transition-colors hover:bg-emerald-50"
                          >
                            View File
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
