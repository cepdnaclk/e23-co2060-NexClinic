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

const parseTimeToMinutes = (timeValue: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(timeValue);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes: number): string => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const getDurationFromStartEnd = (startTime: string, endTime: string): number | null => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) return null;

  let durationMinutes = endMinutes - startMinutes;
  if (durationMinutes <= 0) durationMinutes += 1440;
  return durationMinutes;
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

  // Template tab filters
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateDayFilter, setTemplateDayFilter] = useState("all");
  const [templateStatusFilter, setTemplateStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Assignment tab filters
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const selectedHospital = useMemo(
    () => hospitals.find((hospital) => String(hospital.hospital ?? hospital.id ?? "") === selectedHospitalId),
    [hospitals, selectedHospitalId],
  );

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const doctorLabel =
        template.doctorName || template.doctor_name || template.doctor_display || "Generic Template";
      const identifier = template.doctorIdentifier || (template.doctor ? `DOC-${template.doctor}` : "ALL");
      const dayText =
        typeof template.day_of_week === "number"
          ? dayNames[template.day_of_week] || String(template.day_of_week)
          : String(template.day_of_week || "");

      const searchText = `${doctorLabel} ${identifier} ${dayText} ${template.start_time || ""} ${template.end_time || ""}`.toLowerCase();
      const searchOk = !templateSearch.trim() || searchText.includes(templateSearch.toLowerCase());
      const dayOk = templateDayFilter === "all" || String(template.day_of_week) === templateDayFilter;
      const statusOk =
        templateStatusFilter === "all" ||
        (templateStatusFilter === "active" && !!template.is_active) ||
        (templateStatusFilter === "inactive" && !template.is_active);

      return searchOk && dayOk && statusOk;
    });
  }, [templates, templateSearch, templateDayFilter, templateStatusFilter]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const doctorLabel =
        assignment.doctorName || assignment.doctor_preferred_name || `Doctor ${assignment.doctor}`;
      const identifier = assignment.doctorIdentifier || `DOC-${assignment.doctor}`;
      const detail = assignment.slot_template_detail || assignment.templateDetails;
      const dayText =
        (detail as { day_name?: string })?.day_name ||
        String((detail as { day_of_week?: number })?.day_of_week ?? "");

      const searchText = `${doctorLabel} ${identifier} ${assignment.slot_template} ${dayText}`.toLowerCase();
      const searchOk = !assignmentSearch.trim() || searchText.includes(assignmentSearch.toLowerCase());
      const statusOk =
        assignmentStatusFilter === "all" ||
        (assignmentStatusFilter === "active" && !!assignment.is_active) ||
        (assignmentStatusFilter === "inactive" && !assignment.is_active);

      return searchOk && statusOk;
    });
  }, [assignments, assignmentSearch, assignmentStatusFilter]);

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
    setFormState(initialFormState);
  };

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
      const payload: Record<string, unknown> = {
        hospital: Number(selectedHospitalId),
        day_of_week: Number(formState.day_of_week),
        start_time: formState.start_time,
        end_time: formState.end_time,
        slot_duration_minutes: Number(formState.slot_duration_minutes),
        default_patient_limit: Number(formState.default_patient_limit),
        is_active: formState.is_active,
      };

      if (formState.doctor) {
        payload.doctor = Number(formState.doctor);
      }

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

  const handleStartTimeChange = (startTime: string) => {
    setFormState((current) => {
      const updatedState: SlotTemplateFormState = { ...current, start_time: startTime };
      const startMinutes = parseTimeToMinutes(startTime);
      const durationMinutes = Number.parseInt(current.slot_duration_minutes, 10);

      if (startMinutes !== null && Number.isFinite(durationMinutes) && durationMinutes > 0) {
        updatedState.end_time = minutesToTime(startMinutes + durationMinutes);
      }

      return updatedState;
    });
  };

  const handleDurationChange = (durationValue: string) => {
    setFormState((current) => {
      const updatedState: SlotTemplateFormState = { ...current, slot_duration_minutes: durationValue };
      const startMinutes = parseTimeToMinutes(current.start_time);
      const durationMinutes = Number.parseInt(durationValue, 10);

      if (startMinutes !== null && Number.isFinite(durationMinutes) && durationMinutes > 0) {
        updatedState.end_time = minutesToTime(startMinutes + durationMinutes);
      }

      return updatedState;
    });
  };

  const handleEndTimeChange = (endTime: string) => {
    setFormState((current) => {
      const updatedState: SlotTemplateFormState = { ...current, end_time: endTime };
      const durationMinutes = getDurationFromStartEnd(current.start_time, endTime);

      if (durationMinutes !== null) {
        updatedState.slot_duration_minutes = String(durationMinutes);
      }

      return updatedState;
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

  const handleToggleTemplateActive = async (template: SlotTemplateItem) => {
    setSaving(true);
    setActionError("");
    setActionMessage("");
    try {
      await updateSlotTemplate(template.id, { is_active: !template.is_active });
      setActionMessage(
        `Slot template ${!template.is_active ? "activated" : "deactivated"} successfully.`
      );
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

      {/* Templates / Assignments Tabs */}
      <section className="rounded-3xl border border-slate-100 bg-white/95 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-4 md:px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("templates")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "templates"
                  ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Slot Templates
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "templates" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}>
                {templates.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("assignments")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "assignments"
                  ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Doctor Assignments
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "assignments" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              }`}>
                {assignments.length}
              </span>
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {activeTab === "templates" && (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {editingTemplateId ? "Edit Template" : "Create Template"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Create a weekly slot template for this hospital.</p>
                    </div>
                    {editingTemplateId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Doctor</label>
                      <select
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={formState.doctor}
                        onChange={(event) => setFormState((current) => ({ ...current, doctor: event.target.value }))}
                      >
                        <option value="">Generic template (apply later)</option>
                        {verifiedDoctors.map((doctor) => (
                          <option key={doctor.id} value={String(doctor.doctor)}>
                            {doctor.doctorName || `Doctor ${doctor.doctor}`}
                            {doctor.doctorIdentifier ? ` (${doctor.doctorIdentifier})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Day</label>
                      <select
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={formState.day_of_week}
                        onChange={(event) => setFormState((current) => ({ ...current, day_of_week: event.target.value }))}
                        required
                      >
                        {dayNames.map((dayName, index) => (
                          <option key={dayName} value={index}>
                            {dayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Duration</label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={formState.slot_duration_minutes}
                        onChange={(event) => handleDurationChange(event.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Start</label>
                      <input
                        type="time"
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={formState.start_time}
                        onChange={(event) => handleStartTimeChange(event.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">End</label>
                      <input
                        type="time"
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={formState.end_time}
                        onChange={(event) => handleEndTimeChange(event.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Patient Limit</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={formState.default_patient_limit}
                        onChange={(event) => setFormState((current) => ({ ...current, default_patient_limit: event.target.value }))}
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                        checked={formState.is_active}
                        onChange={(event) => setFormState((current) => ({ ...current, is_active: event.target.checked }))}
                      />
                      <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 select-none">
                        Active
                      </label>
                    </div>

                    <div className="sm:col-span-2 flex gap-2">
                      <button
                        type="submit"
                        disabled={saving || hospitalsLoading || !selectedHospitalId}
                        className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {saving ? "Saving..." : editingTemplateId ? "Update Template" : "Create Template"}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="border-b border-slate-200 pb-3 mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Generate Slots</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Create appointment slots from active templates.</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Days Ahead</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={generationDays}
                        onChange={(event) => setGenerationDays(event.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Doctor</label>
                      <select
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={generationDoctorId}
                        onChange={(event) => setGenerationDoctorId(event.target.value)}
                      >
                        <option value="">All affiliated doctors</option>
                        {verifiedDoctors.map((doctor) => (
                          <option key={doctor.id} value={String(doctor.doctor)}>
                            {doctor.doctorName || `Doctor ${doctor.doctor}`}
                            {doctor.doctorIdentifier ? ` (${doctor.doctorIdentifier})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="skip_duplicates"
                        className="h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20"
                        checked={skipDuplicates}
                        onChange={(event) => setSkipDuplicates(event.target.checked)}
                      />
                      <label htmlFor="skip_duplicates" className="text-sm font-semibold text-slate-700 select-none">
                        Skip duplicate slots
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating || loading || !selectedHospitalId}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {generating ? "Generating Slots..." : "Generate Appointment Calendar"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Search</label>
                    <input
                      type="text"
                      value={templateSearch}
                      onChange={(event) => setTemplateSearch(event.target.value)}
                      placeholder="Doctor, ID, or time"
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Day</label>
                    <select
                      value={templateDayFilter}
                      onChange={(event) => setTemplateDayFilter(event.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="all">All Days</option>
                      {dayNames.map((dayName, index) => (
                        <option key={dayName} value={String(index)}>
                          {dayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Status</label>
                    <select
                      value={templateStatusFilter}
                      onChange={(event) => setTemplateStatusFilter(event.target.value as "all" | "active" | "inactive")}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </section>

              {hospitalsLoading && (
                <div className="text-slate-500 text-center py-6 text-sm">Loading hospital databases...</div>
              )}
              {!hospitalsLoading && loading && (
                <div className="text-slate-500 text-center py-6 text-sm">Fetching shift templates...</div>
              )}
              {error && <div className="text-red-600 text-center py-6 text-sm font-semibold">{error}</div>}

              {!loading && !error && (
                <>
                  {filteredTemplates.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
                      {templates.length === 0
                        ? "No slot templates have been created for this hospital."
                        : "No templates match the current filters."}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {filteredTemplates.map((t) => {
                        const dayLabel =
                          typeof t.day_of_week === "number"
                            ? dayNames[t.day_of_week] || String(t.day_of_week)
                            : t.day_of_week || "-";
                        const doctorLabel =
                          t.doctorName || t.doctor_name || t.doctor_display || "Generic Template";
                        const doctorSubLabel =
                          t.doctorIdentifier || (t.doctor ? `DOC-${t.doctor}` : "All doctors");

                        return (
                          <article key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">{doctorLabel}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{doctorSubLabel}</p>
                              </div>
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  t.is_active
                                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10"
                                    : "bg-slate-50 text-slate-500 ring-1 ring-slate-500/10"
                                }`}
                              >
                                {t.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <dt className="text-slate-500">Day</dt>
                                <dd className="font-semibold text-slate-800 mt-0.5">{dayLabel}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Template ID</dt>
                                <dd className="font-mono text-slate-700 mt-0.5">#{String(t.id)}</dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Time Window</dt>
                                <dd className="font-semibold text-slate-800 mt-0.5">
                                  {t.start_time?.substring(0, 5)} - {t.end_time?.substring(0, 5)}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-slate-500">Duration</dt>
                                <dd className="font-semibold text-slate-800 mt-0.5">
                                  {t.slot_duration_minutes ?? t.slot_duration ?? "-"} mins
                                </dd>
                              </div>
                              <div className="col-span-2">
                                <dt className="text-slate-500">Patient Limit</dt>
                                <dd className="font-semibold text-slate-800 mt-0.5">
                                  {t.patient_limit ?? t.default_patient_limit ?? "-"} patients
                                </dd>
                              </div>
                            </dl>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(t)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleTemplateActive(t)}
                                disabled={saving}
                                className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                              >
                                {t.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(t.id)}
                                disabled={saving}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                Delete Permanently
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "assignments" && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <h3 className="text-sm font-bold text-slate-900">Assign Templates to Doctors</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select one or more templates and doctors to create recurring assignment windows.
                </p>

                <form onSubmit={handleApplyTemplates} className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Templates</label>
                    <select
                      multiple
                      value={selectedTemplates}
                      onChange={(event) => {
                        const values = Array.from(event.target.selectedOptions).map((opt) => opt.value);
                        setSelectedTemplates(values);
                      }}
                      className="block h-36 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {templates.map((template) => {
                        const dayLabel =
                          typeof template.day_of_week === "number"
                            ? dayNames[template.day_of_week] || template.day_of_week
                            : template.day_of_week || "-";
                        const doctorLabel =
                          template.doctorName || template.doctor_name || template.doctor_display || "Generic";
                        return (
                          <option key={template.id} value={String(template.id)}>
                            #{String(template.id)} | {doctorLabel} | {dayLabel} {template.start_time?.substring(0, 5)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Doctors</label>
                    <select
                      multiple
                      value={selectedDoctors}
                      onChange={(event) => {
                        const values = Array.from(event.target.selectedOptions).map((opt) => opt.value);
                        setSelectedDoctors(values);
                      }}
                      className="block h-36 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {verifiedDoctors.map((doctor) => (
                        <option key={doctor.id} value={String(doctor.doctor)}>
                          {doctor.doctorName || `Doctor ${doctor.doctor}`}
                          {doctor.doctorIdentifier ? ` (${doctor.doctorIdentifier})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Timeframe</label>
                    <select
                      value={timeframeType}
                      onChange={(event) => setTimeframeType(event.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="1_week">1 Week</option>
                      <option value="2_weeks">2 Weeks</option>
                      <option value="1_month">1 Month</option>
                      <option value="3_months">3 Months</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {timeframeType === "custom" && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={applying || saving || !selectedHospitalId}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {applying ? "Applying..." : "Apply Templates"}
                    </button>
                  </div>
                </form>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Current Doctor Assignments</h3>
                  <button
                    type="button"
                    onClick={() => void refreshAssignments()}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Refresh
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Search</label>
                      <input
                        type="text"
                        value={assignmentSearch}
                        onChange={(event) => setAssignmentSearch(event.target.value)}
                        placeholder="Doctor, template, day"
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Status</label>
                      <select
                        value={assignmentStatusFilter}
                        onChange={(event) =>
                          setAssignmentStatusFilter(event.target.value as "all" | "active" | "inactive")
                        }
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {assignmentsLoading ? (
                  <div className="text-slate-500 text-center py-6 text-sm">Loading assignments...</div>
                ) : filteredAssignments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
                    {assignments.length === 0
                      ? "No template assignments found for this hospital."
                      : "No assignments match the current filters."}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredAssignments.map((assignment) => {
                      const detail = assignment.slot_template_detail || assignment.templateDetails;
                      const dayValue =
                        (detail as { day_of_week?: number })?.day_of_week ?? undefined;
                      const dayLabel =
                        (detail as { day_name?: string })?.day_name ||
                        (typeof dayValue === "number" ? dayNames[dayValue] : "-");

                      return (
                        <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">
                                {assignment.doctorName || assignment.doctor_preferred_name || `Doctor ${assignment.doctor}`}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {assignment.doctorIdentifier || `DOC-${assignment.doctor}`}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                assignment.is_active
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-700/10"
                                  : "bg-slate-50 text-slate-500 ring-1 ring-slate-500/10"
                              }`}
                            >
                              {assignment.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <dt className="text-slate-500">Assignment</dt>
                              <dd className="font-mono text-slate-700 mt-0.5">#{String(assignment.id)}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Template</dt>
                              <dd className="font-mono text-slate-700 mt-0.5">#{String(assignment.slot_template)}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Day</dt>
                              <dd className="font-semibold text-slate-800 mt-0.5">{dayLabel}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-500">Time Window</dt>
                              <dd className="font-semibold text-slate-800 mt-0.5">
                                {(detail as { start_time?: string })?.start_time?.substring(0, 5) || "--:--"} - {" "}
                                {(detail as { end_time?: string })?.end_time?.substring(0, 5) || "--:--"}
                              </dd>
                            </div>
                            <div className="col-span-2">
                              <dt className="text-slate-500">Assignment Window</dt>
                              <dd className="font-semibold text-slate-800 mt-0.5">
                                {assignment.start_date} to {assignment.end_date}
                              </dd>
                            </div>
                          </dl>

                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => handleRevokeAssignment(assignment.id)}
                              disabled={saving}
                              className="w-full rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              Revoke Assignment
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HospitalSlotsPage;
