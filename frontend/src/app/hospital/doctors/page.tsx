"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchAdminHospitals } from "@/lib/api/hospitalSlots";

interface Doctor {
  id: number;
  full_name: string;
  email: string;
  is_added: boolean;
  specialization?: string;
  license_number?: string;
}

interface DoctorDetails {
  id: number;
  full_name: string;
  preferred_name: string;
  nic_number: string;
  phone: string;
  license_number: string;
  specialization: string;
  gender: string;
  experience_years: number;
  qualifications: string;
  address: string;
}

interface VerificationRequest {
  id: number;
  doctor: number;
  doctorName: string;
  doctorDetails: DoctorDetails;
  hospital: number;
  hospitalName: string;
  status: string;
  created_at: string;
}

const SPECIALIZATIONS = [
  "Allergy and Immunology",
  "Anesthesiology",
  "Cardiology",
  "Cardiothoracic Surgery",
  "Clinical Genetics",
  "Clinical Oncology",
  "Critical Care Medicine",
  "Dermatology",
  "Emergency Medicine",
  "Endocrinology",
  "Family Medicine",
  "Forensic Medicine",
  "Gastroenterology",
  "General Practitioner",
  "General Surgery",
  "Geriatric Medicine",
  "Gynecology",
  "Hematology",
  "Hepatology",
  "Infectious Diseases",
  "Internal Medicine",
  "Interventional Radiology",
  "Nephrology",
  "Neurology",
  "Neurosurgery",
  "Nuclear Medicine",
  "Obstetrics",
  "Occupational Medicine",
  "Oncology",
  "Ophthalmology",
  "Oral and Maxillofacial Surgery",
  "Orthopedic Surgery",
  "Otolaryngology (ENT)",
  "Palliative Medicine",
  "Pathology",
  "Pediatric Cardiology",
  "Pediatrics",
  "Physical Medicine and Rehabilitation",
  "Plastic and Reconstructive Surgery",
  "Psychiatry",
  "Pulmonology",
  "Radiology",
  "Rheumatology",
  "Sports Medicine",
  "Urology",
  "Vascular Surgery",
  "Other"
];

export default function ManageDoctorsPage() {
  const [activeTab, setActiveTab] = useState<"affiliated" | "pending">("affiliated");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pendingRequests, setPendingRequests] = useState<VerificationRequest[]>([]);

  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create doctor form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    preferred_name: "",
    nic_number: "",
    gender: "Other",
    license_number: "",
    specialization: "General Practitioner",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");

  // Detail Inspector Modal
  const [inspectingRequest, setInspectingRequest] = useState<VerificationRequest | null>(null);

  // Confirmations Custom Modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
  });

  // Rejection Reason Modal
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    requestId: number;
    doctorName: string;
    reason: string;
    error: string;
  }>({
    isOpen: false,
    requestId: 0,
    doctorName: "",
    reason: "",
    error: "",
  });

  // Load Admin Hospital and Doctor Listings
  useEffect(() => {
    let isMounted = true;
    const initializePage = async () => {
      setLoading(true);
      setError("");
      try {
        const hospitalPayload = await fetchAdminHospitals();
        const firstHospital = hospitalPayload?.hospitals?.[0];
        if (firstHospital && isMounted) {
          const hospId = String(firstHospital.hospital ?? firstHospital.id ?? "");
          setSelectedHospitalId(hospId);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load hospital branches");
      }
    };
    void initializePage();
    return () => { isMounted = false; };
  }, []);

  // Fetch doctors and requests once HospitalId is loaded
  const loadDoctorsList = async () => {
    try {
      const res = await fetch("/api/hospital/available-doctors");
      if (!res.ok) throw new Error("Failed to load doctor database");
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (err: any) {
      setError(err.message || "Error loading doctors");
    }
  };

  const loadPendingRequests = async (hospId: string) => {
    if (!hospId) return;
    setRequestsLoading(true);
    try {
      const res = await fetch(`/api/hospital/doctor-verifications?hospital_id=${hospId}&status=PENDING`);
      if (!res.ok) throw new Error("Failed to load pending requests");
      const data = await res.json();
      setPendingRequests(data.verifications || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedHospitalId) return;
    setLoading(true);
    const loadAll = async () => {
      await Promise.all([loadDoctorsList(), loadPendingRequests(selectedHospitalId)]);
      setLoading(false);
    };
    void loadAll();
  }, [selectedHospitalId]);

  const triggerConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "Confirm", isDanger = false) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
      confirmText,
      isDanger,
    });
  };

  const handleCreateDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setFormSuccess("");

    const errors: Record<string, string> = {};
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.full_name.trim()) errors.full_name = "Full name is required";
    if (!formData.preferred_name.trim()) errors.preferred_name = "Preferred name is required";
    if (!formData.nic_number.trim()) errors.nic_number = "NIC number is required";
    if (!formData.license_number.trim()) errors.license_number = "License number is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    triggerConfirm(
      "Register Doctor Account",
      `Are you sure you want to register a new doctor account for ${formData.full_name}?`,
      async () => {
        setFormSubmitting(true);
        try {
          const res = await fetch("/api/hospital/create-doctor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });

          const data = await res.json();
          if (!res.ok) {
            if (typeof data === "object") {
              const drfErrors: Record<string, string> = {};
              for (const key in data) {
                if (key === "detail" && typeof data[key] === "string") {
                  drfErrors.general = data[key];
                } else if (Array.isArray(data[key])) {
                  drfErrors[key] = data[key].join(" ");
                } else if (typeof data[key] === "string") {
                  drfErrors[key] = data[key];
                }
              }
              if (!drfErrors.general) {
                drfErrors.general = Object.values(drfErrors)[0] || "Please correct the highlighted fields.";
              }
              setFormErrors(drfErrors);
            } else {
              throw new Error(data.detail || "Failed to create doctor account");
            }
          } else {
            setFormSuccess("Doctor account created and login credentials emailed successfully!");
            if (data.doctor) {
              setDoctors((prev) => [data.doctor, ...prev]);
            }
            setFormData({
              email: "",
              full_name: "",
              preferred_name: "",
              nic_number: "",
              gender: "Other",
              license_number: "",
              specialization: "General Practitioner",
              phone: "",
            });
            setTimeout(() => {
              setIsModalOpen(false);
              setFormSuccess("");
            }, 1500);
          }
        } catch (err: any) {
          setFormErrors({ general: err.message || "An unexpected error occurred" });
        } finally {
          setFormSubmitting(false);
        }
      }
    );
  };

  const handleAddRemove = async (doctorId: number, isAdded: boolean, doctorName: string) => {
    const action = isAdded ? "remove" : "add";
    const title = isAdded ? "Delink Doctor" : "Affiliate Doctor";
    const message = isAdded
      ? `Are you sure you want to remove Dr. ${doctorName} from your hospital affiliation? This will instantly restrict their scheduling privileges.`
      : `Are you sure you want to verify and add Dr. ${doctorName} to your hospital?`;

    triggerConfirm(
      title,
      message,
      async () => {
        setSubmittingId(doctorId);
        try {
          const res = await fetch("/api/hospital/manage-doctor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ doctor_id: doctorId, action }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to update doctor status");
          }

          setDoctors((prev) =>
            prev.map((doc) =>
              doc.id === doctorId ? { ...doc, is_added: !isAdded } : doc
            )
          );
        } catch (err: any) {
          alert(err.message || "An error occurred");
        } finally {
          setSubmittingId(null);
        }
      },
      isAdded ? "Remove Affiliation" : "Affiliate",
      isAdded
    );
  };

  const handleRequestAction = async (requestId: number, action: "verify" | "reject", doctorName: string, reason = "") => {
    const actionTitle = action === "verify" ? "Accept Verification Request" : "Reject Verification Request";
    const message = action === "verify"
      ? `Are you sure you want to verify Dr. ${doctorName} and add them to your hospital listing?`
      : `Are you sure you want to reject the link request from Dr. ${doctorName}?`;

    const executeAction = async () => {
      setRequestsLoading(true);
      try {
        const payload: Record<string, string> = { action };
        if (action === "reject") {
          payload.rejection_reason = reason;
        }

        const res = await fetch(`/api/hospital/doctor-verifications/${requestId}/action`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to update link request status");
        }

        // Refresh listings
        await Promise.all([loadDoctorsList(), loadPendingRequests(selectedHospitalId)]);

        // Close rejection modal if it was open
        setRejectionModal((prev) => ({ ...prev, isOpen: false }));
      } catch (err: any) {
        if (action === "reject") {
          setRejectionModal((prev) => ({ ...prev, error: err.message || "Failed to submit rejection" }));
        } else {
          alert(err.message || "An error occurred");
        }
      } finally {
        setRequestsLoading(false);
      }
    };

    if (action === "reject" && !reason) {
      // Open rejection reason prompt modal
      setRejectionModal({
        isOpen: true,
        requestId,
        doctorName,
        reason: "",
        error: "",
      });
    } else {
      triggerConfirm(actionTitle, message, executeAction, action === "verify" ? "Accept & Link" : "Reject Request", action === "reject");
    }
  };

  const handleRejectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModal.reason.trim()) {
      setRejectionModal((prev) => ({ ...prev, error: "Please provide a reason for rejection." }));
      return;
    }
    void handleRequestAction(rejectionModal.requestId, "reject", rejectionModal.doctorName, rejectionModal.reason);
  };

  const filteredDoctors = doctors.filter(
    (doc) =>
      doc.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar Card */}
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Doctors</h1>
            <p className="text-sm text-slate-500 mt-1">
              Affiliate active practitioners or accept signup link requests from doctors.
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:min-w-[280px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Actions */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:shadow-lg active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create Doctor Account
            </button>

            <button
              onClick={() => {
                void loadDoctorsList();
                if (selectedHospitalId) void loadPendingRequests(selectedHospitalId);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="flex border-t border-slate-100 mt-6 pt-4 gap-4">
          <button
            onClick={() => setActiveTab("affiliated")}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${activeTab === "affiliated"
                ? "bg-emerald-50 text-emerald-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
          >
            Affiliated Doctors ({doctors.filter((d) => d.is_added).length})
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors relative ${activeTab === "pending"
                ? "bg-emerald-50 text-emerald-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
          >
            Pending Requests ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-slate-200 bg-white/50 backdrop-blur">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <span className="mt-3 text-sm text-slate-500">Retrieving affiliated doctor records...</span>
        </div>
      ) : activeTab === "affiliated" ? (
        /* Tab 1: Affiliated & Available Doctors Grid */
        filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-slate-100 bg-white p-8">
            <h3 className="font-bold text-slate-800">No doctors found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search criteria or register a new account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDoctors.map((doctor) => (
              <div
                key={`${doctor.id}-${doctor.email}`}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-3xl border bg-white shadow-sm transition-all duration-200 ${doctor.is_added
                    ? 'border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/30'
                    : 'border-slate-100 hover:border-emerald-100/50 hover:shadow-md'
                  }`}
              >
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-inner ${doctor.is_added ? 'bg-emerald-100/80 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {getInitials(doctor.full_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 flex flex-wrap items-center gap-2">
                      <span className="truncate">{doctor.full_name}</span>
                      {doctor.is_added && (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                          Affiliated
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 truncate">{doctor.email}</div>
                    {doctor.specialization && (
                      <div className="text-xs text-emerald-600 font-semibold mt-1 bg-emerald-50/50 px-2 py-0.5 rounded-md inline-block">
                        {doctor.specialization}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  disabled={submittingId === doctor.id}
                  onClick={() => handleAddRemove(doctor.id, doctor.is_added, doctor.full_name)}
                  className={`w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${doctor.is_added
                      ? 'bg-slate-50 border border-slate-200 text-red-600 hover:bg-red-55 hover:border-red-200'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/10 hover:shadow-lg'
                    } ${submittingId === doctor.id ? 'opacity-50 cursor-not-allowed' : ''} active:scale-[0.98]`}
                >
                  {submittingId === doctor.id ? "Working..." : doctor.is_added ? "Delink Account" : "Add to Hospital"}
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Tab 2: Pending Registration Requests from Doctors */
        requestsLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <span className="ml-3 text-slate-500 text-sm">Loading pending link requests...</span>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-slate-100 bg-white p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800">No pending requests</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">There are currently no pending affiliation requests from doctors for your hospital branch.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col p-5 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold bg-amber-50 text-amber-700 shadow-inner">
                    {getInitials(req.doctorName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 truncate">{req.doctorName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{req.doctorDetails?.specialization || "General Practitioner"}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Requested {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Quick actions for request card */}
                <div className="flex items-center gap-2 border-t border-slate-50 pt-4 mt-2">
                  <button
                    onClick={() => setInspectingRequest(req)}
                    className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-55 transition-all text-center"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleRequestAction(req.id, "reject", req.doctorName)}
                    className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-red-200 text-red-650 hover:bg-red-50/50 transition-all text-center animate-pulse"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleRequestAction(req.id, "verify", req.doctorName)}
                    className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all text-center"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal: Create Doctor Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Create Doctor Profile</h2>
                <p className="text-xs text-slate-500 mt-1">This will register a new doctor login credentials linked to your clinic.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formErrors.general && (
              <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm font-medium">
                {formErrors.general}
              </div>
            )}

            {formSuccess && (
              <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl text-sm font-medium text-center">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateDoctorSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 ${formErrors.full_name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-emerald-500'}`}
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                  {formErrors.full_name && <span className="text-red-500 text-xs mt-1 block">{formErrors.full_name}</span>}
                </div>

                {/* Preferred Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preferred Name (e.g. Dr. Silva)</label>
                  <input
                    type="text"
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 ${formErrors.preferred_name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-emerald-500'}`}
                    value={formData.preferred_name}
                    onChange={(e) => setFormData({ ...formData, preferred_name: e.target.value })}
                  />
                  {formErrors.preferred_name && <span className="text-red-500 text-xs mt-1 block">{formErrors.preferred_name}</span>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-emerald-500'}`}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {formErrors.email && <span className="text-red-500 text-xs mt-1 block">{formErrors.email}</span>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0771234567"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 ${formErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-emerald-500'}`}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  {formErrors.phone && <span className="text-red-500 text-xs mt-1 block">{formErrors.phone}</span>}
                </div>

                {/* NIC Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">NIC Number</label>
                  <input
                    type="text"
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 ${formErrors.nic_number ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-emerald-500'}`}
                    value={formData.nic_number}
                    onChange={(e) => setFormData({ ...formData, nic_number: e.target.value })}
                  />
                  {formErrors.nic_number && <span className="text-red-500 text-xs mt-1 block">{formErrors.nic_number}</span>}
                </div>

                {/* License Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">SLMC License Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MC/12345"
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 ${formErrors.license_number ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-emerald-500'}`}
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  />
                  {formErrors.license_number && <span className="text-red-500 text-xs mt-1 block">{formErrors.license_number}</span>}
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Specialization</label>
                  <select
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 text-slate-800 focus:border-emerald-500"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  >
                    {SPECIALIZATIONS.map((spec) => (
                      <option key={spec} value={spec} className="text-slate-800">
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Gender</label>
                  <select
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50/50 text-slate-800 focus:border-emerald-500"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male" className="text-slate-800">Male</option>
                    <option value="Female" className="text-slate-800">Female</option>
                    <option value="Other" className="text-slate-800">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  A secure temporary password will be generated automatically and emailed to the doctor.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/15 transition-all hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {formSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Doctor Signup Details */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl p-6 sm:p-8 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Doctor Registration Profile</h2>
                <p className="text-xs text-slate-500 mt-1">Review the details submitted during practitioner sign-up.</p>
              </div>
              <button
                onClick={() => setInspectingRequest(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Doctor Quick Summary */}
              <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold bg-emerald-100 text-emerald-700">
                  {getInitials(inspectingRequest.doctorName)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{inspectingRequest.doctorDetails?.full_name || inspectingRequest.doctorName}</h3>
                  <p className="text-sm font-semibold text-emerald-600 mt-0.5">{inspectingRequest.doctorDetails?.specialization || "General Practitioner"}</p>
                </div>
              </div>

              {/* Grid List of Fields */}
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Preferred Name</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{inspectingRequest.doctorDetails?.preferred_name || "-"}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Gender</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{inspectingRequest.doctorDetails?.gender || "Other"}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">SLMC Registration ID</span>
                  <span className="font-mono font-semibold text-slate-850 mt-0.5 block">{inspectingRequest.doctorDetails?.license_number || "-"}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">National Identity (NIC)</span>
                  <span className="font-mono font-semibold text-slate-850 mt-0.5 block">{inspectingRequest.doctorDetails?.nic_number || "-"}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Contact Number</span>
                  <span className="font-semibold text-slate-850 mt-0.5 block">{inspectingRequest.doctorDetails?.phone || "-"}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Experience Years</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{inspectingRequest.doctorDetails?.experience_years ?? 0} Years</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Qualifications</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{inspectingRequest.doctorDetails?.qualifications || "No qualifications listed"}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-xs font-semibold text-slate-400 uppercase">Residential Address</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{inspectingRequest.doctorDetails?.address || "No address listed"}</span>
                </div>
              </div>

              {/* Accept / Reject Quick Controls */}
              <div className="flex gap-3 border-t border-slate-100 pt-5 mt-4">
                <button
                  onClick={() => {
                    const req = inspectingRequest;
                    setInspectingRequest(null);
                    void handleRequestAction(req.id, "reject", req.doctorName);
                  }}
                  className="flex-1 rounded-xl border border-red-200 hover:bg-red-50/50 py-2.5 text-sm font-semibold text-red-650 transition-all text-center"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => {
                    const req = inspectingRequest;
                    setInspectingRequest(null);
                    void handleRequestAction(req.id, "verify", req.doctorName);
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/15 transition-all text-center"
                >
                  Accept & Affiliate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Action (General Popups) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 text-center">
            <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">{confirmModal.message}</p>

            <div className="flex gap-3 justify-center pt-5 border-t border-slate-50 mt-6">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm hover:shadow transition-all ${confirmModal.isDanger
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/10"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                  }`}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Request Reason Input */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 text-center">Reject Affiliation Request</h3>
            <p className="text-xs text-slate-500 mt-1 text-center">Please specify why the request from Dr. {rejectionModal.doctorName} is being rejected.</p>

            <form onSubmit={handleRejectionSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rejection Reason</label>
                <textarea
                  required
                  placeholder="e.g. SLMC license registration could not be verified on the portal"
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  rows={4}
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal((prev) => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              {rejectionModal.error && (
                <p className="text-xs text-red-500 font-semibold">{rejectionModal.error}</p>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectionModal((prev) => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestsLoading}
                  className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl bg-red-650 hover:bg-red-700 text-white shadow-md shadow-red-500/10 hover:shadow-lg transition-all"
                >
                  {requestsLoading ? "Submitting..." : "Submit Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
