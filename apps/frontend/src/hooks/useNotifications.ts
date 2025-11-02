/**
 * Hook SWR pour récupérer les notifications depuis l'API
 */

import useSWR from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { Notification } from "@/types/notification";
import { useNotificationsStore } from "@/stores/useNotifications";
import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unread: number;
}

const fetcher = async (url: string, token: string | null) => {
  if (!token) throw new Error("No token");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // try to read body for error details
    let errText = "";
    try {
      const body = await response.json();
      errText = JSON.stringify(body);
    } catch {
      try {
        errText = await response.text();
      } catch {}
    }
    throw new Error(
      `Failed to fetch notifications: ${response.status} ${response.statusText} ${errText}`
    );
  }

  const body = await response.json();
  // Backend returns { success: true, data: { notifications, ... } }
  // normalize to return the inner data shape when present
  return body.data || body;
};

export function useNotifications() {
  const { user, token } = useAuth();
  const setNotifications = useNotificationsStore(
    (state) => state.setNotifications
  );

  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    user && token ? `${API_URL}/api/notifications?userId=${user.id}` : null,
    (url) => fetcher(url, token),
    {
      refreshInterval: 30000, // Refresh every 30s
      revalidateOnFocus: true,
    }
  );

  // Sync with Zustand store
  useEffect(() => {
    if (data?.notifications) {
      setNotifications(data.notifications);
    }
  }, [data, setNotifications]);

  return {
    notifications: data?.notifications || [],
    total: data?.total || 0,
    unread: data?.unread || 0,
    isLoading,
    error,
    refresh: mutate,
  };
}
