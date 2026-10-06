import { api } from "@/lib/api";
import { AuthProfile } from "@/lib/authApi";

export interface Appointment {
  id: string;
  practitioner_name: string;
  mode: string;
  pin: string | null;
  scheduled_at: string | null;
  status: string;
  amount: number | null;
  aftercare_notes: string | null;
  created_at: string;
  group_size: number | null;
  attendees: string[] | null;
  item_id: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  pagination: Pagination;
}

export const getMe = () => 
  api<{ profile: AuthProfile }>("/api/users/me");

export const updateMe = (fields: { full_name?: string; phone?: string; referred_by?: string }) => 
  api<{ message: string; profile: AuthProfile }>("/api/users/me", {
    method: "PATCH",
    body: fields,
  });

export const getMyAppointments = (params?: { status?: string; page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.append("status", params.status);
  if (params?.page) qs.append("page", params.page.toString());
  if (params?.limit) qs.append("limit", params.limit.toString());
  const queryString = qs.toString();
  return api<AppointmentsResponse>(`/api/users/me/appointments${queryString ? `?${queryString}` : ""}`);
};

export const deleteMe = () => 
  api<{ success: boolean }>("/api/users/me", {
    method: "DELETE",
    body: { confirmation: true },
  });
