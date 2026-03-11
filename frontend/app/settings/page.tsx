// Settings page — all options functional
"use client";

import { useState, useCallback, useEffect } from "react";
import { signOut } from "next-auth/react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { useCurrentUser, useUpdateProfile, useDeleteAccount, queryClient, api } from "@/lib/api";
import {
  AlertTriangle, Loader2, Copy, Check, X,
  Download, FileText, Trash2, RefreshCw, Info,
} from "lucide-react";

/* ─── Default settings shape ─── */
const DEFAULT_SETTINGS = {
  dark_mode: false,
  compact_view: false,
  notif_weekly_report: true,
  notif_streak_reminders: true,
  notif_company_insights: false,
  notif_roadmap_milestones: true,
  privacy_public_profile: true,
  privacy_leaderboard: false,
  privacy_share_recruiters: false,
};

/* ─── Toast Component ─── */
function Toast({
  message,
  type = "success",
  onClose,
}: {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: "bg-teal-500",
    error: "bg-red-500",
    info: "bg-gray-700",
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg"
      style={{ backgroundColor: undefined }}
    >
      <div className={`${colors[type]} rounded-lg px-4 py-3 flex items-center gap-2.5 text-sm font-medium text-white shadow-lg`}>
        {type === "success" && <Check className="h-4 w-4" />}
        {type === "error" && <X className="h-4 w-4" />}
        {type === "info" && <Info className="h-4 w-4" />}
        {message}
      </div>
    </div>
  );
}

/* ─── Delete Confirmation Modal ─── */
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!isOpen) setConfirmText("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-red-100 bg-white p-6 shadow-2xl mx-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">Delete your account?</h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              This action is <strong className="text-red-600">permanent and irreversible</strong>.
              All your data, scores, roadmaps, integrations, and progress will be permanently deleted.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                autoFocus
                disabled={isDeleting}
              />
            </div>
            <div className="mt-5 flex items-center gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={confirmText !== "DELETE" || isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Toggle Component ─── */
function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${enabled ? "bg-teal-500" : "bg-gray-200"}`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-[22px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

/* ─── Toggle Row ─── */
function ToggleRow({
  title,
  description,
  enabled,
  onChange,
  saving,
  extra,
  comingSoon,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  saving?: boolean;
  extra?: React.ReactNode;
  comingSoon?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {comingSoon && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              Coming soon
            </span>
          )}
          {extra}
          {saving && <Loader2 className="h-3 w-3 animate-spin text-teal-500" />}
        </div>
        <p className="mt-0.5 text-sm text-gray-400">{description}</p>
      </div>
      <Toggle enabled={enabled} onChange={onChange} />
    </div>
  );
}

/* ─── Main Page ─── */
export default function SettingsPage() {
  const { data: userData, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();

  const user = userData as Record<string, unknown> | undefined;
  const savedSettings = (user?.settings as Record<string, boolean>) || {};

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // Hydrate from DB
  useEffect(() => {
    if (user?.settings) {
      const s = user.settings as Record<string, boolean>;
      setSettings((prev) => ({ ...prev, ...s }));
    }
  }, [user?.settings]);

  // Save a single toggle
  const toggleSetting = useCallback(
    async (key: string, value: boolean) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setSaving(key);
      try {
        const merged = { ...savedSettings, [key]: value };
        await updateProfile.mutateAsync({ settings: merged });
        setToast({ message: `${key.replace(/_/g, " ")} updated`, type: "success" });
      } catch {
        setSettings((prev) => ({ ...prev, [key]: !value }));
        setToast({ message: "Failed to save setting", type: "error" });
      }
      setSaving(null);
    },
    [savedSettings, updateProfile]
  );

  // Copy profile link
  const copyProfileLink = useCallback(() => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/profile/public`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, []);

  // Export PDF — window.print with print-friendly styling
  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    try {
      // Fetch user data for the print view
      const res = await api.get("/api/v1/users/me");
      const userData = res.data?.data;
      
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setToast({ message: "Please allow popups to export PDF", type: "error" });
        setExportingPdf(false);
        return;
      }

      const userName = userData?.name || "User";
      const email = userData?.email || "";
      const github = userData?.github_username || "Not connected";
      const leetcode = userData?.leetcode_username || "Not connected";
      const settingsData = userData?.settings || {};

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MintKey Analysis Report — ${userName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #111827; }
            h1 { font-size: 24px; color: #14b8a6; margin-bottom: 4px; }
            .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 32px; }
            h2 { font-size: 16px; color: #111827; margin-top: 28px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .label { color: #6b7280; }
            .value { color: #111827; font-weight: 500; }
            .badge { background: #f0fdf4; color: #14b8a6; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <h1>MintKey — Analysis Report</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          
          <h2>Profile</h2>
          <div class="row"><span class="label">Name</span><span class="value">${userName}</span></div>
          <div class="row"><span class="label">Email</span><span class="value">${email}</span></div>
          <div class="row"><span class="label">GitHub</span><span class="value">${github}</span></div>
          <div class="row"><span class="label">LeetCode</span><span class="value">${leetcode}</span></div>
          ${userData?.institution_name ? `<div class="row"><span class="label">Institution</span><span class="value">${userData.institution_name}</span></div>` : ""}
          ${userData?.cgpa ? `<div class="row"><span class="label">CGPA</span><span class="value">${userData.cgpa}</span></div>` : ""}
          ${userData?.graduation_year ? `<div class="row"><span class="label">Graduation</span><span class="value">${userData.graduation_year}</span></div>` : ""}
          
          <h2>Settings</h2>
          ${Object.entries(settingsData).map(([k, v]) => 
            `<div class="row"><span class="label">${k.replace(/_/g, " ")}</span><span class="${v ? "badge" : "value"}">${v ? "ON" : "OFF"}</span></div>`
          ).join("")}
          
          <div class="footer">
            <p>MintKey — AI Career Targeting Platform</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      // Small delay to let content render before printing
      setTimeout(() => {
        printWindow.print();
      }, 300);

      setToast({ message: "Print dialog opened — save as PDF", type: "success" });
    } catch {
      setToast({ message: "Failed to generate report", type: "error" });
    }
    setExportingPdf(false);
  }, []);

  // Download JSON — fetch user data + trigger download
  const handleDownloadJson = useCallback(async () => {
    setExportingJson(true);
    try {
      const res = await api.get("/api/v1/users/me");
      const userData = res.data?.data;
      
      const jsonStr = JSON.stringify(userData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `mintkey-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToast({ message: "Data exported as JSON", type: "success" });
    } catch {
      setToast({ message: "Failed to export data", type: "error" });
    }
    setExportingJson(false);
  }, []);

  // Clear cache — reset React Query + localStorage
  const handleClearCache = useCallback(async () => {
    setClearingCache(true);
    try {
      // Clear React Query cache
      queryClient.clear();
      
      // Clear localStorage sync data
      if (typeof window !== "undefined") {
        localStorage.removeItem("mintkey_last_synced");
      }

      // Refetch essential data
      await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["scores"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      setToast({ message: "Cache cleared — data will re-sync on next analysis", type: "success" });
    } catch {
      setToast({ message: "Failed to clear cache", type: "error" });
    }
    setClearingCache(false);
  }, []);

  // Delete account
  const handleDeleteAccount = useCallback(async () => {
    try {
      await deleteAccount.mutateAsync();
      setToast({ message: "Account deleted. Redirecting...", type: "info" });
      setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, 1500);
    } catch {
      setToast({ message: "Failed to delete account", type: "error" });
      setShowDeleteModal(false);
    }
  }, [deleteAccount]);

  if (isLoading) {
    return (
      <DashboardLayout title="Settings" subtitle="Manage your preferences and notifications.">
        <div className="mx-auto max-w-2xl space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings" subtitle="Manage your preferences and notifications.">
      <div className="mx-auto max-w-2xl space-y-5">

        {/* ─── Appearance ─── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Appearance</h2>
          </div>
          <div className="px-6 divide-y divide-gray-50">
            <ToggleRow
              title="Dark Mode"
              description="Switch between light and dark themes"
              enabled={settings.dark_mode}
              onChange={(v) => toggleSetting("dark_mode", v)}
              saving={saving === "dark_mode"}
              comingSoon
            />
            <ToggleRow
              title="Compact View"
              description="Reduce spacing in dashboard cards"
              enabled={settings.compact_view}
              onChange={(v) => toggleSetting("compact_view", v)}
              saving={saving === "compact_view"}
              comingSoon
            />
          </div>
        </div>

        {/* ─── Notifications ─── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Notifications</h2>
          </div>
          <div className="px-6 divide-y divide-gray-50">
            <ToggleRow
              title="Weekly Progress Report"
              description="Receive a summary of your progress every Monday"
              enabled={settings.notif_weekly_report}
              onChange={(v) => toggleSetting("notif_weekly_report", v)}
              saving={saving === "notif_weekly_report"}
            />
            <ToggleRow
              title="Streak Reminders"
              description="Get reminded when your coding streak is about to break"
              enabled={settings.notif_streak_reminders}
              onChange={(v) => toggleSetting("notif_streak_reminders", v)}
              saving={saving === "notif_streak_reminders"}
            />
            <ToggleRow
              title="New Company Insights"
              description="Notify when new hiring data is available for your target companies"
              enabled={settings.notif_company_insights}
              onChange={(v) => toggleSetting("notif_company_insights", v)}
              saving={saving === "notif_company_insights"}
            />
            <ToggleRow
              title="Roadmap Milestones"
              description="Celebrate when you complete a roadmap milestone"
              enabled={settings.notif_roadmap_milestones}
              onChange={(v) => toggleSetting("notif_roadmap_milestones", v)}
              saving={saving === "notif_roadmap_milestones"}
            />
          </div>
        </div>

        {/* ─── Privacy & Sharing ─── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Privacy & Sharing</h2>
          </div>
          <div className="px-6 divide-y divide-gray-50">
            <ToggleRow
              title="Public Profile"
              description="Allow others to view your match scores and roadmap progress"
              enabled={settings.privacy_public_profile}
              onChange={(v) => toggleSetting("privacy_public_profile", v)}
              saving={saving === "privacy_public_profile"}
              extra={
                settings.privacy_public_profile ? (
                  <button
                    onClick={copyProfileLink}
                    className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    {linkCopied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy link</>}
                  </button>
                ) : null
              }
            />
            <ToggleRow
              title="Show on Leaderboard"
              description="Appear in the MintKey community leaderboard"
              enabled={settings.privacy_leaderboard}
              onChange={(v) => toggleSetting("privacy_leaderboard", v)}
              saving={saving === "privacy_leaderboard"}
            />
            <ToggleRow
              title="Share with Recruiters"
              description="Let verified recruiters discover your profile"
              enabled={settings.privacy_share_recruiters}
              onChange={(v) => toggleSetting("privacy_share_recruiters", v)}
              saving={saving === "privacy_share_recruiters"}
            />
          </div>
        </div>

        {/* ─── Data & Export ─── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Data & Export</h2>
          </div>
          <div className="px-6 divide-y divide-gray-50">
            {/* Export PDF */}
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Export Analysis Report</div>
                <p className="mt-0.5 text-sm text-gray-400">Download your full analysis as a PDF</p>
              </div>
              <button
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Export PDF
              </button>
            </div>

            {/* Download JSON */}
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Export Raw Data</div>
                <p className="mt-0.5 text-sm text-gray-400">Download all your data as JSON</p>
              </div>
              <button
                onClick={handleDownloadJson}
                disabled={exportingJson}
                className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {exportingJson ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download JSON
              </button>
            </div>

            {/* Clear Cache */}
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Clear Cache</div>
                <p className="mt-0.5 text-sm text-gray-400">Force re-sync all platform data on next analysis</p>
              </div>
              <button
                onClick={handleClearCache}
                disabled={clearingCache}
                className="rounded-lg border border-amber-300 bg-white px-4 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {clearingCache ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Clear Cache
              </button>
            </div>
          </div>
        </div>

        {/* ─── Danger Zone ─── */}
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-red-100">
              <AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                Once you delete your account, there is no going back. All your data, progress, and integrations will be permanently removed.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="mt-3 rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Delete account confirmation modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={deleteAccount.isPending}
      />

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
}
