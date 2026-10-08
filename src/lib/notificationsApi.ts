import { api } from "@/lib/api";

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "notes" | "credit" | "system" | "review" | "practitioner" | "space" | "info" | string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export async function listNotifications(limit = 30): Promise<NotificationItem[]> {
  return api<NotificationItem[]>(`/api/notifications?limit=${limit}`);
}

export async function markNotificationAsRead(id: string): Promise<NotificationItem> {
  return api<NotificationItem>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; count: number }> {
  return api<{ success: boolean; count: number }>("/api/notifications/read-all", {
    method: "PATCH",
  });
}
