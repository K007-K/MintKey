// Skill graph page — placeholder for D3.js force-directed visualization
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";

const SKILL_CATEGORIES = [
  { name: "Languages", count: 8, skills: ["Python", "Java", "TypeScript", "Go", "C++"], color: "from-accent-indigo/10 to-accent-violet/10" },
  { name: "Frontend", count: 6, skills: ["React", "Next.js", "Tailwind CSS", "HTML", "CSS"], color: "from-teal/10 to-sky/10" },
  { name: "Backend", count: 5, skills: ["FastAPI", "Node.js", "REST API", "GraphQL"], color: "from-amber-500/10 to-orange-500/10" },
  { name: "DSA", count: 12, skills: ["Arrays", "DP", "Trees", "Graphs", "BFS/DFS"], color: "from-rose-500/10 to-pink-500/10" },
  { name: "Database", count: 5, skills: ["PostgreSQL", "Redis", "MongoDB", "SQL"], color: "from-emerald-500/10 to-green-500/10" },
  { name: "DevOps", count: 4, skills: ["Docker", "AWS", "CI/CD", "Git"], color: "from-purple-500/10 to-fuchsia-500/10" },
];

export default function SkillsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Skill Graph</h1>
          <p className="mt-1 text-text-muted">200+ skills tracked with prerequisite dependencies.</p>
        </div>

        {/* Graph placeholder */}
        <div className="flex items-center justify-center rounded-2xl border border-border/30 bg-bg-surface/50 p-16">
          <div className="text-center">
            <div className="text-5xl mb-4">🧠</div>
            <h3 className="text-lg font-semibold text-text-primary">Interactive Skill Graph</h3>
            <p className="mt-1 text-sm text-text-muted max-w-sm">D3.js force-directed visualization coming soon. Explore skill dependencies and learning paths.</p>
          </div>
        </div>

        {/* Category cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SKILL_CATEGORIES.map((cat) => (
            <div key={cat.name} className={`rounded-2xl border border-border/30 bg-gradient-to-br ${cat.color} p-5`}>
              <h3 className="font-semibold text-text-primary mb-1">{cat.name}</h3>
              <p className="text-xs text-text-muted mb-3">{cat.count} skills tracked</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.skills.map((s) => (
                  <span key={s} className="rounded-md bg-bg-base/30 px-2 py-1 text-xs text-text-muted">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
