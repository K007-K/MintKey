// Skills page — clean light mode
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { GitBranch } from "lucide-react";

const CATEGORIES = [
  { name: "Languages", skills: ["Python", "Java", "TypeScript", "Go", "C++"], count: 8 },
  { name: "Frontend", skills: ["React", "Next.js", "Tailwind", "HTML", "CSS"], count: 6 },
  { name: "Backend", skills: ["FastAPI", "Node.js", "REST API", "GraphQL"], count: 5 },
  { name: "DSA", skills: ["Arrays", "DP", "Trees", "Graphs", "BFS/DFS"], count: 12 },
  { name: "Database", skills: ["PostgreSQL", "Redis", "MongoDB", "SQL"], count: 5 },
  { name: "DevOps", skills: ["Docker", "AWS", "CI/CD", "Git"], count: 4 },
];

export default function SkillsPage() {
  return (
    <DashboardLayout title="Skill Graph" subtitle="200+ skills tracked with prerequisite dependencies.">
      <div className="space-y-6">
        <div className="flex items-center justify-center rounded-xl border border-border-default bg-bg-card p-16">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-bg">
              <GitBranch className="h-7 w-7 text-mint-dark" strokeWidth={1.8} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Interactive Skill Graph</h3>
            <p className="mt-1 max-w-sm text-sm text-text-muted">
              D3.js force-directed visualization coming soon. Explore skill dependencies and learning paths.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className="rounded-xl border border-border-default bg-bg-card p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-1">{cat.name}</h3>
              <p className="text-xs text-text-muted mb-3">{cat.count} skills tracked</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.skills.map((s) => (
                  <span key={s} className="rounded-md bg-bg-hover px-2 py-1 text-xs text-text-secondary">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
