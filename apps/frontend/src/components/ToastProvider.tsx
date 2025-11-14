/**
 * Toast Provider - Affiche les toasts pour les nouvelles notifications
 */

"use client";

import { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useNotificationsStore } from "@/stores/useNotifications";
import { useRouter } from "next/navigation";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const notifications = useNotificationsStore((state) => state.notifications);

  useEffect(() => {
    // Listen for new notifications (unread only)
    const latestNotification = notifications[0];

    if (latestNotification && !latestNotification.read) {
      const toastType = latestNotification.type;

      const content = (
        <div
          className="cursor-pointer"
          onClick={() => {
            if (latestNotification.link) {
              router.push(latestNotification.link);
            }
          }}
        >
          <div className="font-semibold">{latestNotification.title}</div>
          <div className="text-sm opacity-90">{latestNotification.message}</div>
        </div>
      );

      const options = {
        position: "top-right" as const,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      };

      // Call the appropriate toast method based on type
      switch (toastType) {
        case "success":
          toast.success(content, options);
          break;
        case "error":
          toast.error(content, options);
          break;
        case "warning":
          toast.warning(content, options);
          break;
        case "info":
        default:
          toast.info(content, options);
          break;
      }
    }
  }, [notifications, router]);

  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}
