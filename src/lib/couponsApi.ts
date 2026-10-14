import { api } from "@/lib/api";

export interface CouponValidationResponse {
  valid: boolean;
  code: string;
  discountPercent: number;
}

// `amount` (session subtotal in INR, before tax) is checked against the
// coupon's minimum booking amount, if one is configured.
// Throws (via the shared `api()` helper) with the backend's message on an
// invalid code or a failed eligibility rule — callers should catch and show
// `err.message`.
export async function validateCoupon(code: string, amount?: number) {
  return api<CouponValidationResponse>("/api/coupons/validate", {
    method: "POST",
    body: { code, amount },
  });
}

// ─── Admin CRUD ─────────────────────────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  // Eligibility rules. first_booking_only defaults on; min_booking_amount_inr
  // null/undefined means no minimum.
  first_booking_only: boolean;
  min_booking_amount_inr: number | null;
  created_at: string;
  updated_at: string;
}

export const adminListCoupons = () =>
  api<{ coupons: Coupon[] }>("/api/admin/coupons");

export const adminCreateCoupon = (data: {
  code: string;
  discount_percent: number;
  is_active?: boolean;
  first_booking_only?: boolean;
  min_booking_amount_inr?: number | null;
}) =>
  api<{ message: string; coupon: Coupon }>("/api/admin/coupons", {
    method: "POST",
    body: data,
  });

export const adminUpdateCoupon = (
  id: string,
  data: Partial<Pick<Coupon, "code" | "discount_percent" | "is_active" | "first_booking_only" | "min_booking_amount_inr">>
) =>
  api<{ message: string; coupon: Coupon }>(`/api/admin/coupons/${id}`, {
    method: "PATCH",
    body: data,
  });

export const adminDeleteCoupon = (id: string) =>
  api<{ message: string }>(`/api/admin/coupons/${id}`, {
    method: "DELETE",
  });
