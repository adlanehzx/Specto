/**
 * Notification Types
 */

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationCreateInput {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}
