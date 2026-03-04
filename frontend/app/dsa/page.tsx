// DSA tracker — clean light mode with progress bars
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { Code2, CheckCircle2, AlertCircle, Zap } from "lucide-react";

const TOPICS = [
  { name: "Arrays", solved: 35, target: 50, pct: 70 },
  { name: "Dynamic Programming", solved: 12, target: 40, pct: 30 },
  { name: "Trees", solved: 18, target: 30, pct: 60 },
  { name: "Graphs", solved: 8, target: 25, pct: 32 },
  { name: "Strings", solved: 22, target: 30, pct: 73 },
  { name: "Linked Lists", solved: 10, target: 15, pct: 67 },
  { name: "Binary Search", solved: 14, target: 20, pct: 70 },
  { name: "Stack/Queue", solved: 8, target: 15, pct: 53 },
];

function barColor(pct: number) {
  if (pct >= 70) return "#22c55e";
  if (pct >= 40) return "#f97316";
  return "#ef4444";
}

export default function DSAPage() {
  return (
    <DashboardLayout title="DSA Tracker" subtitle="Track your problem-solving progress by topic.">
      <div className="max-w-4xl space-y-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: Code2, label: "Total Solved", value: "127", color: "bg-mint-bg text-mint-darker" },
            { Icon: CheckCircle2, label: "Easy", value: "45", color: "bg-green-light text-green-dark" },
            { Icon: Zap, label: "Medium", value: "62", color: "bg-orange-light text-orange-dark" },
            { Icon: AlertCircle, label: "Hard", value: "20", color: "bg-red-light text-red-dark" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border-default bg-bg-card p-4">
              <div className={`inline-flex rounded-lg p-2 ${s.color} mb-2`}>
                <s.Icon className="h-4 w-4" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-text-primary">{s.value}</div>
              <div className="text-xs text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-5 text-base font-semibold">Topic Progress</h2>
          <div className="space-y-4">
            {TOPICS.map((t) => (
              <div key={t.name} className="flex items-center gap-4">
                <div className="w-36 text-sm font-medium text-text-secondary truncate">{t.name}</div>
                <div className="flex-1 h-2 rounded-full bg-bg-hover">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${t.pct}%`, backgroundColor: barColor(t.pct) }} />
                </div>
                <div className="w-16 text-right text-xs text-text-muted">{t.solved}/{t.target}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
