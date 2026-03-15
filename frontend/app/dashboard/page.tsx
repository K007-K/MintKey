// Main dashboard — wired to real scraped platform data
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { useDashboardSummary, useMatchScores, useCurrentUser } from "@/lib/api";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { Plus, AlertTriangle, ArrowUpRight, Sparkles, ExternalLink, X } from "lucide-react";
import Link from "next/link";

/* ─── Dashboard Page ─── */

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: dashboard, isLoading } = useDashboardSummary();
  const { data: matchScores, isLoading: scoresLoading } = useMatchScores();

  const { data: currentUser } = useCurrentUser();

  // P1 fix: use full_name from API, fall back to session name
  const rawName = (currentUser as Record<string, unknown>)?.name as string || session?.user?.name || "there";
  // Handle names like "K Karthik" — use the meaningful part
  const nameParts = rawName.split(" ").filter(Boolean);
  const userName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0] || "there";
  const greeting = getGreeting();

  // Extract data from dashboard summary
  const d = dashboard as Record<string, unknown> | undefined;
  const statCards = (d?.stat_cards as Record<string, Record<string, unknown>>) || {};
  const lc = statCards.leetcode || {};
  const gh = statCards.github || {};
  const streak = statCards.streak || {};
  const readiness = statCards.readiness || {};

  const recentActivity = (d?.recent_activity as Array<Record<string, string>>) || [];
  const criticalGaps = (d?.critical_gaps as Array<Record<string, string>>) || [];
  const priorityActions = (d?.priority_actions as Array<Record<string, string>>) || [];
  const trendData = (d?.trend_data as Array<Record<string, unknown>>) || null;

  // Match scores for company bars
  const scores = Array.isArray(matchScores) ? matchScores : [];
  const companyScores = (d?.company_scores as Array<Record<string, unknown>>) || [];
  const displayScores = scores.length > 0 ? scores : companyScores;

  // Chart: only show real trend data, no fake placeholder
  const chartData = trendData && trendData.length > 0 ? trendData : null;

  // Heatmap modal state
  const [showHeatmap, setShowHeatmap] = useState(false);

  return (
    <DashboardLayout
      title={`${greeting}, ${userName}`}
      subtitle="Let's get you ready for that dream role."
    >
      <div className="space-y-5">

        {/* ─── Row 1: Four Stat Cards ─── */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<CodeBracketsIcon />}
            label="LeetCode Solved"
            value={isLoading ? null : String((lc.total_solved as number) || 0)}
            badge={isLoading ? "" : (lc.badge as string) || "Not connected"}
            badgeColor={(lc.total_solved as number) > 0 ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}
            loading={isLoading}
          />
          <StatCard
            icon={<GitHubLogoIcon />}
            label="GitHub Depth"
            value={isLoading ? null : (gh.grade as string) || "—"}
            badge={isLoading ? "" : (gh.badge as string) || "Not connected"}
            badgeColor={(gh.grade as string) && (gh.grade as string) !== "—" ? "bg-teal-50 text-teal-600" : "bg-gray-100 text-gray-500"}
            subText={(gh.total_contributions as number) > 0 ? `${(gh.total_contributions as number).toLocaleString()} contributions` : undefined}
            loading={isLoading}
          />
          <StreakCard
            value={isLoading ? null : (streak.value as string) || "—"}
            badge={isLoading ? "" : (streak.badge as string) || "Start coding"}
            badgeColor={(streak.value as string) && (streak.value as string) !== "—" ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-600"}
            weekActivity={(streak.week_activity as boolean[]) || []}
            longestStreak={(streak.longest_streak as number) || 0}
            currentStreak={(streak.current_streak as number) || 0}
            yearlyHeatmap={(streak.yearly_heatmap as Record<string, { count: number; platforms: string[] }>) || {}}
            totalActiveDays={(streak.total_active_days as number) || 0}
            onOpenHeatmap={() => setShowHeatmap(true)}
            loading={isLoading}
          />
          <StatCard
            icon={<MoonIcon />}
            label="Readiness Grade"
            value={isLoading ? null : (readiness.value != null ? `${readiness.value}%` : "—")}
            badge={isLoading ? "" : (readiness.badge as string) || "Run analysis"}
            badgeColor={(readiness.value as number) >= 80 ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}
            loading={isLoading}
          />
        </div>

        {/* ─── Row 2: Readiness Trend + Company Match ─── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] grid-cols-1">
          {/* Readiness Trend Chart */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{(d?.trend_label as string) || "Readiness Trend"}</h2>
                <p className="text-xs text-gray-400">
                  {trendData ? "Your profile score across platforms" : "Run your first AI analysis to see trends"}
                </p>
              </div>
            </div>
            <div className="h-56">
              {chartData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
                    <Area type="monotone" dataKey="score" stroke="#1e293b" strokeWidth={2} fill="url(#trendFill)" dot={{ r: 2.5, fill: '#1e293b', strokeWidth: 0 }} activeDot={{ r: 4, fill: '#1e293b' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                    <svg className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mb-1">No trend data yet</p>
                  <p className="text-xs text-gray-400">Run your first AI analysis to start tracking progress</p>
                </div>
              )}
            </div>
          </div>

          {/* Company Match */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-gray-900">Company Match</h2>
            {scoresLoading || isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between"><div className="h-4 w-24 animate-pulse rounded bg-gray-100" /><div className="h-4 w-10 animate-pulse rounded bg-gray-100" /></div>
                    <div className="h-2.5 w-full animate-pulse rounded-full bg-gray-100" />
                  </div>
                ))}
              </div>
            ) : displayScores.length > 0 ? (
              <div className="space-y-4">
                {displayScores.slice(0, 5).map((s: Record<string, unknown>) => {
                  const slug = (s.company_slug as string) || "";
                  const rawScore = s.overall_score;
                  const isPending = rawScore === null || rawScore === undefined;
                  const score = isPending ? 0 : Math.round(rawScore as number);
                  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#2563eb" : "#1e293b";
                  return (
                    <Link key={slug} href={`/company/${slug}`} className="block group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <CompanyLogo name={slug} />
                          <span className="text-sm font-medium text-gray-900 capitalize group-hover:text-teal-600 transition-colors">{slug.replace(/-/g, " ")}</span>
                        </div>
                        {isPending ? (
                          <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded">Pending</span>
                        ) : (
                          <span className="text-sm font-bold text-gray-900">{score}%</span>
                        )}
                      </div>
                      {isPending ? (
                        <div className="w-full h-2.5 rounded-full border border-dashed border-gray-200 bg-gray-50" />
                      ) : (
                        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${score}%`, backgroundColor: color }} />
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50"><ArrowUpRight className="h-6 w-6 text-gray-300" /></div>
                <p className="text-sm font-medium text-gray-500 mb-1">No target companies yet</p>
                <p className="text-xs text-gray-400 mb-4">Add companies to see your match scores</p>
                <Link href="/companies" className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3.5 py-2 text-sm font-medium text-teal-700 hover:bg-teal-100 transition-colors"><Plus className="h-4 w-4" /> Browse Companies</Link>
              </div>
            )}
            {displayScores.length > 0 && (
              <Link href="/companies" className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-400 hover:bg-[#f9fafb] hover:text-gray-600 transition-colors"><Plus className="h-4 w-4" /> Add Target Company</Link>
            )}
          </div>
        </div>

        {/* ─── Row 3: Priority Actions + Critical Gaps ─── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] grid-cols-1">
          {/* Top Priority Actions */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-900">Top Priority Actions</h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider"><Sparkles className="h-3 w-3" /> AI Generated</span>
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 rounded-lg border border-gray-100 p-3.5">
                    <div className="h-5 w-5 animate-pulse rounded bg-gray-100" />
                    <div className="flex-1 space-y-2"><div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" /><div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {priorityActions.map((action, idx) => (
                  <ActionItem key={idx} action={action} />
                ))}
              </div>
            )}
          </div>

          {/* Critical Gaps */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
            <h2 className="mb-4 text-base font-bold text-gray-900">Critical Gaps</h2>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (<div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />))}
              </div>
            ) : (
              <div className="space-y-3">
                {criticalGaps.map((g, idx) => (
                  <div key={idx} className={`rounded-lg p-4 border ${g.severity === "high" ? "bg-[#fef2f2] border-[#fecaca]" : "bg-[#fff7ed] border-[#fed7aa]"}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle className={`h-4 w-4 ${g.severity === "high" ? "text-red-500" : "text-orange-500"}`} strokeWidth={2.2} />
                      <span className={`text-sm font-bold ${g.severity === "high" ? "text-red-700" : "text-orange-700"}`}>{g.title}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${g.severity === "high" ? "text-red-600" : "text-orange-600"}`}>{g.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Row 4: Recent Activity ─── */}
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (<div key={i} className="h-12 animate-pulse rounded bg-gray-100" />))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Activity</th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Platform</th>
                  <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">Result</th>
                  <th className="pb-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">Date</th>
                  <th className="pb-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-[#f9fafb] transition-colors group">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <ActivityIcon type={(item.iconType as "code" | "video" | "git") || "code"} />
                        </div>
                        {item.link ? (
                          <a href={item.link as string} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-900 hover:text-teal-600 transition-colors">
                            {item.activity}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{item.activity}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4"><span className="text-sm text-gray-500">{item.platform}</span></td>
                    <td className="py-4">
                      <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-semibold ${item.resultStyle || "text-gray-700 bg-gray-100"}`}>{item.result}</span>
                    </td>
                    <td className="py-4 text-right text-sm text-gray-400">{item.date}</td>
                    <td className="py-4 text-center">
                      {item.link ? (
                        <a href={item.link as string} target="_blank" rel="noopener noreferrer" title="Open on platform" className="inline-flex items-center justify-center text-teal-400 hover:text-teal-600 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Yearly Heatmap Modal */}
      {showHeatmap && (
        <YearlyHeatmapModal
          yearlyHeatmap={(streak.yearly_heatmap as Record<string, { count: number; platforms: string[] }>) || {}}
          currentStreak={(streak.current_streak as number) || 0}
          longestStreak={(streak.longest_streak as number) || 0}
          totalActiveDays={(streak.total_active_days as number) || 0}
          onClose={() => setShowHeatmap(false)}
        />
      )}
    </DashboardLayout>
  );
}

/* ─── Helpers ─── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── Action Item (clickable) ─── */

function ActionItem({ action }: { action: Record<string, string> }) {
  const inner = (
    <div className="flex items-center gap-4 rounded-lg border border-gray-100 p-3.5 hover:bg-[#f9fafb] transition-colors cursor-pointer group">
      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-gray-300 group-hover:border-teal-400 transition-colors" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900">{action.title}</div>
        <div className="text-xs text-gray-400 mt-0.5">{action.desc}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="shrink-0 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-500 font-medium">{action.time}</span>
        {action.link && <ExternalLink className="h-3.5 w-3.5 text-gray-300 group-hover:text-teal-500 transition-colors" />}
      </div>
    </div>
  );

  if (action.link) {
    return <Link href={action.link}>{inner}</Link>;
  }
  return inner;
}

/* ─── Streak Card with 7-Day Heatmap ─── */

function StreakCard({ value, badge, badgeColor, weekActivity, longestStreak, currentStreak, yearlyHeatmap, totalActiveDays, onOpenHeatmap, loading = false }: {
  value: string | null; badge: string; badgeColor: string; weekActivity: boolean[]; longestStreak: number;
  currentStreak: number;
  yearlyHeatmap: Record<string, { count: number; platforms: string[] }>;
  totalActiveDays: number;
  onOpenHeatmap: () => void;
  loading?: boolean;
}) {
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const today = new Date();
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    labels.push(dayLabels[dow === 0 ? 6 : dow - 1]);
  }

  return (
    <div
      onClick={onOpenHeatmap}
      className="rounded-lg border border-[#e5e7eb] bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors"><FlameIcon /></div>
        {loading ? <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" /> : <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeColor}`}>{badge}</span>}
      </div>
      <div className="text-[11px] text-[#6b7280] mb-0.5">Coding Streak</div>
      {loading ? <div className="h-8 w-20 animate-pulse rounded bg-gray-100 mt-1" /> : (
        <div>
          <div className="text-[28px] font-bold leading-tight text-gray-900">{value || "—"}</div>
          {/* 7-day heatmap with today indicator */}
          {weekActivity.length === 7 && (
            <div className="flex items-center gap-1.5 mt-2">
              {weekActivity.map((active, i) => {
                const isToday = i === 6;
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className="relative">
                      <div
                        className={`w-3.5 h-3.5 rounded-full transition-colors ${
                          active
                            ? "bg-emerald-400 shadow-sm shadow-emerald-200"
                            : "bg-gray-200"
                        }`}
                      />
                      {/* Today pulsing ring */}
                      {isToday && (
                        <div className="absolute -inset-[3px] rounded-full border-2 border-teal-400 animate-pulse opacity-60" />
                      )}
                    </div>
                    <span className={`text-[8px] font-medium ${isToday ? "text-teal-500" : "text-gray-400"}`}>{labels[i]}</span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between mt-1.5">
            {longestStreak > 0 && (
              <div className="text-[11px] text-gray-400">
                Longest: {longestStreak} day{longestStreak !== 1 ? "s" : ""}
              </div>
            )}
            <div className="text-[10px] text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity">
              View heatmap →
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Yearly Heatmap Modal ─── */

const PLATFORMS = ["GitHub", "LeetCode", "CodeChef", "HackerRank"];
const PLATFORM_COLORS: Record<string, string> = {
  GitHub: "bg-gray-800", LeetCode: "bg-amber-500", CodeChef: "bg-teal-600", HackerRank: "bg-green-600",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function YearlyHeatmapModal({ yearlyHeatmap, currentStreak, longestStreak, totalActiveDays, onClose }: {
  yearlyHeatmap: Record<string, { count: number; platforms: string[] }>;
  currentStreak: number; longestStreak: number; totalActiveDays: number; onClose: () => void;
}) {
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<string>>(new Set(PLATFORMS));
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; count: number; platforms: string[] } | null>(null);

  const togglePlatform = (p: string) => {
    setEnabledPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(p)) { next.delete(p); } else { next.add(p); }
      return next;
    });
  };

  // Build 52×7 grid (columns=weeks, rows=Mon..Sun)
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Find the start: go back ~52 weeks to the nearest Monday
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  // Align to Monday
  const startDow = startDate.getDay(); // 0=Sun
  const offsetToMon = startDow === 0 ? -6 : 1 - startDow;
  startDate.setDate(startDate.getDate() + offsetToMon);

  // Build weeks array: each week is 7 cells
  const weeks: { date: string; count: number; platforms: string[]; isToday: boolean }[][] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= today || weeks.length < 53) {
    const week: { date: string; count: number; platforms: string[]; isToday: boolean }[] = [];
    for (let dow = 0; dow < 7; dow++) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const entry = yearlyHeatmap[dateStr];
      const filteredPlatforms = entry ? entry.platforms.filter(p => enabledPlatforms.has(p)) : [];
      const isFuture = currentDate > today;

      week.push({
        date: dateStr,
        count: isFuture ? -1 : filteredPlatforms.length,
        platforms: filteredPlatforms,
        isToday: dateStr === todayStr,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
    if (weeks.length >= 53) break;
  }

  // Month labels: track which weeks start a new month
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    // Use the first visible day of the week (Monday = index 0)
    const firstDay = week[0];
    if (firstDay) {
      const m = new Date(firstDay.date).getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ col: wi, label: MONTHS[m] });
        lastMonth = m;
      }
    }
  });

  // Recompute stats based on enabled platform filter
  let filteredActiveDays = 0;
  Object.values(yearlyHeatmap).forEach(entry => {
    if (entry.platforms.some(p => enabledPlatforms.has(p))) filteredActiveDays++;
  });

  const getColor = (count: number): string => {
    if (count < 0) return "bg-gray-50"; // future
    if (count === 0) return "bg-gray-100";
    if (count === 1) return "bg-emerald-200";
    if (count <= 2) return "bg-emerald-400";
    return "bg-emerald-600";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Coding Activity</h2>
            <p className="text-sm text-gray-400 mt-0.5">Cross-platform activity over the past year</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-6">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{filteredActiveDays}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Active Days</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">{currentStreak}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Current Streak</div>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <div className="text-lg font-bold text-orange-500">{longestStreak}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Longest Streak</div>
          </div>

          {/* Platform filter toggles — pushed right */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide mr-1">Platforms:</span>
            {PLATFORMS.map(p => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all ${
                  enabledPlatforms.has(p)
                    ? "border-teal-200 bg-teal-50 text-teal-700"
                    : "border-gray-200 bg-gray-50 text-gray-400 line-through"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${enabledPlatforms.has(p) ? PLATFORM_COLORS[p] : "bg-gray-300"}`} />
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="px-6 py-5 overflow-x-auto">
          {/* Month labels */}
          <div className="flex ml-8 mb-1">
            {monthLabels.map((ml, i) => (
              <div
                key={i}
                className="text-[10px] text-gray-400 font-medium"
                style={{ position: "absolute", left: `${32 + ml.col * 15}px` }}
              >
                {ml.label}
              </div>
            ))}
          </div>
          <div className="relative mt-4">
            <div className="flex gap-[2px]">
              {/* Day labels */}
              <div className="flex flex-col gap-[2px] mr-1 pt-0">
                {["Mon", "", "Wed", "", "Fri", "", "Sun"].map((label, i) => (
                  <div key={i} className="h-[13px] flex items-center">
                    <span className="text-[9px] text-gray-400 w-6 text-right">{label}</span>
                  </div>
                ))}
              </div>
              {/* Weeks */}
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((cell, di) => (
                    <div
                      key={di}
                      className={`w-[13px] h-[13px] rounded-[2px] transition-colors ${getColor(cell.count)} ${
                        cell.isToday ? "ring-2 ring-teal-400 ring-offset-1" : ""
                      } ${cell.count >= 0 ? "cursor-pointer hover:ring-1 hover:ring-gray-300" : ""}`}
                      onMouseEnter={(e) => {
                        if (cell.count >= 0) {
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setTooltip({ x: rect.left + rect.width / 2, y: rect.top - 8, date: cell.date, count: cell.count, platforms: cell.platforms });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-4 justify-end">
            <span className="text-[10px] text-gray-400">Less</span>
            <div className="w-[11px] h-[11px] rounded-[2px] bg-gray-100" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-200" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-400" />
            <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-600" />
            <span className="text-[10px] text-gray-400">More</span>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-[10000] px-3 py-2 rounded-lg bg-gray-900 text-white text-[11px] shadow-lg pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y, transform: "translate(-50%, -100%)" }}
          >
            <div className="font-semibold">{new Date(tooltip.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</div>
            {tooltip.count > 0 ? (
              <>
                <div className="text-emerald-300">{tooltip.count} platform{tooltip.count > 1 ? "s" : ""} active</div>
                <div className="text-gray-400">{tooltip.platforms.join(", ")}</div>
              </>
            ) : (
              <div className="text-gray-400">No activity</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stat Card with Skeleton ─── */

function StatCard({ icon, label, value, badge, badgeColor, subText, loading = false }: {
  icon: React.ReactNode; label: string; value: string | null; badge: string; badgeColor: string; subText?: string; loading?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">{icon}</div>
        {loading ? <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" /> : <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeColor}`}>{badge}</span>}
      </div>
      <div className="text-[11px] text-[#6b7280] mb-0.5">{label}</div>
      {loading ? <div className="h-8 w-20 animate-pulse rounded bg-gray-100 mt-1" /> : (
        <div>
          <div className="text-[28px] font-bold leading-tight text-gray-900">{value || "—"}</div>
          {subText && <div className="text-[11px] text-gray-400 mt-0.5">{subText}</div>}
        </div>
      )}
    </div>
  );
}

/* ─── Icon Components ─── */

function CodeBracketsIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>);
}

function GitHubLogoIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="#334155"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>);
}

function FlameIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 23c-4.97 0-9-3.582-9-8 0-3.188 2.063-5.5 4-7.5.453-.469 1.25.06 1.125.688C7.75 10 8.938 11.5 10 11.5c1.688 0 1.312-3 .75-5-.25-.875.688-1.5 1.375-.938C14.625 7.5 17 10.5 17 13c0 .5-.063 1-.188 1.5-.125.5.438.938.875.563C18.563 14.312 19 13.188 19 12c0-.313-.031-.625-.094-.938-.093-.5.407-.874.844-.562C21.156 11.5 22 13.5 22 15.5c0 4.142-4.03 7.5-10 7.5z" fill="#f97316" /><path d="M12 23c-2.21 0-4-1.343-4-3 0-1.4 1.188-2.5 2-3.5.188-.219.563-.031.5.25-.125.625.375 1.25 1 1.25.5 0 .75-.5.625-1.25-.063-.375.313-.625.563-.375.75.75 1.312 1.75 1.312 2.625 0 2.209-1.79 4-2 4z" fill="#fbbf24" /></svg>);
}

function MoonIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>);
}

function CompanyLogo({ name }: { name: string }) {
  const base = "flex h-7 w-7 items-center justify-center rounded-full";
  const n = name.toLowerCase();
  if (n.includes("google")) return <div className={`${base} bg-gray-50`}><svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg></div>;
  if (n.includes("meta")) return <div className={`${base} bg-blue-50 text-[10px] font-extrabold text-blue-600`}>M</div>;
  if (n.includes("amazon")) return <div className={`${base} bg-orange-50 text-[10px] font-extrabold text-orange-600`}>A</div>;
  if (n.includes("stripe")) return <div className={`${base} bg-indigo-50`}><span className="text-[8px] font-extrabold text-indigo-600 tracking-tight leading-none">stripe</span></div>;
  const initial = name.replace(/-/g, " ").split(" ").map(w => w[0]?.toUpperCase()).join("").slice(0, 2);
  return <div className={`${base} bg-gray-100 text-xs font-bold text-gray-500`}>{initial}</div>;
}

function ActivityIcon({ type }: { type: "code" | "video" | "git" }) {
  if (type === "code") return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>);
  if (type === "video") return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="14" height="14" rx="2" /><path d="M16 10l6-3v10l-6-3" /></svg>);
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="#64748b"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>);
}
