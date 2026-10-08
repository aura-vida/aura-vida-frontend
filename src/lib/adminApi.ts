import { api } from "@/lib/api";

export interface AdminDashboardSummary {
  totalUsers: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenueInr: number;
  totalPractitioners?: number;
  totalSpaces?: number;
}

export interface AdminUser {
  id: string;
  full_name: string | null;
  email?: string | null;
  phone?: string | null;
  role?: "client" | "practitioner" | "admin" | string | null;
  status?: "active" | "inactive" | string | null;
  credit_inr?: number | null;
  practitioner_slug?: string | null;
  referral_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminUsersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminUsersResponse {
  data: AdminUser[];
  pagination: AdminUsersPagination;
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  return api<AdminDashboardSummary>("/api/admin/dashboard");
}

export async function getAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<AdminUsersResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.append("page", String(params.page));
  if (params?.limit) qs.append("limit", String(params.limit));
  if (params?.search) qs.append("search", params.search);
  if (params?.status) qs.append("status", params.status);
  const query = qs.toString();
  return api<AdminUsersResponse>(`/api/admin/users${query ? `?${query}` : ""}`);
}

export async function updateAdminUserStatus(
  userId: string,
  status: "active" | "inactive"
): Promise<{ id: string; status: string }> {
  return api<{ id: string; status: string }>(`/api/admin/users/${userId}/status`, {
    method: "PATCH",
    body: { status },
  });
}
