"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import UnifiedHistoryPage from "./UnifiedHistoryPage";

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <UnifiedHistoryPage />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
