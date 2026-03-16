// Toast notification container — renders fixed at bottom-right with optional sync interval dropdown
"use client";

import { useToastStore } from "@/lib/useToast";
import { usePreferencesStore, SYNC_INTERVAL_OPTIONS } from "@/lib/store";
import { X, CheckCircle2, AlertTriangle, Info, XCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

const ICON_MAP = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const COLOR_MAP = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-teal-200 bg-teal-50 text-teal-800",
} as const;

const ICON_COLOR_MAP = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-teal-500",
} as const;

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = ICON_MAP[toast.type];
        const isSyncToast =
          toast.message.toLowerCase().includes("sync") &&
          (toast.type === "success" || toast.type === "info");

        return (
          <div key={toast.id}>
            <div
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-300 ${COLOR_MAP[toast.type]}`}
            >
              <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${ICON_COLOR_MAP[toast.type]}`} />
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {isSyncToast && <SyncIntervalMini />}
          </div>
        );
      })}
    </div>
  );
}

/* Compact sync-interval dropdown that appears beneath sync-related toasts */
function SyncIntervalMini() {
  const { autoSyncInterval, setAutoSyncInterval } = usePreferencesStore();
  const [open, setOpen] = useState(false);
  const current = SYNC_INTERVAL_OPTIONS.find((o) => o.value === autoSyncInterval);

  return (
    <div className="mt-1.5 ml-7">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>
          Sync interval: <span className="font-semibold text-gray-700">{current?.label || "Off"}</span>
        </span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {SYNC_INTERVAL_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setAutoSyncInterval(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${
                opt.value === autoSyncInterval
                  ? "text-teal-600 font-semibold bg-teal-50/50"
                  : "text-gray-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
