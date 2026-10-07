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
