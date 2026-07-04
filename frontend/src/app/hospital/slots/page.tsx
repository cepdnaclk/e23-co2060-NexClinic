"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  createSlotTemplate,
  deleteSlotTemplate,
  fetchAdminHospitals,
  fetchVerifiedDoctors,
  fetchSlotTemplates,
  generateSlots,
  updateSlotTemplate,
  applySlotTemplates,
  fetchSlotTemplateAssignments,
  deleteSlotTemplateAssignment,
  type HospitalAdminItem,
  type DoctorVerificationItem,
  type SlotTemplateItem,
  type DoctorSlotTemplateAssignmentItem,
} from "@/lib/api/hospitalSlots";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type SlotTemplateFormState = {
  doctor: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_duration_minutes: string;
  default_patient_limit: string;
  is_active: boolean;
};

const initialFormState: SlotTemplateFormState = {
  doctor: "",
  day_of_week: "0",
  start_time: "09:00",
  end_time: "09:30",
  slot_duration_minutes: "30",
  default_patient_limit: "1",
  is_active: true,
};

const HospitalSlotsPage = () => {
  const [hospitals, setHospitals] = useState<HospitalAdminItem[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [templates, setTemplates] = useState<SlotTemplateItem[]>([]);
  const [verifiedDoctors, setVerifiedDoctors] = useState<DoctorVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | number | null>(null);
  const [formState, setFormState] = useState<SlotTemplateFormState>(initialFormState);
  const [generationDays, setGenerationDays] = useState("14");
  const [generationDoctorId, setGenerationDoctorId] = useState("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [error, setError] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState<"templates" | "assignments">("templates");

  // Assignment states
  const [assignments, setAssignments] = useState<DoctorSlotTemplateAssignmentItem[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [timeframeType, setTimeframeType] = useState("1_week");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState("");
  const [applying, setApplying] = useState(false);

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => String(hospital.hospital ?? hospital.id ?? "") === selectedHospitalId),
    [hospitals, selectedHospitalId],
  );

  useEffect(() => {
    let mounted = true;
    const loadHospitals = async () => {
      setHospitalsLoading(true);
      try {
        const payload = await fetchAdminHospitals();
        const data = Array.isArray(payload?.hospitals) ? payload.hospitals : [];
        if (mounted) {
          setHospitals(data);
          const firstHospital = data[0];
          if (firstHospital) {
            setSelectedHospitalId((current) => current || String(firstHospital.hospital ?? firstHospital.id ?? ""));
          }
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setHospitalsLoading(false);
      }
    };

    void loadHospitals();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadTemplates = async () => {
      if (!selectedHospitalId) {
        return;
      }
      setLoading(true);
      setError("");
      try {
        const payload = await fetchSlotTemplates(selectedHospitalId);
        const data = Array.isArray(payload)
          ? payload
          : payload?.slot_templates || payload?.templates || payload?.results || [];
        if (mounted) setTemplates(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadTemplates();
    return () => {
      mounted = false;
    };
  }, [selectedHospitalId]);

  useEffect(() => {
    let mounted = true;
    const loadVerifiedDoctors = async () => {
      if (!selectedHospitalId) {
        setVerifiedDoctors([]);
        return;
      }

      try {
        const payload = await fetchVerifiedDoctors(selectedHospitalId);
        const data = Array.isArray(payload?.verifications) ? payload.verifications : [];
        if (mounted) {
          setVerifiedDoctors(data);
          if (data[0]) {
            setGenerationDoctorId((current) => current || String(data[0].doctor));
            setFormState((current) => ({ ...current, doctor: current.doctor || String(data[0].doctor) }));
          }
        }
      } catch (err) {
        if (mounted) setActionError(err instanceof Error ? err.message : String(err));
      }
    };

    void loadVerifiedDoctors();
    return () => {
      mounted = false;
    };
  }, [selectedHospitalId]);

  const resetForm = () => {
    setEditingTemplateId(null);
    setFormState((current) => ({
      ...initialFormState,
      doctor: current.doctor || generationDoctorId || verifiedDoctors[0]?.doctor?.toString() || "",
    }));
  };

  useEffect(() => {
    if (!editingTemplateId && !formState.doctor) {
      setFormState((current) => ({
        ...current,
        doctor: current.doctor || generationDoctorId || verifiedDoctors[0]?.doctor?.toString() || "",
      }));
    }
  }, [editingTemplateId, formState.doctor, generationDoctorId, verifiedDoctors]);

  const refreshTemplates = async () => {
    if (!selectedHospitalId) return;
    setLoading(true);
    setError("");
    try {
      const payload = await fetchSlotTemplates(selectedHospitalId);
      const data = Array.isArray(payload)
        ? payload
        : payload?.slot_templates || payload?.templates || payload?.results || [];
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const refreshDoctors = async () => {
    if (!selectedHospitalId) return;
    try {
      const payload = await fetchVerifiedDoctors(selectedHospitalId);
      const data = Array.isArray(payload?.verifications) ? payload.verifications : [];
      setVerifiedDoctors(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    setActionMessage("");

    try {
      const payload = {
        hospital: Number(selectedHospitalId),
        doctor: Number(formState.doctor),
        day_of_week: Number(formState.day_of_week),
        start_time: formState.start_time,
        end_time: formState.end_time,
        slot_duration_minutes: Number(formState.slot_duration_minutes),
        default_patient_limit: Number(formState.default_patient_limit),
        is_active: formState.is_active,
      };

      if (editingTemplateId) {
        await updateSlotTemplate(editingTemplateId, payload);
        setActionMessage("Slot template updated successfully.");
      } else {
        await createSlotTemplate(payload);
        setActionMessage("Slot template created successfully.");
      }

      resetForm();
      await refreshTemplates();
      await refreshDoctors();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: SlotTemplateItem) => {
    setEditingTemplateId(template.id);
    setFormState({
      doctor: String(template.doctor ?? ""),
      day_of_week: String(template.day_of_week ?? 1),
      start_time: template.start_time ?? "09:00",
      end_time: template.end_time ?? "09:30",
      slot_duration_minutes: String(template.slot_duration_minutes ?? template.slot_duration ?? 30),
      default_patient_limit: String(template.default_patient_limit ?? template.patient_limit ?? 1),
      is_active: template.is_active ?? true,
    });
  };

  const handleDelete = async (templateId: string | number) => {
    if (!window.confirm("Delete this slot template?")) {
      return;
    }

    setSaving(true);
    setActionError("");
    setActionMessage("");
    try {
      await deleteSlotTemplate(templateId);
      setActionMessage("Slot template deleted successfully.");
      if (editingTemplateId === templateId) {
        resetForm();
      }
      await refreshTemplates();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setActionError("");
    setActionMessage("");
    try {
      const payload: Record<string, unknown> = {
        hospital: Number(selectedHospitalId),
        days: Number(generationDays),
        skip_duplicates: skipDuplicates,
      };
      if (generationDoctorId) {
        payload.doctor_id = Number(generationDoctorId);
      }

      const result = await generateSlots(payload);
      setActionMessage(result.message || `Created ${result.created_count || 0} slots.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  const refreshAssignments = async () => {
    if (!selectedHospitalId) return;
    setAssignmentsLoading(true);
    try {
      const payload = await fetchSlotTemplateAssignments(selectedHospitalId);
      setAssignments(payload.assignments || []);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "assignments") {
      void refreshAssignments();
    }
  }, [selectedHospitalId, activeTab]);

  const handleApplyTemplates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTemplates.length === 0) {
      setActionError("Please select at least one weekly template.");
      return;
    }
    if (selectedDoctors.length === 0) {
      setActionError("Please select at least one doctor.");
      return;
    }
    setApplying(true);
    setActionError("");
    setActionMessage("");
    try {
      const payload: Record<string, unknown> = {
        hospital: Number(selectedHospitalId),
        template_ids: selectedTemplates.map(Number),
        doctor_ids: selectedDoctors.map(Number),
        timeframe_type: timeframeType,
        start_date: startDate,
      };
      if (timeframeType === "custom") {
        if (!endDate) {
          setActionError("End date is required for custom timeframe.");
          setApplying(false);
          return;
        }
        payload.end_date = endDate;
      }
      const res = await applySlotTemplates(payload);
      setActionMessage(
        `Templates applied successfully! Created ${res.created_slots} slots, skipped ${res.skipped_slots} duplicates.`
      );
      setSelectedTemplates([]);
      setSelectedDoctors([]);
      void refreshAssignments();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setApplying(false);
    }
  };

  const handleRevokeAssignment = async (assignmentId: string | number) => {
    if (!window.confirm("Revoke this assignment? This will delete all future unbooked slots associated with it.")) {
      return;
    }
    setSaving(true);
    setActionError("");
    setActionMessage("");
    try {
      const res = await deleteSlotTemplateAssignment(assignmentId);
      setActionMessage(
        `Assignment revoked successfully. Deleted ${res.deleted_slots_count} future unbooked slots.`
      );
      void refreshAssignments();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Hospital Selector Card */}
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Appointment Slots</h1>
            <p className="text-sm text-slate-500 mt-1">Configure standard shifts and generate calendars for verified medical staff.</p>
          </div>

          <div className="w-full md:w-auto min-w-[280px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hospital Branch</label>
            <select
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              value={selectedHospitalId}
              onChange={(event) => setSelectedHospitalId(event.target.value)}
              disabled={hospitalsLoading || hospitals.length === 0}
            >
              {hospitals.length === 0 ? (
                <option value="">No hospitals available</option>
              ) : (
                hospitals.map((hospital) => {
                  const hospitalId = String(hospital.hospital ?? hospital.id ?? "");
                  const label = hospital.hospitalName || hospital.name || `Hospital ${hospitalId}`;
                  return (
                    <option key={hospitalId} value={hospitalId}>
                      {label}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {(actionError || actionMessage) && (
        <div className={`rounded-2xl border p-4 text-sm animate-in fade-in duration-200 ${
          actionError 
            ? "border-red-100 bg-red-50 text-red-700" 
            : "border-emerald-100 bg-emerald-50 text-emerald-700"
        }`}>
          {actionError || actionMessage}
        </div>
      )}

      {/* Two Column Forms Pane */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Panel 1: Create Template */}
        <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{editingTemplateId ? "Edit Shift Template" : "Create Shift Template"}</h2>
              <p className="text-xs text-slate-500">Define the recurring weekly slots for a practitioner.</p>
            </div>
            {editingTemplateId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Doctor</label>
              <select
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={formState.doctor}
                onChange={(event) => setFormState((current) => ({ ...current, doctor: event.target.value }))}
                required
              >
                <option value="">Select doctor</option>
                {verifiedDoctors.map((doctor) => (
                  <option key={doctor.id} value={String(doctor.doctor)}>
                    {doctor.doctorName || `Doctor ${doctor.doctor}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Day of the Week</label>
              <select
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={formState.day_of_week}
                onChange={(event) => setFormState((current) => ({ ...current, day_of_week: event.target.value }))}
                required
              >
                {dayNames.map((dayName, index) => (
                  <option key={dayName} value={index}>{dayName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                min={5}
                step={5}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={formState.slot_duration_minutes}
                onChange={(event) => setFormState((current) => ({ ...current, slot_duration_minutes: event.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Start Time</label>
              <input
                type="time"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={formState.start_time}
                onChange={(event) => setFormState((current) => ({ ...current, start_time: event.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">End Time</label>
              <input
                type="time"
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={formState.end_time}
                onChange={(event) => setFormState((current) => ({ ...current, end_time: event.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Patient Limit</label>
              <input
                type="number"
                min={1}
                step={1}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={formState.default_patient_limit}
                onChange={(event) => setFormState((current) => ({ ...current, default_patient_limit: event.target.value }))}
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-3 sm:col-span-2">
              <input
                type="checkbox"
                id="is_active"
                className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                checked={formState.is_active}
                onChange={(event) => setFormState((current) => ({ ...current, is_active: event.target.checked }))}
              />
              <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 select-none">
                Active & Visible
              </label>
            </div>

            <div className="sm:col-span-2 flex gap-3 border-t border-slate-100 pt-5 mt-2">
              <button
                type="submit"
                disabled={saving || hospitalsLoading || !selectedHospitalId || verifiedDoctors.length === 0}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/15 transition-all hover:shadow-lg disabled:opacity-50"
              >
                {saving ? "Saving..." : editingTemplateId ? "Update Template" : "Create Template"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* Panel 2: Generate Slots */}
        <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Generate Slots</h2>
              <p className="text-xs text-slate-500">Run the batch scheduler to create slots for upcoming calendar dates.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Days Ahead</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  value={generationDays}
                  onChange={(event) => setGenerationDays(event.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Doctor Filter</label>
                <select
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  value={generationDoctorId}
                  onChange={(event) => setGenerationDoctorId(event.target.value)}
                >
                  <option value="">All affiliated doctors</option>
                  {verifiedDoctors.map((doctor) => (
                    <option key={doctor.id} value={String(doctor.doctor)}>
                      {doctor.doctorName || `Doctor ${doctor.doctor}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3 sm:col-span-2">
                <input
                  type="checkbox"
                  id="skip_duplicates"
                  className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                  checked={skipDuplicates}
                  onChange={(event) => setSkipDuplicates(event.target.checked)}
                />
                <label htmlFor="skip_duplicates" className="text-sm font-semibold text-slate-700 select-none">
                  Skip duplicate slots (Prevent overlaps)
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 mt-6">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || loading || !selectedHospitalId}
              className="w-full flex justify-center items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/15 transition-all hover:shadow-lg disabled:opacity-50 active:scale-[0.99]"
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Generating Slots...
                </>
              ) : (
                "Generate Appointment Calendar"
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Main Templates Display Table */}
      {hospitalsLoading && <div className="text-slate-500 text-center py-6 text-sm">Loading hospital databases...</div>}
      {!hospitalsLoading && loading && <div className="text-slate-500 text-center py-6 text-sm">Fetching shift templates...</div>}
      {error && <div className="text-red-600 text-center py-6 text-sm font-semibold">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden bg-white/95 rounded-3xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-base">Active Shift Templates</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Doctor</th>
                  <th className="px-6 py-3.5">Day</th>
                  <th className="px-6 py-3.5">Timing</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Patient Limit</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400">
                      No shift templates have been created for this hospital.
                    </td>
                  </tr>
                ) : (
                  templates.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">#{String(t.id)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{t.doctor_name || t.doctor || t.doctor_display || "-"}</td>
                      <td className="px-6 py-4">{typeof t.day_of_week === "number" ? dayNames[t.day_of_week] : t.day_of_week}</td>
                      <td className="px-6 py-4 font-medium text-slate-850">
                        {t.start_time?.substring(0, 5)} - {t.end_time?.substring(0, 5)}
                      </td>
                      <td className="px-6 py-4">{t.slot_duration_minutes ?? t.slot_duration ?? "-"} mins</td>
                      <td className="px-6 py-4">{t.patient_limit ?? t.default_patient_limit ?? "-"} patients</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          t.is_active 
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-700/10' 
                            : 'bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-500/10'
                        }`}>
                          {t.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEdit(t)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
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
  );
};

export default HospitalSlotsPage;
