// DSA tracker page — problem count, topic breakdown, daily targets
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";

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

export default function DSAPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-text-primary">DSA Tracker</h1>

        {/* Stats row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Solved", value: "127", color: "text-accent-indigo" },
            { label: "Easy", value: "45", color: "text-score-high" },
            { label: "Medium", value: "62", color: "text-score-mid" },
            { label: "Hard", value: "20", color: "text-score-low" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/30 bg-bg-surface/50 p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Topic breakdown */}
        <div className="rounded-2xl border border-border/30 bg-bg-surface/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Topic Progress</h2>
          <div className="space-y-4">
            {TOPICS.map((t) => (
              <div key={t.name} className="flex items-center gap-4">
                <div className="w-36 text-sm text-text-muted truncate">{t.name}</div>
                <div className="flex-1 h-3 rounded-full bg-bg-elevated/50">
                  <div
                    className={`h-3 rounded-full transition-all ${t.pct >= 70 ? "bg-score-high" : t.pct >= 40 ? "bg-score-mid" : "bg-score-low"}`}
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
                <div className="w-20 text-right text-xs text-text-muted">{t.solved}/{t.target}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
