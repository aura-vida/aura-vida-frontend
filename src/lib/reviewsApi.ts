import { api } from "@/lib/api";

export type Review = {
  id: string;
  practitioner_id: string;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export const submitReview = (fields: { practitioner_id: string; booking_id?: string; rating: number; comment?: string }) =>
  api<{ message: string; data: Review }>("/api/reviews", {
    method: "POST",
    body: fields,
  });

// The logged-in client's own submitted reviews — used to show "already
// reviewed" instead of offering the form again for a booking.
export const listMyReviews = () =>
  api<{ reviews: Review[] }>("/api/reviews/mine");
