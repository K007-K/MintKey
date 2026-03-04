// Main dashboard — matches MintKey reference design exactly
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { Code2, GitBranch, Flame, GraduationCap, Plus, ChevronRight, AlertTriangle, CheckSquare, Clock } from "lucide-react";

const TREND_DATA = [
  { week: "Week 1", score: 58 },
  { week: "Week 2", score: 62 },
  { week: "Week 3", score: 65 },
  { week: "Week 4", score: 68 },
  { week: "Week 5", score: 72 },
  { week: "Week 6", score: 75 },
  { week: "Week 7", score: 82 },
  { week: "Week 8", score: 87 },
];

const COMPANY_MATCHES = [
  { name: "Google", score: 92, color: "#4285F4", letter: "G" },
  { name: "Meta", score: 85, color: "#1877F2", letter: "M" },
  { name: "Airbnb", score: 78, color: "#FF5A5F", letter: "A" },
  { name: "Stripe", score: 64, color: "#635BFF", letter: "S" },
];

const PRIORITY_ACTIONS = [
  { title: 'Complete "System Design: Scalability" module', desc: "High impact on your Google readiness score", time: "~45m", icon: "green" },
  { title: "Solve 2 Dynamic Programming problems", desc: "Maintain your 48-day streak", time: "~60m", icon: "blue" },
  { title: "Review PR comments on GitHub project", desc: "Improve code quality metrics", time: "~15m", icon: "mint" },
];

const RECENT_ACTIVITY = [
  { activity: "Merge k Sorted Lists", platform: "LeetCode (Hard)", result: "Solved", resultColor: "text-green bg-green-light", date: "2 hours ago", icon: Code2 },
  { activity: "Mock Interview: System Design", platform: "Pramp", result: "Feedback Pending", resultColor: "text-orange bg-orange-light", date: "Yesterday", icon: GitBranch },
  { activity: "Commit to 'mintkey-core'", platform: "GitHub", result: "Merged", resultColor: "text-blue bg-blue-light", date: "2 days ago", icon: GitBranch },
];

const CRITICAL_GAPS = [
  { title: "System Design Depth", desc: "Your design docs lack discussion on trade-offs. This is critical for L5+ roles." },
  { title: "Graph Algorithms", desc: "Success rate on Hard graph problems is 30% below target." },
];

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Good morning, Karthik"
      subtitle="Let's get you ready for that Senior Engineer role."
    >
      <div className="space-y-6">
        {/* Stat Cards Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Code2}
            label="LeetCode Solved"
            value="342"
            badge="+12 this week"
            badgeColor="bg-green-light text-green-dark"
          />
          <StatCard
            icon={GitBranch}
            label="GitHub Depth"
            value="A+"
            badge="Top 5%"
            badgeColor="bg-blue-light text-blue-dark"
          />
          <StatCard
            icon={Flame}
            label="Coding Streak"
            value="48 Days"
            badge="Personal Best"
            badgeColor="bg-orange-light text-orange-dark"
          />
          <StatCard
            icon={GraduationCap}
            label="Readiness Grade"
            value="87%"
            badge="+4%"
            badgeColor="bg-green-light text-green-dark"
          />
        </div>

        {/* Middle Row: Chart + Company Match + Critical Gaps */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Readiness Trend Chart — 2 cols */}
          <div className="lg:col-span-2 rounded-xl border border-border-default bg-bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Readiness Trend</h2>
                <p className="text-xs text-text-muted">Your improvement over the last 8 weeks</p>
              </div>
              <select className="rounded-lg border border-border-default bg-bg-card px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-mint">
                <option>Last 8 Weeks</option>
                <option>Last 12 Weeks</option>
              </select>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 3, fill: '#14b8a6', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right column: Company Match + Critical Gaps */}
          <div className="space-y-6">
            {/* Company Match */}
            <div className="rounded-xl border border-border-default bg-bg-card p-5">
              <h2 className="mb-4 text-base font-semibold text-text-primary">Company Match</h2>
              <div className="space-y-3">
                {COMPANY_MATCHES.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.letter}
                    </div>
                    <span className="flex-1 text-sm font-medium text-text-primary">{c.name}</span>
                    <div className="w-24 h-1.5 rounded-full bg-bg-hover">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${c.score}%`, backgroundColor: c.color }} />
                    </div>
                    <span className="w-10 text-right text-sm font-semibold text-text-primary">{c.score}%</span>
                  </div>
                ))}
              </div>
              <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-default py-2 text-xs font-medium text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors">
                <Plus className="h-3.5 w-3.5" /> Add Target Company
              </button>
            </div>

            {/* Critical Gaps */}
            <div className="rounded-xl border border-border-default bg-bg-card p-5">
              <h2 className="mb-3 text-base font-semibold text-text-primary">Critical Gaps</h2>
              <div className="space-y-3">
                {CRITICAL_GAPS.map((g) => (
                  <div key={g.title} className="rounded-lg bg-red-light p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-red" strokeWidth={2} />
                      <span className="text-sm font-semibold text-red-dark">{g.title}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{g.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Priority Actions */}
        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-text-primary">Top Priority Actions</h2>
              <span className="rounded-full bg-mint-light px-2.5 py-0.5 text-[10px] font-semibold text-mint-darker">AI Generated</span>
            </div>
            <button className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors">View all</button>
          </div>
          <div className="space-y-3">
            {PRIORITY_ACTIONS.map((action) => (
              <div key={action.title} className="flex items-center gap-4 rounded-lg border border-border-light p-4 hover:bg-bg-hover transition-colors">
                <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-border-default" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{action.title}</div>
                  <div className="text-xs text-text-muted">{action.desc}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  {action.time}
                </div>
                <ChevronRight className="h-4 w-4 text-text-placeholder" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
            <button className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors">View full history</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Activity</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Platform</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Result</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ACTIVITY.map((item) => (
                <tr key={item.activity} className="border-b border-border-light last:border-0">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-hover">
                        <item.icon className="h-4 w-4 text-text-muted" strokeWidth={1.8} />
                      </div>
                      <span className="text-sm font-medium text-text-primary">{item.activity}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-text-secondary">{item.platform}</td>
                  <td className="py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.resultColor}`}>
                      {item.result}
                    </span>
                  </td>
                  <td className="py-4 text-right text-sm text-text-muted">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  badge,
  badgeColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-hover">
          <Icon className="h-[18px] w-[18px] text-text-muted" strokeWidth={1.8} />
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <div className="text-xs text-text-muted mb-0.5">{label}</div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
    </div>
  );
}
