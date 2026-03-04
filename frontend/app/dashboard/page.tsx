// Main dashboard — matches MintKey UXPilot reference design exactly
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { Plus, AlertTriangle } from "lucide-react";

/* ─── Sample data (will be replaced with API calls later) ─── */

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
  { name: "Google", score: 92, color: "#16a34a" },
  { name: "Meta", score: 85, color: "#2563eb" },
  { name: "Airbnb", score: 78, color: "#1e293b" },
  { name: "Stripe", score: 64, color: "#1e293b" },
];

const PRIORITY_ACTIONS = [
  { title: 'Complete "System Design: Scalability" module', desc: "High impact on your Google readiness score", time: "~45m" },
  { title: "Solve 2 Dynamic Programming problems", desc: "Maintain your 48-day streak", time: "~60m" },
  { title: "Review PR comments on GitHub project", desc: "Improve code quality metrics", time: "~15m" },
];

const RECENT_ACTIVITY = [
  { activity: "Merge k Sorted Lists", platform: "LeetCode (Hard)", result: "Solved", resultStyle: "text-green-700 bg-green-100", date: "2 hours ago", iconType: "code" as const },
  { activity: "Mock Interview: System Design", platform: "Pramp", result: "Feedback Pending", resultStyle: "text-blue-700 bg-blue-100", date: "Yesterday", iconType: "video" as const },
  { activity: "Commit to 'mintkey-core'", platform: "GitHub", result: "Merged", resultStyle: "text-gray-700 bg-gray-100", date: "2 days ago", iconType: "git" as const },
];

const CRITICAL_GAPS = [
  { title: "System Design Depth", desc: "Your design docs lack discussion on trade-offs. This is critical for L5+ roles.", severity: "high" },
  { title: "Graph Algorithms", desc: "Success rate on Hard graph problems is 30% below target.", severity: "medium" },
];

export default function DashboardPage() {
  return (
    <DashboardLayout
      title="Good morning, Karthik"
      subtitle="Let's get you ready for that Senior Engineer role."
    >
      <div className="space-y-5">

        {/* ─── Row 1: Four Stat Cards ─── */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<CodeBracketsIcon />}
            label="LeetCode Solved"
            value="342"
            badge="+12 this week"
            badgeColor="bg-green-50 text-green-600"
          />
          <StatCard
            icon={<GitHubLogoIcon />}
            label="GitHub Depth"
            value="A+"
            badge="Top 5%"
            badgeColor="bg-teal-50 text-teal-600"
          />
          <StatCard
            icon={<FlameIcon />}
            label="Coding Streak"
            value="48 Days"
            badge="Personal Best"
            badgeColor="bg-gray-100 text-gray-600"
          />
          <StatCard
            icon={<MoonIcon />}
            label="Readiness Grade"
            value="87%"
            badge="+4%"
            badgeColor="bg-green-50 text-green-600"
          />
        </div>

        {/* ─── Row 2: Readiness Trend (2/3) + Company Match (1/3) ─── */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* Readiness Trend Chart */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Readiness Trend</h2>
                <p className="text-xs text-gray-400">Your improvement over the last 8 weeks</p>
              </div>
              <select className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-400">
                <option>Last 8 Weeks</option>
                <option>Last 12 Weeks</option>
              </select>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#1e293b" strokeWidth={2} fill="url(#trendFill)" dot={{ r: 2.5, fill: '#1e293b', strokeWidth: 0 }} activeDot={{ r: 4, fill: '#1e293b' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Company Match */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-gray-900">Company Match</h2>
            <div className="space-y-4">
              {COMPANY_MATCHES.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <CompanyLogo name={c.name} />
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{c.score}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${c.score}%`, backgroundColor: c.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-400 hover:bg-[#f9fafb] hover:text-gray-600 transition-colors">
              <Plus className="h-4 w-4" /> Add Target Company
            </button>
          </div>
        </div>

        {/* ─── Row 3: Top Priority Actions (2/3) + Critical Gaps (1/3) ─── */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* Top Priority Actions */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-900">Top Priority Actions</h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  AI Generated
                </span>
              </div>
              <button className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors">View all</button>
            </div>
            <div className="space-y-3">
              {PRIORITY_ACTIONS.map((action) => (
                <div key={action.title} className="flex items-center gap-4 rounded-lg border border-gray-100 p-3.5 hover:bg-[#f9fafb] transition-colors cursor-pointer">
                  {/* Empty checkbox */}
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-gray-300" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{action.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{action.desc}</div>
                  </div>
                  <span className="shrink-0 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-500 font-medium">{action.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Gaps */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-gray-900">Critical Gaps</h2>
            <div className="space-y-3">
              {CRITICAL_GAPS.map((g) => (
                <div
                  key={g.title}
                  className={`rounded-lg p-4 border ${
                    g.severity === "high"
                      ? "bg-[#fef2f2] border-[#fecaca]"
                      : "bg-[#fff7ed] border-[#fed7aa]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle
                      className={`h-4 w-4 ${g.severity === "high" ? "text-red-500" : "text-orange-500"}`}
                      strokeWidth={2.2}
                    />
                    <span className={`text-sm font-bold ${g.severity === "high" ? "text-red-700" : "text-orange-700"}`}>
                      {g.title}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${g.severity === "high" ? "text-red-600" : "text-orange-600"}`}>
                    {g.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Row 4: Recent Activity (full width) ─── */}
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
            <button className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors">View full history</button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Activity</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Platform</th>
                <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Result</th>
                <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ACTIVITY.map((item) => (
                <tr key={item.activity} className="border-b border-gray-50 last:border-0 hover:bg-[#f9fafb] transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                        <ActivityIcon type={item.iconType} />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{item.activity}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1.5">
                      <PlatformIcon type={item.iconType} />
                      <span className="text-sm text-gray-500">{item.platform}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold ${item.resultStyle}`}>
                      {item.result}
                    </span>
                  </td>
                  <td className="py-4 text-right text-sm text-gray-400">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </DashboardLayout>
  );
}

/* ─── Stat Card Component ─── */

function StatCard({
  icon,
  label,
  value,
  badge,
  badgeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
}) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
          {icon}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeColor}`}>
          {badge}
        </span>
      </div>
      <div className="text-[11px] text-[#6b7280] mb-0.5">{label}</div>
      <div className="text-[28px] font-bold leading-tight text-gray-900">{value}</div>
    </div>
  );
}

/* ─── Icon Components ─── */

function CodeBracketsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function GitHubLogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#334155">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 23c-4.97 0-9-3.582-9-8 0-3.188 2.063-5.5 4-7.5.453-.469 1.25.06 1.125.688C7.75 10 8.938 11.5 10 11.5c1.688 0 1.312-3 .75-5-.25-.875.688-1.5 1.375-.938C14.625 7.5 17 10.5 17 13c0 .5-.063 1-.188 1.5-.125.5.438.938.875.563C18.563 14.312 19 13.188 19 12c0-.313-.031-.625-.094-.938-.093-.5.407-.874.844-.562C21.156 11.5 22 13.5 22 15.5c0 4.142-4.03 7.5-10 7.5z" fill="#f97316" />
      <path d="M12 23c-2.21 0-4-1.343-4-3 0-1.4 1.188-2.5 2-3.5.188-.219.563-.031.5.25-.125.625.375 1.25 1 1.25.5 0 .75-.5.625-1.25-.063-.375.313-.625.563-.375.75.75 1.312 1.75 1.312 2.625 0 2.209-1.79 4-2 4z" fill="#fbbf24" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function CompanyLogo({ name }: { name: string }) {
  const base = "flex h-7 w-7 items-center justify-center rounded-full";
  switch (name) {
    case "Google":
      return (
        <div className={`${base} bg-gray-50`}>
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </div>
      );
    case "Meta":
      return (
        <div className={`${base} bg-blue-50`}>
          <svg width="16" height="11" viewBox="0 0 32 22" fill="#1877F2">
            <path d="M16 11c0-3.3 1.6-6.5 4-8.5C22.4.5 25.6 0 28 0c2.4 0 4 2.3 4 5.5 0 6.35-5.37 16.5-12 16.5-2.4 0-4-1.15-4-5.5V11zm-8 5.5C8 20.85 5.6 22 3.2 22-2.63 22-4 11.85-4 5.5-4 2.3-2.4 0 0 0c2.4 0 5.6.5 8 2.5 2.4 2 4 5.2 4 8.5v5.5z" transform="translate(4, 0)"/>
          </svg>
        </div>
      );
    case "Airbnb":
      return (
        <div className={`${base} bg-red-50`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF5A5F">
            <path d="M12 0C8 4.5 5 8 5 11.5 5 15.09 8.13 18 12 18s7-2.91 7-6.5C19 8 16 4.5 12 0zm0 16c-2.21 0-4-2.02-4-4.5S9.79 5 12 5s4 4.02 4 6.5S14.21 16 12 16z"/>
          </svg>
        </div>
      );
    case "Stripe":
      return (
        <div className={`${base} bg-indigo-50`}>
          <span className="text-[8px] font-extrabold text-indigo-600 tracking-tight leading-none">stripe</span>
        </div>
      );
    default:
      return <div className={`${base} bg-gray-100 text-xs font-bold text-gray-500`}>{name[0]}</div>;
  }
}

function ActivityIcon({ type }: { type: "code" | "video" | "git" }) {
  switch (type) {
    case "code":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "video":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="14" height="14" rx="2" />
          <path d="M16 10l6-3v10l-6-3" />
        </svg>
      );
    case "git":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      );
  }
}

function PlatformIcon({ type }: { type: "code" | "video" | "git" }) {
  switch (type) {
    case "code":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "video":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="14" height="14" rx="2" />
          <path d="M16 10l6-3v10l-6-3" />
        </svg>
      );
    case "git":
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#94a3b8">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      );
  }
}
