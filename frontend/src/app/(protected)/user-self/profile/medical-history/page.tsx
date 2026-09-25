"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@headlessui/react";
import GreenButton from "@/components/buttons/GreenButton";
import BlackButton from "@/components/buttons/BlackButton";
import { handlePatientSessionExpired } from "@/lib/patientSession";
import { generateMedicalRecordsPDF } from "@/lib/pdfGenerator";

type PatientMedicalDocument = {
  id: number;
  fileUrl: string;
  name: string;
  description: string;
  uploadedAt: string;
};

type PatientProfileResponse = {
  patient: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  health: {
    bloodType: string;
    allergies: string;
    medications: string;
    medicalHistory: string;
    comments: string;
    prescriptions: string;
    medicalDocuments: PatientMedicalDocument[];
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
      queueNumber?: number | null;
      slotTime?: string | null;
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
  const [profileData, setProfileData] = useState<PatientProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"records" | "documents">("records");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Document Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [uploadDocName, setUploadDocName] = useState("");
  const [uploadDocDescription, setUploadDocDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

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

  useEffect(() => {
    void loadProfile();
  }, [router]);

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", uploadDocFile);
      if (uploadDocName) formData.append("name", uploadDocName);
      if (uploadDocDescription) formData.append("description", uploadDocDescription);

      const response = await fetch("/api/patient/medical-documents", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        handlePatientSessionExpired(router);
        return;
      }

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.detail || "Failed to upload document.");
      }

      setIsUploadModalOpen(false);
      setUploadDocFile(null);
      setUploadDocName("");
      setUploadDocDescription("");
      void loadProfile(); // Reload to get updated list
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/patient/medical-documents/${id}/`, {
        method: "DELETE",
      });
      if (response.status === 401 || response.status === 403) {
        handlePatientSessionExpired(router);
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to delete document.");
      }
      void loadProfile();
    } catch (err) {
      alert("Error deleting document");
    }
  };

  const patientName = profileData?.patient.fullName || "Patient";
  const medicalDocuments = profileData?.health.medicalDocuments || [];
  const medicalRecords = profileData?.health.medicalRecords || [];

  const handleDownloadPDF = () => {
    if (medicalRecords.length === 0) {
      alert("No medical records to download.");
      return;
    }
    const patientInfo = profileData?.patient || { fullName: "Patient", id: "", email: "", phone: "" };
    generateMedicalRecordsPDF(patientInfo, medicalRecords);
  };

  const groupedRecords = useMemo(() => {
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

    const groups: Record<string, typeof records> = {};
    records.forEach(r => {
      const date = new Date(r.visit_date);
      const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(r);
    });
    
    return groups;
  }, [medicalRecords, searchQuery, sortOrder]);

  const groupedDocuments = useMemo(() => {
    let docs = [...medicalDocuments];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(d => 
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    }

    docs.sort((a, b) => {
      const dateA = new Date(a.uploadedAt).getTime();
      const dateB = new Date(b.uploadedAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    const groups: Record<string, typeof docs> = {};
    docs.forEach(d => {
      const date = new Date(d.uploadedAt);
      const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(d);
    });

    return groups;
  }, [medicalDocuments, searchQuery, sortOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white pb-8">
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Medical History
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Records & Documents
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
                        <button
                          onClick={handleDownloadPDF}
                          className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200 shadow-sm"
                        >
                          Download PDF
                        </button>
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

                    <div className="flex flex-col gap-6">
                      {Object.keys(groupedRecords).length === 0 ? (
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">
                          {searchQuery ? "No records found matching your search." : "No saved medical records yet."}
                        </div>
                      ) : (
                        Object.entries(groupedRecords).map(([monthYear, records]) => (
                          <div key={monthYear} className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-emerald-100 pb-2">{monthYear}</h3>
                            {records.map((record) => (
                              <div
                                key={record.id}
                                className="group flex flex-col gap-4 rounded-[1.5rem] border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-5 shadow-sm transition hover:border-emerald-200"
                              >
                                {/* Header */}
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900">
                                        {new Date(record.visit_date).toLocaleDateString(undefined, {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </p>
                                      <p className="text-sm font-medium text-slate-500">
                                        {record.hospitalName} • Dr. {record.doctorName}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Content Grid */}
                                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                                  {record.diagnosis && (
                                    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
                                      <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-emerald-600">Diagnosis</span>
                                      <span className="mt-1 block text-sm font-medium text-slate-800">{record.diagnosis}</span>
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
                                      <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-blue-600">Prescriptions</span>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {splitNotes(record.prescriptions).map((med, idx) => (
                                          <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                            {med}
                                          </span>
                                        ))}
                                      </div>
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
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === "documents" && (
                <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <section className="rounded-[2rem] border border-green-100 bg-white p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-7">
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h2 className="text-2xl font-bold text-slate-900">
                        Medical Documents
                      </h2>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          placeholder="Search documents..."
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
                        <GreenButton className="rounded-full px-5 py-2" onClick={() => setIsUploadModalOpen(true)}>
                          Upload Document
                        </GreenButton>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-6">
                      {Object.keys(groupedDocuments).length === 0 ? (
                        <div className="flex w-full items-center justify-center rounded-xl bg-slate-50 px-4 py-8 text-sm font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
                          {searchQuery ? "No documents found." : "No documents uploaded yet."}
                        </div>
                      ) : (
                        Object.entries(groupedDocuments).map(([monthYear, docs]) => (
                          <div key={monthYear} className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-emerald-100 pb-2">{monthYear}</h3>
                            {docs.map((doc) => (
                              <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[1.5rem] border border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white p-5 shadow-sm transition hover:border-emerald-300">
                                <div className="flex items-center gap-4">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{doc.name || "Medical Document"}</p>
                                    <p className="text-xs text-slate-500 mb-1">{new Date(doc.uploadedAt).toLocaleString()}</p>
                                    {doc.description && <p className="text-sm text-slate-600 line-clamp-2">{doc.description}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-inset ring-emerald-200 transition-colors hover:bg-emerald-50"
                                  >
                                    View File
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-rose-50 p-2.5 text-rose-600 shadow-sm ring-1 ring-inset ring-rose-200 transition-colors hover:bg-rose-100"
                                  >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-4">
              Upload Medical Document
            </Dialog.Title>
            
            <form onSubmit={handleDocumentUpload} className="space-y-4">
              {uploadError && (
                <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-600 ring-1 ring-inset ring-rose-200">
                  {uploadError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Document Name (Optional)</label>
                <input
                  type="text"
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  placeholder="e.g. Blood Test Results"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={uploadDocDescription}
                  onChange={(e) => setUploadDocDescription(e.target.value)}
                  placeholder="Any notes about this document..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">File *</label>
                <input
                  type="file"
                  onChange={(e) => setUploadDocFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  accept=".pdf,.doc,.docx,.txt,image/*"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <BlackButton
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 rounded-full"
                >
                  Cancel
                </BlackButton>
                <GreenButton
                  type="submit"
                  disabled={isUploading || !uploadDocFile}
                  className="flex-1 rounded-full"
                >
                  {isUploading ? "Uploading..." : "Upload"}
                </GreenButton>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
