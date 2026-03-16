// Toast notification container — renders fixed at bottom-right
"use client";

import { useToastStore } from "@/lib/useToast";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

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
        return (
          <div
            key={toast.id}
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
        );
      })}
    </div>
  );
}
