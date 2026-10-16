import { api } from "@/lib/api";

export interface SpaceImage {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface PackedSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
  notify_owner?: boolean;
  created_at: string;
  notified_email?: string | null;
}

export interface SpaceSchedule {
  summary: string;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  open_time: string; // HH:mm
  close_time: string; // HH:mm
  available_from?: string | null;
  available_to?: string | null;
  packed_slots?: PackedSlot[];
  legacy_text?: string;
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const formatTime12h = (timeStr?: string) => {
  if (!timeStr) return "";
  const [hRaw, mRaw] = timeStr.slice(0, 5).split(":").map(Number);
  const hour = hRaw || 0;
  const min = String(mRaw || 0).padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${min} ${ampm}`;
};

export const formatDaysLabel = (days: number[] = []) => {
  if (!Array.isArray(days) || days.length === 0) return "Closed";
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return "Everyday";
  if (sorted.length === 6 && !sorted.includes(0)) return "Mon – Sat";
  if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) return "Mon – Fri";
  if (sorted.length === 2 && sorted.includes(0) && sorted.includes(6)) return "Weekends only";
  return sorted.map((d) => DAY_NAMES[d] || String(d)).join(", ");
};

export const formatSpaceScheduleSummary = (sched: Partial<SpaceSchedule>) => {
  const daysLabel = formatDaysLabel(sched.days || [1, 2, 3, 4, 5, 6]);
  const open = formatTime12h(sched.open_time || "09:00");
  const close = formatTime12h(sched.close_time || "19:00");
  let summary = `${daysLabel} · ${open} – ${close}`;

  if (sched.available_from && sched.available_to) {
    summary += ` (${sched.available_from} to ${sched.available_to})`;
  } else if (sched.available_from) {
    summary += ` (From ${sched.available_from})`;
  } else if (sched.available_to) {
    summary += ` (Until ${sched.available_to})`;
  }

  return summary;
};

export const parseSpaceSchedule = (raw?: string | null): SpaceSchedule => {
  const defaultSched: SpaceSchedule = {
    days: [1, 2, 3, 4, 5, 6],
    open_time: "09:00",
    close_time: "19:00",
    available_from: null,
    available_to: null,
    packed_slots: [],
    summary: "Mon – Sat · 09:00 AM – 07:00 PM",
  };

  if (!raw) return defaultSched;

  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      const merged: SpaceSchedule = {
        ...defaultSched,
        ...parsed,
        days: Array.isArray(parsed.days) && parsed.days.length > 0 ? parsed.days : defaultSched.days,
        open_time: parsed.open_time || defaultSched.open_time,
        close_time: parsed.close_time || defaultSched.close_time,
        packed_slots: Array.isArray(parsed.packed_slots) ? parsed.packed_slots : [],
      };
      merged.summary = parsed.summary || formatSpaceScheduleSummary(merged);
      return merged;
    } catch {
      // Fall through to plain text
    }
  }

  return {
    ...defaultSched,
    summary: trimmed,
    legacy_text: trimmed,
  };
};

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
  space_images?: SpaceImage[];
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

export async function submitSpace(
  data: Partial<Space>,
  files: File[] = []
): Promise<{ message: string; space: Space }> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, Array.isArray(value) ? value.join(",") : String(value));
  });
  files.forEach((file) => formData.append("images", file));

  return api<{ message: string; space: Space }>("/api/spaces", {
    method: "POST",
    body: formData,
  });
}

export async function getPublicSpaces(pin: string): Promise<{ spaces: Space[] }> {
  return api<{ spaces: Space[] }>(`/api/spaces?pin=${encodeURIComponent(pin)}`);
}

export async function adminUploadSpaceImages(
  spaceId: string,
  files: File[]
): Promise<{ message: string; images: SpaceImage[] }> {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return api<{ message: string; images: SpaceImage[] }>(`/api/admin/spaces/${spaceId}/images`, {
    method: "POST",
    body: formData,
  });
}

export async function adminDeleteSpaceImage(
  spaceId: string,
  imageId: string
): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/admin/spaces/${spaceId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function adminPackSpaceSlot(
  spaceId: string,
  data: {
    date: string;
    start_time: string;
    end_time: string;
    reason?: string;
    notify_owner?: boolean;
  }
): Promise<{ message: string; space: Space; packed_slot: PackedSlot }> {
  return api<{ message: string; space: Space; packed_slot: PackedSlot }>(
    `/api/admin/spaces/${spaceId}/pack-slot`,
    {
      method: "POST",
      body: data,
    }
  );
}

export async function adminReleaseSpaceSlot(
  spaceId: string,
  slotId: string
): Promise<{ message: string; space: Space }> {
  return api<{ message: string; space: Space }>(
    `/api/admin/spaces/${spaceId}/packed-slots/${slotId}`,
    {
      method: "DELETE",
    }
  );
}

