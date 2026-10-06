import { api } from "./api";

export type AppointmentPayload = {
  service_id: string;
  practitioner_slug: string;
  date: string;
  time: string;
  group_size?: number;
  attendees?: string[];
  meeting_location?: {
    lat: number;
    lng: number;
    address: string;
    place_id: string;
  };
  mode?: "host" | "centre" | "online";
};

export async function createAppointment(payload: AppointmentPayload) {
  return api("/api/appointments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
}

export async function listMyAppointments(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.append("status", status);
  return api(`/api/appointments?${params.toString()}`);
}

export async function listPractitionerAppointments(status?: string, page = 1) {
  const params = new URLSearchParams({ page: String(page) });
  if (status) params.append("status", status);
  return api(`/api/practitioners/appointments?${params.toString()}`);
}

export async function updatePractitionerAppointmentStatus(id: string, status: string, aftercare_notes?: string) {
  return api(`/api/practitioners/appointments/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: { status, aftercare_notes },
  });
}
