// Market trends — clean light mode
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { TrendingUp, Flame, Rocket, AlertTriangle } from "lucide-react";

const SKILLS = [
  { skill: "LLM/AI", demand: 98, change: "+35%" },
  { skill: "Kubernetes", demand: 92, change: "+15%" },
  { skill: "Python", demand: 92, change: "+1%" },
  { skill: "TypeScript", demand: 90, change: "+5%" },
  { skill: "Go", demand: 88, change: "+12%" },
  { skill: "Docker", demand: 88, change: "+3%" },
  { skill: "System Design", demand: 95, change: "+8%" },
  { skill: "React", demand: 85, change: "+2%" },
  { skill: "Kafka", demand: 78, change: "+10%" },
  { skill: "Rust", demand: 72, change: "+22%" },
];

export default function TrendsPage() {
  return (
    <DashboardLayout title="Market Trends" subtitle="Real-time skill demand across your target companies.">
      <div className="max-w-4xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { Icon: Flame, label: "Hottest Skill", value: "LLM/AI", sub: "98% demand", color: "bg-red-light text-red-dark" },
            { Icon: Rocket, label: "Fastest Growing", value: "Rust", sub: "+22% YoY", color: "bg-orange-light text-orange-dark" },
            { Icon: AlertTriangle, label: "Your Gap", value: "3 skills", sub: "Missing trending", color: "bg-blue-light text-blue-dark" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border-default bg-bg-card p-5">
              <div className={`inline-flex rounded-lg p-2 ${s.color} mb-2`}>
                <s.Icon className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div className="text-lg font-bold text-text-primary">{s.value}</div>
              <div className="text-xs text-text-muted">{s.label} — {s.sub}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-5 text-base font-semibold">Trending Skills</h2>
          <div className="space-y-3">
            {SKILLS.map((s) => (
              <div key={s.skill} className="flex items-center gap-4">
                <div className="w-28 text-sm font-medium text-text-secondary truncate">{s.skill}</div>
                <div className="flex-1 h-2 rounded-full bg-bg-hover">
                  <div className="h-2 rounded-full bg-mint-dark transition-all" style={{ width: `${s.demand}%` }} />
                </div>
                <div className="w-10 text-right text-xs font-semibold text-text-primary">{s.demand}%</div>
                <div className="w-12 text-right text-xs font-medium text-green">{s.change}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
