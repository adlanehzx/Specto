"use client";

import { useState } from "react";
import { Calendar, Clock, Repeat, X, Play, Pause } from "lucide-react";

interface ScheduleTestModalProps {
  testId: string;
  testName: string;
  currentSchedule?: {
    isScheduled: boolean;
    frequency: string | null;
    nextRunAt: string | null;
    isActive: boolean;
  };
  onClose: () => void;
  onSchedule: (data: ScheduleData) => Promise<void>;
  onUnschedule?: () => Promise<void>;
}

export interface ScheduleData {
  frequency?: "hourly" | "daily" | "weekly" | "monthly" | null;
  nextRunAt?: string;
}

export default function ScheduleTestModal({
  testId,
  testName,
  currentSchedule,
  onClose,
  onSchedule,
  onUnschedule,
}: ScheduleTestModalProps) {
  const [scheduleType, setScheduleType] = useState<"recurring" | "one-time">(
    currentSchedule?.frequency ? "recurring" : "one-time"
  );
  const [frequency, setFrequency] = useState<
    "hourly" | "daily" | "weekly" | "monthly"
  >((currentSchedule?.frequency as any) || "daily");
  const [oneTimeDate, setOneTimeDate] = useState<string>("");
  const [oneTimeTime, setOneTimeTime] = useState<string>("12:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data: ScheduleData = {};

      if (scheduleType === "recurring") {
        data.frequency = frequency;
      } else {
        if (!oneTimeDate || !oneTimeTime) {
          setError("Please select a date and time");
          setLoading(false);
          return;
        }
        // Créer une date locale et la convertir en ISO UTC
        const localDateTime = new Date(`${oneTimeDate}T${oneTimeTime}:00`);
        data.nextRunAt = localDateTime.toISOString();
        data.frequency = null;
      }

      await onSchedule(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule test");
    } finally {
      setLoading(false);
    }
  };

  const handleUnschedule = async () => {
    if (!onUnschedule) return;
    setLoading(true);
    setError(null);

    try {
      await onUnschedule();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to unschedule test"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Schedule Test
            </h2>
            <p className="text-sm text-gray-600 mt-1">{testName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Schedule Info */}
        {currentSchedule?.isScheduled && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    currentSchedule.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {currentSchedule.isActive ? (
                    <>
                      <Play className="w-3 h-3 inline mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 inline mr-1" />
                      Paused
                    </>
                  )}
                </div>
                <span className="text-sm text-gray-700">
                  {currentSchedule.frequency || "One-time"}
                </span>
              </div>
            </div>
            {currentSchedule.nextRunAt && (
              <p className="text-xs text-gray-600 mt-2">
                Next run: {new Date(currentSchedule.nextRunAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Schedule Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScheduleType("recurring")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  scheduleType === "recurring"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Repeat className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                <div className="text-sm font-medium">Recurring</div>
                <div className="text-xs text-gray-500 mt-1">
                  Run periodically
                </div>
              </button>
              <button
                type="button"
                onClick={() => setScheduleType("one-time")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  scheduleType === "one-time"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                <div className="text-sm font-medium">One-time</div>
                <div className="text-xs text-gray-500 mt-1">Run once</div>
              </button>
            </div>
          </div>

          {/* Recurring Options */}
          {scheduleType === "recurring" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Frequency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "hourly", label: "Hourly", desc: "Every hour" },
                  { value: "daily", label: "Daily", desc: "Every day" },
                  { value: "weekly", label: "Weekly", desc: "Every week" },
                  { value: "monthly", label: "Monthly", desc: "Every month" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFrequency(option.value as any)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      frequency === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {option.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* One-time Options */}
          {scheduleType === "one-time" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={oneTimeDate}
                  onChange={(e) => setOneTimeDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time
                </label>
                <input
                  type="time"
                  value={oneTimeTime}
                  onChange={(e) => setOneTimeTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {currentSchedule?.isScheduled && onUnschedule && (
              <button
                type="button"
                onClick={handleUnschedule}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Remove Schedule
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
