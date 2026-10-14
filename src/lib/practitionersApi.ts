import { api } from "@/lib/api";
import type { Service } from "@/lib/servicesApi";

export interface Practitioner {
  id?: string;
  slug: string;
  name: string;
  bio?: string | null;
  city: string | null;
  craft: string | null;
  rating: number;
  sessions?: number;
  price_inr: number;
  mobile_number?: string | null;
  whatsapp_number?: string | null;
  image_url: string | null;
  bookable: boolean;
  is_published?: boolean;
  sort_order?: number;
  keywords?: string[];
  offers_centre?: boolean;
  offers_host?: boolean;
  offers_online?: boolean;
  application_email?: string | null;
  application_status?: 'pending' | 'approved' | 'rejected';
}

export interface PractitionersListResponse {
  practitioners: Practitioner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const listPractitioners = (params?: { craft?: string; city?: string; bookable?: boolean; page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.craft) qs.append("craft", params.craft);
  if (params?.city) qs.append("city", params.city);
  if (params?.bookable !== undefined) qs.append("bookable", String(params.bookable));
  if (params?.page) qs.append("page", String(params.page));
  if (params?.limit) qs.append("limit", String(params.limit));
  const queryString = qs.toString();
  return api<PractitionersListResponse>(`/api/practitioners${queryString ? `?${queryString}` : ""}`);
};

export const getPractitioner = (slug: string) =>
  api<{ practitioner: Practitioner }>(`/api/practitioners/${slug}`);

// Services this practitioner actually offers (falls back to the full active
// catalog server-side if none have been assigned yet). Pricing for a booking
// is always based on the practitioner's own `price_inr`, not a service's.
export const getPractitionerServices = (slug: string) =>
  api<{ services: Service[] }>(`/api/practitioners/${slug}/services`);

export const getMyPractitionerProfile = () => 
  api<{ practitioner: Practitioner }>("/api/practitioners/me");

export const updateMyPractitionerProfile = (fields: Partial<Practitioner> | FormData) => 
  api<{ message: string; practitioner: Practitioner }>("/api/practitioners/me", {
    method: "PATCH",
    body: fields,
  });


export const adminCreatePractitioner = (fields: Partial<Practitioner> & { email: string }) =>
  api<{ message: string; practitioner: Practitioner; email: string }>("/api/admin/practitioners", {
    method: "POST",
    body: fields,
  });

export const adminListPractitioners = (params?: { search?: string; is_published?: boolean; page?: number; limit?: number }) => {
  const qs = new URLSearchParams();
  if (params?.search) qs.append("search", params.search);
  if (params?.is_published !== undefined) qs.append("is_published", String(params.is_published));
  if (params?.page) qs.append("page", String(params.page));
  if (params?.limit) qs.append("limit", String(params.limit));
  const queryString = qs.toString();
  return api<PractitionersListResponse>(`/api/admin/practitioners${queryString ? `?${queryString}` : ""}`);
};

export const adminUpdatePractitioner = (id: string, fields: Partial<Practitioner>) => 
  api<{ message: string; practitioner: Practitioner }>(`/api/admin/practitioners/${id}`, {
    method: "PATCH",
    body: fields,
  });

export const adminDeletePractitioner = (id: string) => 
  api<{ message: string }>(`/api/admin/practitioners/${id}`, {
    method: "DELETE",
  });

export const adminApprovePractitioner = (id: string) =>
  api<{ message: string; practitioner: Practitioner; email: string }>(
    `/api/admin/practitioners/${id}/approve`,
    { method: "POST" }
  );

export const submitPractitionerSupport = (fields: {
  title: string;
  description: string;
  category?: string;
}) =>
  api<{ message: string; ticket: { title: string; description: string; enquiryId?: string | null } }>(
    "/api/practitioners/support",
    {
      method: "POST",
      body: fields,
    }
  );
