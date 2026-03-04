// Roadmap page — week-by-week preparation plan
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";

const WEEKS = [
  { week: 1, theme: "Foundation & Basics", tasks: 6, dsa: 10, milestone: "Complete prerequisite skills", done: true },
  { week: 2, theme: "Core Data Structures", tasks: 8, dsa: 15, milestone: "Arrays, Strings, HashMap mastery", done: true },
  { week: 3, theme: "Trees & Graphs", tasks: 7, dsa: 12, milestone: "BFS/DFS fluency", done: false },
  { week: 4, theme: "Dynamic Programming", tasks: 6, dsa: 15, milestone: "Solve 15 medium DP problems", done: false },
  { week: 5, theme: "System Design Intro", tasks: 5, dsa: 8, milestone: "Design URL Shortener", done: false },
  { week: 6, theme: "Advanced DP & Graphs", tasks: 7, dsa: 12, milestone: "Hard DP problems", done: false },
  { week: 7, theme: "Mock Interviews", tasks: 4, dsa: 10, milestone: "2 mock interviews", done: false },
  { week: 8, theme: "Final Review", tasks: 5, dsa: 8, milestone: "Full revision cycle", done: false },
];

export default function RoadmapPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Your Roadmap</h1>
          <p className="mt-1 text-text-muted">Week-by-week preparation plan tailored to your target companies.</p>
        </div>

        <div className="space-y-4">
          {WEEKS.map((w) => (
            <div
              key={w.week}
              className={`rounded-2xl border p-5 transition-all ${
                w.done
                  ? "border-score-high/30 bg-score-high/5"
                  : "border-border/30 bg-bg-surface/50 hover:border-accent-indigo/30"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                    w.done ? "bg-score-high/20 text-score-high" : "bg-accent-indigo/10 text-accent-indigo"
                  }`}>
                    {w.done ? "✓" : w.week}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Week {w.week}: {w.theme}</h3>
                    <p className="text-xs text-text-muted">{w.tasks} tasks • {w.dsa} DSA problems</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${w.done ? "text-score-high" : "text-text-muted"}`}>
                  {w.done ? "Completed" : "Pending"}
                </span>
              </div>
              <div className="ml-11 text-sm text-text-muted">
                🎯 Milestone: {w.milestone}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
