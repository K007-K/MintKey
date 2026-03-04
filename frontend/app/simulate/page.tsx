// Career Simulator — clean light mode
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { Target, Clock, TrendingUp } from "lucide-react";

export default function SimulatePage() {
  return (
    <DashboardLayout title="Career Simulator" subtitle="Predict how your scores change based on effort.">
      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Simulation Parameters</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Target Company</label>
              <select className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-mint">
                {["Google", "Amazon", "Microsoft", "Flipkart", "Razorpay"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Time Frame</label>
              <select className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-mint">
                {["3 months", "6 months", "9 months", "12 months"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-text-muted">Hours / Day</label>
              <select className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-mint">
                {["2 hours", "4 hours", "6 hours", "8 hours"].map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="mt-4 rounded-lg bg-mint-dark px-4 py-2 text-sm font-semibold text-white hover:bg-mint-darker transition-colors">
            Run Simulation
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { Icon: Target, label: "Predicted Score", value: "78%", sub: "+26 from current" },
            { Icon: Clock, label: "Time to Ready", value: "14 weeks", sub: "at 4 hrs/day" },
            { Icon: TrendingUp, label: "Weekly Growth", value: "+3.5%", sub: "avg improvement" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border-default bg-bg-card p-5 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-mint-bg">
                <s.Icon className="h-5 w-5 text-mint-dark" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-text-primary">{s.value}</div>
              <div className="text-xs text-text-muted">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
