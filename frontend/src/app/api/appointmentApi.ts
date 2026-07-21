import { handlePatientSessionExpired } from "@/lib/patientSession";

export const fetchAvailableSlots = async (doctorId?: string, router?: any) => {
  const params = new URLSearchParams();
  if (doctorId) {
    params.set("doctor_id", doctorId);
  }

  const endpoint = params.toString()
    ? `/api/patient/appointment-slots?${params.toString()}`
    : "/api/patient/appointment-slots";

  const response = await fetch(endpoint, {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    if (router) {
      handlePatientSessionExpired(router);
    }
    throw new Error("Session expired");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error || "Failed to load available slots");
  }

  return payload;
};
