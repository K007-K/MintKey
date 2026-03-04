// Settings page — clean light mode
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { Bell, Moon, Shield, Trash2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardLayout title="Settings" subtitle="Manage your preferences.">
      <div className="max-w-2xl space-y-6">
        {[
          { Icon: Bell, title: "Notifications", desc: "Email notifications for weekly reports and streak reminders", enabled: true },
          { Icon: Moon, title: "Dark Mode", desc: "Switch between light and dark themes", enabled: false },
          { Icon: Shield, title: "Public Profile", desc: "Allow others to see your match scores and roadmap", enabled: true },
        ].map((s) => (
          <div key={s.title} className="flex items-center justify-between rounded-xl border border-border-default bg-bg-card p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-hover">
                <s.Icon className="h-5 w-5 text-text-muted" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{s.title}</div>
                <div className="text-xs text-text-muted">{s.desc}</div>
              </div>
            </div>
            <button className={`relative h-6 w-11 rounded-full transition-colors ${s.enabled ? "bg-mint-dark" : "bg-border-default"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${s.enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))}

        <div className="rounded-xl border border-red/20 bg-red-light p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-card">
              <Trash2 className="h-5 w-5 text-red" strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-red-dark">Delete Account</div>
              <div className="text-xs text-text-secondary">Permanently remove all your data and analysis history.</div>
            </div>
            <button className="rounded-lg border border-red/30 px-3 py-1.5 text-xs font-medium text-red hover:bg-red/10 transition-colors">Delete</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
