import { api } from "./api";

export interface EventPricingBreakdown {
  baseAmount: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
  amountPaise: number;
  currency: string;
  unitPrice?: number;
  ticketQuantity?: number;
}

export interface StaticEvent {
  id: string;
  title: string;
  subtitle: string;
  guide: {
    name: string;
    craft: string;
    slug?: string;
    photo?: string;
  };
  description: string;
  schedule: {
    date: string;
    isoDate: string;
    time: string;
    duration: string;
    venue: string;
    status: string;
  };
  pricing: {
    basePriceInr: number;
    currency: string;
  };
  whatToExpect: string[];
  goodToKnow: string[];
  image: string;
  pricingBreakdown: EventPricingBreakdown;
}

export interface EventBooking {
  id: string;
  event_id: string;
  event_name: string;
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  ticket_quantity?: number;
  ticket_price?: number;
  base_amount: number;
  gst_percentage: number;
  gst_amount: number;
  total_amount: number;
  currency: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string | null;
  payment_status: "PENDING" | "SUCCESS" | "FAILED";
  booking_status: "PENDING" | "CONFIRMED" | "CANCELLED";
  created_at: string;
  updated_at: string;
}

export interface CreateEventOrderPayload {
  eventId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  ticketQuantity?: number;
}

export interface CreateEventOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  pricing: EventPricingBreakdown;
  event: {
    id: string;
    title: string;
    subtitle: string;
    schedule: {
      date: string;
      time: string;
      venue: string;
    };
  };
  booking?: EventBooking;
}

export interface VerifyEventPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyEventPaymentResponse {
  success: boolean;
  message?: string;
  booking: EventBooking;
}

export interface EventBookingStatusResponse {
  isBooked: boolean;
  totalTickets?: number;
  booking?: EventBooking | null;
  bookings?: EventBooking[];
}

/**
 * Fetch all available events
 */
export async function listEvents() {
  return api<{ events: StaticEvent[] }>("/api/events");
}

/**
 * Fetch a single event by ID
 */
export async function getEvent(eventId: string) {
  return api<{ event: StaticEvent }>(`/api/events/${eventId}`);
}

/**
 * Create a Razorpay order on backend for an event booking
 */
export async function createEventOrder(payload: CreateEventOrderPayload) {
  return api<CreateEventOrderResponse>("/api/events/bookings/create-order", {
    method: "POST",
    body: payload,
  });
}

/**
 * Verify Razorpay payment signature on backend
 */
export async function verifyEventPayment(payload: VerifyEventPaymentPayload) {
  return api<VerifyEventPaymentResponse>("/api/events/bookings/verify-payment", {
    method: "POST",
    body: payload,
  });
}

/**
 * List booked events for authenticated user
 */
export async function getMyEventBookings() {
  return api<{ bookings: EventBooking[] }>("/api/events/bookings");
}

/**
 * Check if the authenticated user has already booked a specific event
 */
export async function getEventBookingStatus(eventId: string) {
  return api<EventBookingStatusResponse>(`/api/events/bookings/status/${eventId}`);
}

/**
 * Get single event booking by ID
 */
export async function getEventBooking(id: string) {
  return api<{ booking: EventBooking }>(`/api/events/bookings/${id}`);
}

