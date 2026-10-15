import { api } from "@/lib/api";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_min: number | null;
  price_inr: number | null;
  category: string | null;
  image_url: string | null;
  is_active?: boolean;
  sort_order?: number;
  practitioner_id?: string | null;
  // Embedded owner info — only present on the admin read-only listing.
  practitioners?: { id: string; name: string; slug: string } | null;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ServicesListResponse = {
  services: Service[];
  pagination: Pagination;
};

export const listServices = (params: { category?: string; page?: number; limit?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();
  return api<ServicesListResponse>(`/api/services${qs ? `?${qs}` : ""}`);
};

export const getService = (id: string) =>
  api<{ service: Service }>(`/api/services/${id}`);

// Admin only, read-only — services are created and managed by the
// practitioners who own them; this is purely an oversight view, and each row
// includes the owning practitioner (see Service.practitioners above).
export const adminListServices = (params: { category?: string; page?: number; limit?: number } = {}) => {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.page != null) query.set("page", String(params.page));
  if (params.limit != null) query.set("limit", String(params.limit));
  const qs = query.toString();
  return api<ServicesListResponse>(`/api/admin/services${qs ? `?${qs}` : ""}`);
};

// ─── Practitioner self-service ──────────────────────────────────────────────

export type MyServiceFields = {
  name?: string;
  description?: string | null;
  price_inr?: number;
  category?: string | null;
  sort_order?: number;
  is_active?: boolean;
  image?: File | null;
};

const buildServiceFormData = (fields: MyServiceFields) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (key === "image" || value === undefined || value === null) return;
    formData.append(key, String(value));
  });
  if (fields.image) formData.append("image", fields.image);
  return formData;
};

export const listMyServices = () =>
  api<{ services: Service[] }>(`/api/practitioners/me/services`);

export const createMyService = (fields: MyServiceFields) =>
  api<{ message: string; service: Service }>(`/api/practitioners/me/services`, {
    method: "POST",
    body: buildServiceFormData(fields),
  });

export const updateMyService = (id: string, fields: MyServiceFields) =>
  api<{ message: string; service: Service }>(`/api/practitioners/me/services/${id}`, {
    method: "PATCH",
    body: buildServiceFormData(fields),
  });

export const deleteMyService = (id: string) =>
  api<{ message: string }>(`/api/practitioners/me/services/${id}`, {
    method: "DELETE",
  });
