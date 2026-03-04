// Profile page — clean light mode
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { Github, Code2, FileText, Plus, CheckCircle2, Upload } from "lucide-react";

export default function ProfilePage() {
  return (
    <DashboardLayout title="Profile" subtitle="Manage your integrations and settings.">
      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Connected Accounts</h2>
          <div className="space-y-3">
            {[
              { Icon: Github, name: "GitHub", username: "K007-K", connected: true },
              { Icon: Code2, name: "LeetCode", username: "", connected: false },
            ].map((acc) => (
              <div key={acc.name} className="flex items-center justify-between rounded-lg border border-border-light p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-hover">
                    <acc.Icon className="h-4 w-4 text-text-muted" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{acc.name}</div>
                    <div className="text-xs text-text-muted">{acc.connected ? acc.username : "Not connected"}</div>
                  </div>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  acc.connected ? "bg-green-light text-green-dark" : "bg-bg-hover text-text-muted cursor-pointer hover:bg-mint-bg hover:text-mint-darker"
                }`}>
                  {acc.connected ? <><CheckCircle2 className="h-3 w-3" /> Connected</> : "Connect"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Resume</h2>
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border-default bg-bg-page p-8">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-bg-hover">
                <Upload className="h-5 w-5 text-text-muted" strokeWidth={1.8} />
              </div>
              <p className="text-sm font-medium text-text-primary">Upload your resume</p>
              <p className="mt-1 text-xs text-text-muted">PDF only, max 5MB</p>
              <input type="file" accept=".pdf" className="mt-3 text-xs text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-mint-bg file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-mint-darker hover:file:bg-mint-light" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Target Companies</h2>
          <div className="flex flex-wrap gap-2">
            {["Google", "Amazon", "Razorpay"].map((c) => (
              <span key={c} className="rounded-lg bg-mint-bg border border-mint/30 px-3 py-1.5 text-sm font-medium text-mint-darker">{c}</span>
            ))}
            <button className="flex items-center gap-1 rounded-lg border border-dashed border-border-default px-3 py-1.5 text-sm text-text-muted hover:border-mint/40 hover:text-mint-darker transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
