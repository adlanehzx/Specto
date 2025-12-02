/**
 * Notifications Panel - Liste complète des notifications
 */

"use client";

import { useState } from "react";
import { useNotificationsStore } from "@/stores/useNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectsAPI } from "@/services/projects.api";
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { NotificationType } from "@/types/notification";

const iconMap: Record<NotificationType, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-blue-500" />,
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
};

const colorMap: Record<NotificationType, string> = {
  info: "bg-blue-50 border-blue-200",
  success: "bg-green-50 border-green-200",
  warning: "bg-yellow-50 border-yellow-200",
  error: "bg-red-50 border-red-200",
};

export default function NotificationsPanel() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { notifications, isLoading, unread, refresh } = useNotifications();
  const { markRead, markAllRead, removeNotification } = useNotificationsStore();
  const { user, token: authToken } = useAuth();

  // Si l'utilisateur n'est pas connecté, afficher un message utile
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">
            Vous devez être connecté
          </h2>
          <p className="text-gray-600 mb-4">
            Connectez-vous pour voir vos notifications en application.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Se connecter
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = notifications.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleMarkRead = async (id: string) => {
    try {
      if (authToken) {
        await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
          }/api/notifications/${id}/read`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
      }
      markRead(id);
      refresh();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      // still mark locally for UX
      markRead(id);
      refresh();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (authToken) {
        await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
          }/api/notifications/mark-all-read`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
      }
      markAllRead();
      refresh();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      // fallback local
      markAllRead();
      refresh();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (authToken) {
        await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
          }/api/notifications/${id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
      }
      removeNotification(id);
      refresh();
    } catch (err) {
      console.error("Failed to delete notification:", err);
      // fallback local
      removeNotification(id);
      refresh();
    }
  };

  const handleNotificationClick = (id: string, link?: string) => {
    handleMarkRead(id);
    if (link) {
      router.push(link);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && (
            <span className="px-2.5 py-0.5 bg-blue-600 text-white text-sm font-medium rounded-full">
              {unread}
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-all ${
                notification.read
                  ? "bg-white border-gray-200"
                  : `${colorMap[notification.type]} border-l-4`
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {iconMap[notification.type]}
                </div>

                {/* Content */}
                <div
                  className={`flex-1 ${
                    notification.link ? "cursor-pointer" : ""
                  }`}
                  onClick={() =>
                    handleNotificationClick(notification.id, notification.link)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`font-semibold ${
                        notification.read ? "text-gray-700" : "text-gray-900"
                      }`}
                    >
                      {notification.title}
                    </h3>
                    {notification.link && (
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  <p
                    className={`text-sm mt-1 ${
                      notification.read ? "text-gray-500" : "text-gray-700"
                    }`}
                  >
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* If this notification points to an accept-invite link, show Join button */}
                  {notification.link &&
                    notification.link.includes("/accept-invite") && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            // parse token (memberId) and projectId from link
                            const link = notification.link!;
                            const url = new URL(link, window.location.origin);
                            const memberId = url.searchParams.get("token");
                            const pathParts = url.pathname
                              .split("/")
                              .filter(Boolean);
                            const projectId =
                              pathParts.length >= 2 ? pathParts[1] : undefined;

                            if (!memberId) {
                              // fallback: navigate to link
                              router.push(link);
                              return;
                            }

                            if (!user || !authToken) {
                              // Not authenticated — redirect to accept-invite page which will handle login/accept flow
                              router.push(link);
                              return;
                            }

                            // Accept invitation via API
                            await ProjectsAPI.acceptInvitation(
                              memberId,
                              authToken
                            );

                            // Mark read locally and refresh
                            markRead(notification.id);
                            refresh();

                            // Navigate to project if we could parse it
                            if (projectId) {
                              router.push(`/projects/${projectId}`);
                            } else {
                              // fallback: go to projects list
                              router.push(`/projects`);
                            }
                          } catch (err) {
                            console.error("Failed to accept invitation:", err);
                            // On error, navigate to link as fallback
                            router.push(notification.link || "/projects");
                          }
                        }}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mr-2"
                      >
                        Rejoindre
                      </button>
                    )}
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(notification.id);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
