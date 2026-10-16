import { api } from "./api";

export type AppointmentPayload = {
  service_id: string;
  practitioner_slug: string;
  date: string;
  time: string;
  group_size?: number;
  attendees?: { name: string; email: string }[];
  meeting_location?: {
    address: string;
    lat?: number;
    lng?: number;
    place_id?: string;
    pincode?: string;
    type?: string;
  };
  mode?: "host" | "centre" | "online";
  pin?: string | null;
  coupon_code?: string | null;
};

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

export type TimeSlot = {
  start: string;
  end: string;
  duration_min?: number;
  available?: boolean;
};

export async function getAvailableSlots(slug: string, date: string, serviceId?: string, spaceId?: string) {
  const params = new URLSearchParams({ slug, date });
  if (serviceId) params.append("serviceId", serviceId);
  if (spaceId) params.append("spaceId", spaceId);
  return api<{ date: string; slots: TimeSlot[] }>(`/api/appointments/available-slots?${params.toString()}`);
}

export type CancelRefundResult = {
  amount?: number; // paise — only the session price, tax is non-refundable
  non_refundable_tax_inr?: number;
  status?: string;
  error?: string;
} | null;

export async function cancelAppointment(id: string) {
  return api<{ message: string; appointment: unknown; refund?: CancelRefundResult }>(
    `/api/appointments/${id}/cancel`,
    { method: "POST" }
  );
}

export async function rescheduleAppointment(id: string, date: string, time: string) {
  return api(`/api/appointments/${id}/reschedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { date, time },
  });
}

export type AdminBooking = {
  id: string;
  client_id: string;
  client_name?: string | null;
  practitioner_slug?: string;
  practitioner_name?: string | null;
  item_id?: string;
  amount?: number | null;
  currency?: string;
  mode?: string;
  scheduled_at?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  group_size?: number;
  attendees?: { name: string; email: string }[];
  meeting_location?: {
    address?: string;
    pincode?: string;
    place_id?: string;
    lat?: number;
    lng?: number;
  } | null;
  created_at: string;
  aftercare_notes?: string | null;
};

export type AdminAppointmentsResponse = {
  data: AdminBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function adminListAppointments(filters?: { status?: string; page?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") params.append("status", filters.status);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));
  const query = params.toString();
  return api<AdminAppointmentsResponse>(`/api/admin/appointments${query ? `?${query}` : ""}`);
}

export async function adminConfirmAppointment(id: string) {
  return api<{ message: string; appointment: AdminBooking }>(`/api/admin/appointments/${id}/confirm`, {
    method: "POST",
  });
}

export async function adminAssignPractitioner(id: string, practitioner_slug: string) {
  return api<{ message: string; appointment: AdminBooking }>(`/api/admin/appointments/${id}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { practitioner_slug },
  });
}

