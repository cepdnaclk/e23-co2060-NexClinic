export interface HospitalAdminItem {
  id?: number | string;
  hospital?: number | string;
  hospitalName?: string;
  name?: string;
}

export interface SlotTemplateItem {
  id: number | string;
  doctor?: number | string;
  doctorName?: string;
  doctorIdentifier?: string;
  doctor_name?: string;
  doctor_display?: string;
  hospital?: number | string;
  hospitalName?: string;
  day_of_week?: number | string;
  start_time?: string;
  end_time?: string;
  slot_duration_minutes?: number;
  slot_duration?: number;
  default_patient_limit?: number;
  patient_limit?: number;
  is_active?: boolean;
  is_deleted?: boolean;
}

export interface DoctorVerificationItem {
  id: number | string;
  doctor: number | string;
  doctorName?: string;
  doctorIdentifier?: string;
  hospital: number | string;
  hospitalName?: string;
  status?: string;
}

export interface SlotGenerationResult {
  message?: string;
  created_count?: number;
  skipped_count?: number;
  created_slot_ids?: Array<number | string>;
}

export async function fetchAdminHospitals(): Promise<{ hospitals: HospitalAdminItem[] }> {
  const res = await fetch("/api/hospital/admin-hospitals", { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || payload?.detail || "Failed to fetch hospitals");
  }
  return res.json();
}

export async function fetchSlotTemplates(hospitalId: string): Promise<{ templates?: SlotTemplateItem[]; slot_templates?: SlotTemplateItem[]; results?: SlotTemplateItem[] }> {
  const params = new URLSearchParams({ hospital_id: hospitalId });
  const res = await fetch(`/api/hospital/slot-templates?${params.toString()}`, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || payload?.detail || "Failed to fetch slot templates");
  }
  return res.json();
}

export async function fetchVerifiedDoctors(hospitalId: string): Promise<{ verifications: DoctorVerificationItem[] }> {
  const params = new URLSearchParams({ hospital_id: hospitalId, status: "VERIFIED" });
  const res = await fetch(`/api/hospital/doctor-verifications?${params.toString()}`, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || payload?.detail || "Failed to fetch verified doctors");
  }
  return res.json();
}

export async function createSlotTemplate(payload: Record<string, unknown>): Promise<{ template: SlotTemplateItem }> {
  const res = await fetch("/api/hospital/slot-templates", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || data?.detail || "Failed to create slot template");
  }
  return res.json();
}

export async function updateSlotTemplate(templateId: string | number, payload: Record<string, unknown>): Promise<{ template: SlotTemplateItem }> {
  const res = await fetch(`/api/hospital/slot-templates/${templateId}`, {
    method: "PATCH",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || data?.detail || "Failed to update slot template");
  }
  return res.json();
}

export async function deleteSlotTemplate(templateId: string | number): Promise<void> {
  const res = await fetch(`/api/hospital/slot-templates/${templateId}`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || data?.detail || "Failed to delete slot template");
  }
}

export async function generateSlots(payload: Record<string, unknown>): Promise<SlotGenerationResult> {
  const res = await fetch("/api/hospital/appointment-slots/generate", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || data?.detail || "Failed to generate slots");
  }
  return res.json();
}

export interface DoctorSlotTemplateAssignmentItem {
  id: number | string;
  doctor: number | string;
  doctorName?: string;
  doctorIdentifier?: string;
  doctor_preferred_name?: string;
  hospital: number | string;
  hospitalName?: string;
  slot_template: number | string;
  slot_template_detail?: SlotTemplateItem;
  templateDetails?: {
    id: number | string;
    day_of_week?: number;
    day_name?: string;
    start_time?: string;
    end_time?: string;
    slot_duration_minutes?: number;
    default_patient_limit?: number;
  };
  start_date: string;
  end_date: string;
  is_active?: boolean;
  created_at?: string;
  status?: string;
}

export async function applySlotTemplates(payload: Record<string, unknown>): Promise<{
  detail: string;
  created_slots: number;
  skipped_slots: number;
  assignments: DoctorSlotTemplateAssignmentItem[];
}> {
  const res = await fetch("/api/hospital/slot-templates/apply", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || data?.detail || "Failed to apply slot templates");
  }
  return res.json();
}

export async function fetchSlotTemplateAssignments(hospitalId: string): Promise<{ assignments: DoctorSlotTemplateAssignmentItem[] }> {
  const params = new URLSearchParams({ hospital_id: hospitalId });
  const res = await fetch(`/api/hospital/slot-template-assignments?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || payload?.detail || "Failed to fetch slot template assignments");
  }
  return res.json();
}

export async function deleteSlotTemplateAssignment(assignmentId: string | number): Promise<{ detail: string; deleted_slots_count: number }> {
  const res = await fetch(`/api/hospital/slot-template-assignments/${assignmentId}`, {
    method: "DELETE",
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || data?.detail || "Failed to revoke slot template assignment");
  }
  return res.json();
}

