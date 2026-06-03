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
  type HospitalAdminItem,
  type DoctorVerificationItem,
  type SlotTemplateItem,
} from "@/lib/api/hospitalSlots";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
  day_of_week: "1",
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Hospital Slots</h1>
        <p className="text-sm text-slate-600">Manage verified doctors&apos; slot templates and generate appointment slots for the selected hospital.</p>
      </div>

      <div className="mb-4 rounded-lg border bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-slate-700">Hospital</label>
        <select
          className="w-full max-w-xl rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        {selectedHospital && (
          <p className="mt-2 text-sm text-slate-500">
            Showing templates for <span className="font-medium">{selectedHospital.hospitalName || selectedHospital.name || selectedHospitalId}</span>
          </p>
        )}
      </div>

      {(actionError || actionMessage) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${actionError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {actionError || actionMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{editingTemplateId ? "Edit Slot Template" : "Create Slot Template"}</h2>
              <p className="text-sm text-slate-500">Use verified doctors from this hospital only.</p>
            </div>
            {editingTemplateId && (
              <button type="button" onClick={resetForm} className="rounded-md border px-3 py-2 text-sm">Cancel edit</button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm">
              <span className="mb-1 block font-medium text-slate-700">Doctor</span>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2"
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
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Day of week</span>
              <select className="w-full rounded-md border border-slate-300 px-3 py-2" value={formState.day_of_week} onChange={(event) => setFormState((current) => ({ ...current, day_of_week: event.target.value }))} required>
                {dayNames.map((dayName, index) => (
                  <option key={dayName} value={index}>{dayName}</option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Duration (minutes)</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="number" min={5} step={5} value={formState.slot_duration_minutes} onChange={(event) => setFormState((current) => ({ ...current, slot_duration_minutes: event.target.value }))} required />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Start time</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="time" value={formState.start_time} onChange={(event) => setFormState((current) => ({ ...current, start_time: event.target.value }))} required />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">End time</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="time" value={formState.end_time} onChange={(event) => setFormState((current) => ({ ...current, end_time: event.target.value }))} required />
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Patient limit</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="number" min={1} step={1} value={formState.default_patient_limit} onChange={(event) => setFormState((current) => ({ ...current, default_patient_limit: event.target.value }))} required />
            </label>

            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={formState.is_active} onChange={(event) => setFormState((current) => ({ ...current, is_active: event.target.checked }))} />
              Active
            </label>

            <div className="sm:col-span-2 flex gap-2 pt-2">
              <button type="submit" disabled={saving || hospitalsLoading || !selectedHospitalId || verifiedDoctors.length === 0} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {saving ? "Saving..." : editingTemplateId ? "Update template" : "Create template"}
              </button>
              <button type="button" onClick={resetForm} className="rounded-md border px-4 py-2 text-sm">
                Reset
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Generate Slots</h2>
            <p className="text-sm text-slate-500">Generate appointment slots from all active templates in the selected hospital.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Days ahead</span>
              <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="number" min={1} step={1} value={generationDays} onChange={(event) => setGenerationDays(event.target.value)} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Doctor filter</span>
              <select className="w-full rounded-md border border-slate-300 px-3 py-2" value={generationDoctorId} onChange={(event) => setGenerationDoctorId(event.target.value)}>
                <option value="">All doctors</option>
                {verifiedDoctors.map((doctor) => (
                  <option key={doctor.id} value={String(doctor.doctor)}>
                    {doctor.doctorName || `Doctor ${doctor.doctor}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={skipDuplicates} onChange={(event) => setSkipDuplicates(event.target.checked)} />
            Skip duplicate slots
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || loading || !selectedHospitalId}
            className="mt-4 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate slots"}
          </button>
        </section>
      </div>

      {hospitalsLoading && <div className="text-slate-600">Loading hospitals...</div>}
      {!hospitalsLoading && loading && <div className="text-slate-600">Loading templates...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto bg-white rounded shadow-sm">
          <table className="min-w-full text-sm text-left">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Duration (min)</th>
                <th className="px-4 py-3">Patient Limit</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No templates found.
                  </td>
                </tr>
              )}

              {templates.map((t) => (
                <tr key={t.id} className="border-b">
                  <td className="px-4 py-3 align-top">{String(t.id)}</td>
                  <td className="px-4 py-3 align-top">{t.doctor_name || t.doctor || t.doctor_display || "-"}</td>
                  <td className="px-4 py-3 align-top">{typeof t.day_of_week === "number" ? dayNames[t.day_of_week] : t.day_of_week}</td>
                  <td className="px-4 py-3 align-top">{t.start_time || "-"}</td>
                  <td className="px-4 py-3 align-top">{t.end_time || "-"}</td>
                  <td className="px-4 py-3 align-top">{t.slot_duration_minutes ?? t.slot_duration ?? "-"}</td>
                  <td className="px-4 py-3 align-top">{t.patient_limit ?? t.default_patient_limit ?? "-"}</td>
                  <td className="px-4 py-3 align-top">{t.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleEdit(t)} className="rounded-md border px-3 py-1.5 text-xs font-medium">Edit</button>
                      <button type="button" onClick={() => handleDelete(t.id)} className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HospitalSlotsPage;
