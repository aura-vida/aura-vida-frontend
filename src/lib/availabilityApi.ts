import { api } from "./api";

export interface RecurringSlot {
  start_time: string;
  end_time: string;
  duration_min?: number;
}

export interface DayScheduleUpdate {
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  slots: RecurringSlot[];
}

export interface AvailabilitySlotRow {
  id: string;
  practitioner_slug: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_min: number;
  is_active: boolean;
}

export async function getPractitionerSchedule(slug: string) {
  return api<{ schedule: AvailabilitySlotRow[] }>(`/api/practitioners/${slug}/availability`);
}

export async function updateMySchedule(schedule_updates: DayScheduleUpdate[]) {
  return api<{ message: string; schedule: AvailabilitySlotRow[] }>("/api/practitioners/me/availability", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: { schedule_updates },
  });
}

export interface AvailabilityException {
  id: string;
  practitioner_slug: string;
  exception_date: string;   // "YYYY-MM-DD"
  start_time: string;       // "HH:MM"
  end_time: string;         // "HH:MM"
  type: string;             // "leave" | "special"
  reason?: string | null;
}

export interface CreateExceptionPayload {
  exception_date: string;
  start_time: string;
  end_time: string;
  type: "leave" | "special";
  reason?: string;
}

/** AV-007: Get all time-off / exceptions for the current practitioner */
export async function getMyTimeOff() {
  return api<{ timeOff: AvailabilityException[] }>("/api/practitioners/time-off");
}

/** AV-004: Block a date/time window for a practitioner */
export async function createException(slug: string, payload: CreateExceptionPayload) {
  return api<{ message: string; exception: AvailabilityException }>(
    `/api/practitioners/${slug}/availability/exceptions`,
    { method: "POST", body: payload }
  );
}

/** AV-005: Remove a previously blocked window */
export async function deleteException(slug: string, exceptionId: string) {
  return api<{ message: string }>(
    `/api/practitioners/${slug}/availability/exceptions/${exceptionId}`,
    { method: "DELETE" }
  );
}
