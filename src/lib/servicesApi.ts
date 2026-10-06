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

export const adminCreateService = (data: Partial<Service>) =>
  api<{ message: string; service: Service }>(`/api/admin/services`, {
    method: 'POST',
    body: data,
  });

export const adminUpdateService = (id: string, data: Partial<Service>) =>
  api<{ message: string; service: Service }>(`/api/admin/services/${id}`, {
    method: 'PATCH',
    body: data,
  });

export const adminDeleteService = (id: string) =>
  api<{ message: string }>(`/api/admin/services/${id}`, {
    method: 'DELETE',
  });
