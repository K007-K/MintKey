// Roadmap page — clean light mode timeline
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { CheckCircle2, Circle, Clock, BookOpen, Code2, Target } from "lucide-react";

const WEEKS = [
  { week: 1, theme: "Foundation & Basics", tasks: 6, dsa: 10, milestone: "Complete prerequisite skills", done: true },
  { week: 2, theme: "Core Data Structures", tasks: 8, dsa: 15, milestone: "Arrays, Strings, HashMap mastery", done: true },
  { week: 3, theme: "Trees & Graphs", tasks: 7, dsa: 12, milestone: "BFS/DFS fluency", done: false },
  { week: 4, theme: "Dynamic Programming", tasks: 6, dsa: 15, milestone: "Solve 15 medium DP problems", done: false },
  { week: 5, theme: "System Design Intro", tasks: 5, dsa: 8, milestone: "Design URL Shortener", done: false },
  { week: 6, theme: "Advanced DP & Graphs", tasks: 7, dsa: 12, milestone: "Hard DP problems", done: false },
  { week: 7, theme: "Mock Interviews", tasks: 4, dsa: 10, milestone: "2 peer mock interviews", done: false },
  { week: 8, theme: "Final Review & Polish", tasks: 5, dsa: 8, milestone: "Full revision cycle", done: false },
];

export default function RoadmapPage() {
  return (
    <DashboardLayout title="My Roadmap" subtitle="Week-by-week preparation plan tailored to your targets.">
      <div className="max-w-3xl space-y-4">
        {WEEKS.map((w) => (
          <div key={w.week} className={`rounded-xl border bg-bg-card p-5 transition-all ${w.done ? "border-green/30" : "border-border-default hover:border-mint/30"}`}>
            <div className="flex items-start gap-4">
              <div className="mt-0.5">
                {w.done ? (
                  <CheckCircle2 className="h-5 w-5 text-green" strokeWidth={2} />
                ) : (
                  <Circle className="h-5 w-5 text-text-placeholder" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Week {w.week}: {w.theme}
                  </h3>
                  <span className={`text-xs font-medium ${w.done ? "text-green" : "text-text-muted"}`}>
                    {w.done ? "Completed" : "Upcoming"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {w.tasks} tasks</span>
                  <span className="flex items-center gap-1"><Code2 className="h-3 w-3" /> {w.dsa} problems</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                  <Target className="h-3 w-3 text-mint-dark" />
                  {w.milestone}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
