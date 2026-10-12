import { api } from "@/lib/api";

export interface Space {
  id: string;
  contact_name: string;
  email: string;
  phone?: string | null;
  space_name: string;
  space_type?: string | null;
  address: string;
  city: string;
  pin: string;
  capacity: number;
  amenities?: string[] | null;
  availability?: string | null;
  notes?: string | null;
  status: "new" | "contacted" | "approved" | "declined";
  created_at: string;
  updated_at?: string;
}

export interface AdminSpacesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminSpacesResponse {
  spaces: Space[];
  pagination: AdminSpacesPagination;
}

export async function adminListSpaces(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  city?: string;
}): Promise<AdminSpacesResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.append("page", String(params.page));
  if (params?.limit) qs.append("limit", String(params.limit));
  if (params?.search) qs.append("search", params.search);
  if (params?.status) qs.append("status", params.status);
  if (params?.city) qs.append("city", params.city);
  const query = qs.toString();
  return api<AdminSpacesResponse>(`/api/admin/spaces${query ? `?${query}` : ""}`);
}

export async function adminCreateSpace(
  data: Partial<Space>
): Promise<{ message: string; space: Space }> {
  return api<{ message: string; space: Space }>("/api/admin/spaces", {
    method: "POST",
    body: data,
  });
}

export async function adminUpdateSpace(
  id: string,
  data: Partial<Space>
): Promise<{ message: string; space: Space }> {
  return api<{ message: string; space: Space }>(`/api/admin/spaces/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function adminUpdateSpaceStatus(
  id: string,
  status: string
): Promise<{ message: string; space: Space }> {
  return api<{ message: string; space: Space }>(`/api/admin/spaces/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export async function adminDeleteSpace(
  id: string
): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/admin/spaces/${id}`, {
    method: "DELETE",
  });
}
