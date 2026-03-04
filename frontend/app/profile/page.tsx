// Profile & integrations page — connected accounts, user info
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-text-primary">Profile & Integrations</h1>

        {/* Connected Accounts */}
        <div className="rounded-2xl border border-border/30 bg-bg-surface/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Connected Accounts</h2>
          <div className="space-y-4">
            {[
              { name: "GitHub", username: "K007-K", connected: true, icon: "🌐" },
              { name: "LeetCode", username: "", connected: false, icon: "💻" },
            ].map((acc) => (
              <div key={acc.name} className="flex items-center justify-between rounded-xl bg-bg-base/50 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{acc.icon}</span>
                  <div>
                    <div className="font-medium text-text-primary">{acc.name}</div>
                    <div className="text-xs text-text-muted">{acc.connected ? acc.username : "Not connected"}</div>
                  </div>
                </div>
                <button className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  acc.connected
                    ? "border border-score-high/30 text-score-high"
                    : "bg-accent-indigo/10 text-accent-indigo hover:bg-accent-indigo/20"
                }`}>
                  {acc.connected ? "✓ Connected" : "Connect"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resume */}
        <div className="rounded-2xl border border-border/30 bg-bg-surface/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Resume</h2>
          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-bg-base/50 p-8">
            <div className="text-center">
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm text-text-muted">Upload or drag your resume PDF</p>
              <input type="file" accept=".pdf" className="mt-3 text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-indigo/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-indigo" />
            </div>
          </div>
        </div>

        {/* Target Companies */}
        <div className="rounded-2xl border border-border/30 bg-bg-surface/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Target Companies</h2>
          <div className="flex flex-wrap gap-2">
            {["Google", "Amazon", "Razorpay"].map((c) => (
              <span key={c} className="rounded-lg bg-accent-indigo/10 border border-accent-indigo/30 px-3 py-1.5 text-sm text-accent-indigo">{c}</span>
            ))}
            <button className="rounded-lg border border-dashed border-border/50 px-3 py-1.5 text-sm text-text-muted hover:border-accent-indigo/30 hover:text-accent-indigo transition-colors">+ Add</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
