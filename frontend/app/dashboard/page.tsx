// Main dashboard page — score overview, quick actions, activity feed
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";

const MOCK_SCORES = [
  { company: "Google", score: 42, grade: "C", status: "Needs Preparation", change: +3 },
  { company: "Amazon", score: 55, grade: "C+", status: "Almost Ready", change: +7 },
  { company: "Flipkart", score: 48, grade: "C", status: "Needs Preparation", change: +5 },
  { company: "Razorpay", score: 61, grade: "B", status: "Almost Ready", change: +2 },
];

const MOCK_SKILLS = [
  { name: "React", level: 85, category: "frontend" },
  { name: "Python", level: 78, category: "languages" },
  { name: "Dynamic Programming", level: 35, category: "dsa" },
  { name: "System Design", level: 20, category: "system_design" },
  { name: "Node.js", level: 70, category: "backend" },
  { name: "SQL", level: 65, category: "database" },
];

function ScoreColor({ score }: { score: number }) {
  if (score >= 80) return <span className="text-score-high">{score}</span>;
  if (score >= 50) return <span className="text-score-mid">{score}</span>;
  return <span className="text-score-low">{score}</span>;
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back 👋</h1>
          <p className="mt-1 text-text-muted">
            Here&apos;s your career readiness overview.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Overall Readiness", value: "52%", icon: "🎯", color: "from-accent-indigo/10 to-accent-violet/10" },
            { label: "DSA Problems", value: "127", icon: "💻", color: "from-teal/10 to-sky/10" },
            { label: "Skills Tracked", value: "18", icon: "🧠", color: "from-amber-500/10 to-orange-500/10" },
            { label: "Days Active", value: "23", icon: "📅", color: "from-emerald-500/10 to-green-500/10" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border border-border/30 bg-gradient-to-br ${stat.color} p-5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <div className="mt-3 text-2xl font-bold text-text-primary">{stat.value}</div>
              <div className="text-sm text-text-muted">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Company Match Scores */}
        <div className="rounded-2xl border border-border/30 bg-bg-surface/50 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Company Match Scores</h2>
            <button className="rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary transition-colors">
              Run Analysis →
            </button>
          </div>
          <div className="space-y-4">
            {MOCK_SCORES.map((item) => (
              <div
                key={item.company}
                className="flex items-center justify-between rounded-xl bg-bg-base/50 p-4 transition-all hover:bg-bg-elevated/30"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-indigo/10 text-sm font-bold text-accent-indigo">
                    {item.grade}
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary">{item.company}</div>
                    <div className="text-xs text-text-muted">{item.status}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xl font-bold">
                      <ScoreColor score={item.score} />
                    </div>
                  </div>
                  <div className="text-xs text-score-high">+{item.change}%</div>
                  {/* Score bar */}
                  <div className="hidden w-32 sm:block">
                    <div className="h-2 rounded-full bg-bg-elevated/50">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          item.score >= 80 ? "bg-score-high" : item.score >= 50 ? "bg-score-mid" : "bg-score-low"
                        }`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column: Skills + Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Skills */}
          <div className="rounded-2xl border border-border/30 bg-bg-surface/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Your Skills</h2>
            <div className="space-y-3">
              {MOCK_SKILLS.map((skill) => (
                <div key={skill.name} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-text-muted truncate">{skill.name}</div>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-bg-elevated/50">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          skill.level >= 70 ? "bg-score-high" : skill.level >= 40 ? "bg-score-mid" : "bg-score-low"
                        }`}
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-10 text-right text-xs font-medium text-text-muted">{skill.level}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-border/30 bg-bg-surface/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { icon: "⚡", title: "Run Full Analysis", desc: "Analyze GitHub + LeetCode + Resume", action: "/dashboard" },
                { icon: "📄", title: "Upload Resume", desc: "Parse and extract skills from PDF", action: "/profile" },
                { icon: "🏢", title: "Add Target Company", desc: "Get company-specific roadmap", action: "/companies" },
                { icon: "🗺️", title: "View Roadmap", desc: "Week-by-week preparation plan", action: "/roadmap" },
              ].map((item) => (
                <button
                  key={item.title}
                  className="flex w-full items-center gap-4 rounded-xl bg-bg-base/50 p-4 text-left transition-all hover:bg-bg-elevated/30 hover:border-accent-indigo/20"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{item.title}</div>
                    <div className="text-xs text-text-muted">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Coach Preview */}
        <div className="rounded-2xl border border-accent-indigo/20 bg-gradient-to-r from-accent-indigo/5 to-accent-violet/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-indigo/20 text-xl">
              🤖
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">AI Coach says:</h3>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">
                &quot;Your React skills are strong but you&apos;re missing key DSA topics like Dynamic Programming and 
                Graphs. Focus on solving 5 medium DP problems this week — that alone could boost your Google 
                readiness by 8%.&quot;
              </p>
              <button className="mt-3 text-sm font-medium text-accent-indigo hover:text-accent-violet transition-colors">
                Open full coaching report →
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
