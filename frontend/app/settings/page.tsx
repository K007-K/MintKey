// Settings page — matches UX Pilot designs
"use client";

import { useState, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { useCurrentUser, useUpdateProfile } from "@/lib/api";
import {
  AlertTriangle, Download, FileText, Trash2, Loader2, Copy, Check,
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
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  saving?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{title}</span>
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

  const user = userData as Record<string, unknown> | undefined;
  const savedSettings = (user?.settings as Record<string, boolean>) || {};

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

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
      } catch {
        // revert on fail
        setSettings((prev) => ({ ...prev, [key]: !value }));
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
            />
            <ToggleRow
              title="Compact View"
              description="Reduce spacing in dashboard cards"
              enabled={settings.compact_view}
              onChange={(v) => toggleSetting("compact_view", v)}
              saving={saving === "compact_view"}
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
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Export Analysis Report</div>
                <p className="mt-0.5 text-sm text-gray-400">Download your full analysis as a PDF</p>
              </div>
              <button className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Export PDF
              </button>
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Export Raw Data</div>
                <p className="mt-0.5 text-sm text-gray-400">Download all your data as JSON</p>
              </div>
              <button className="rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Download JSON
              </button>
            </div>
            <div className="flex items-center justify-between py-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Clear Cache</div>
                <p className="mt-0.5 text-sm text-gray-400">Force re-sync all platform data on next analysis</p>
              </div>
              <button className="rounded-lg border border-amber-300 bg-white px-4 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors">
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
              <button className="mt-3 rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
