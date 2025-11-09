/**
 * Notifications Page
 */

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import NotificationsPanel from "@/components/NotificationsPanel";

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <NotificationsPanel />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
