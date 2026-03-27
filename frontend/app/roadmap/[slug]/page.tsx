// Roadmap page — backend-driven preparation dashboard
"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { CompanyLogoIcon } from "@/components/ui/CompanyLogos";
import {
  RefreshCw, Download, Flame, Clock, CheckCircle2, Lock, ChevronRight,
  Brain, GitBranch, BarChart3, BookOpen, Users, Trophy, MessageCircle,
  Code2, Video, LinkIcon, FileText, Sparkles, Target, TrendingUp, Zap
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

import { useCompany, useRoadmapData, useUpdateTask, useScoreHistory, useSyncLeetCode } from "@/lib/api";

const ACTION_COLORS = ["red", "amber", "blue", "purple", "green", "orange"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* ─── Icon helpers ─── */
const iconBg: Record<string, string> = { red: "bg-red-50", amber: "bg-amber-50", blue: "bg-blue-50", purple: "bg-purple-50", green: "bg-green-50", orange: "bg-orange-50" };
const iconColorMap: Record<string, string> = { red: "#EF4444", amber: "#F59E0B", blue: "#3B82F6", purple: "#8B5CF6", green: "#10B981", orange: "#F97316" };

function TaskIcon({ color }: { color: string }) {
  const cls = "h-4 w-4";
  const c = iconColorMap[color] || "#6B7280";
  const map: Record<string, React.ReactNode> = {
    red: <Brain className={cls} style={{ color: c }} />, amber: <GitBranch className={cls} style={{ color: c }} />,
    blue: <BarChart3 className={cls} style={{ color: c }} />, purple: <BookOpen className={cls} style={{ color: c }} />,
    green: <Users className={cls} style={{ color: c }} />, orange: <Trophy className={cls} style={{ color: c }} />,
  };
  return <>{map[color] || <Code2 className={cls} />}</>;
}

function ResourceIcon({ type }: { type: string }) {
  if (type === "video") return <div className="rounded-md bg-red-50 p-1.5"><Video className="h-4 w-4 text-red-500" /></div>;
  if (type === "link") return <div className="rounded-md bg-blue-50 p-1.5"><LinkIcon className="h-4 w-4 text-blue-500" /></div>;
  return <div className="rounded-md bg-purple-50 p-1.5"><FileText className="h-4 w-4 text-purple-500" /></div>;
}

function skillBarColor(p: number) { return p >= 70 ? "#10B981" : p >= 50 ? "#F59E0B" : "#EF4444"; }

/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function RoadmapPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: rawCompany, isLoading: companyLoading } = useCompany(slug || "");
  const { data: rawRoadmap, isLoading: roadmapLoading } = useRoadmapData(slug || "");
  const { data: scoreHistory } = useScoreHistory(slug || "");
  const updateTask = useUpdateTask();
  const syncLC = useSyncLeetCode();

  const isLoading = companyLoading || roadmapLoading;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rm = rawRoadmap as Record<string, any> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const company = rawCompany as Record<string, any> | null;

  // Company info
  const companyName = (company?.name as string) || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Company");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companyRole = ((company?.hiring_data as any)?.roles || [])[0] || "Software Engineer";

  // Roadmap metrics — directly from enriched API
  const weeksTotal = rm?.total_weeks || 24;
  const currentWeek = rm?.current_week || 1;
  const progressPercent = Math.round(rm?.progress_pct || 0);
  const streakDays = rm?.streak_days || 0;
  const scoreStatus = rm?.score_status || "Needs Work";
  const targetScore = 85;
  const currentScore = progressPercent; // will be replaced by match score when available

  // Phases — directly from backend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const phases = useMemo(() => {
    if (rm?.phases && Array.isArray(rm.phases) && rm.phases.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return rm.phases.map((p: any) => ({
        id: p.phase_number,
        name: p.title,
        weeks: `${p.week_start}-${p.week_end}`,
        status: p.status as "complete" | "active" | "locked",
        progress: p.status === "complete" ? 100 : p.status === "active" ? Math.round(progressPercent) : 0,
      }));
    }
    return [
      { id: 1, name: "DSA Foundation", weeks: "1-6", status: "active" as const, progress: 0 },
      { id: 2, name: "Projects & Stack", weeks: "7-12", status: "locked" as const, progress: 0 },
      { id: 3, name: "System Design", weeks: "13-18", status: "locked" as const, progress: 0 },
      { id: 4, name: "Final Prep", weeks: "19-24", status: "locked" as const, progress: 0 },
    ];
  }, [rm?.phases, progressPercent]);

  // Weeks — from weeks_data JSONB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weeks = useMemo(() => {
    if (rm?.weeks_data && Array.isArray(rm.weeks_data) && rm.weeks_data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return rm.weeks_data.map((w: any, i: number) => {
        const daily = w.daily_plan || {};
        const dsaTask = w.dsa_task || {};
        const projectTask = w.project_task || {};
        const resources = w.resources || [];
        return {
          number: w.week_number || i + 1,
          theme: w.theme || `Week ${i + 1}`,
          hoursPerDay: rm.hours_per_day || 4,
          progressPercent: 0,
          dsaProblems: dsaTask.topic ? [{
            id: 1, name: dsaTask.topic, count: dsaTask.count || 5,
            difficulty: dsaTask.difficulty || "Medium", status: "upcoming" as const,
          }] : [],
          dailyPlan: DAYS.map((day) => ({
            day, task: daily[day] || "Study", isToday: false,
          })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          resources: resources.map((r: any) => ({
            type: (r.url?.includes("youtube") ? "video" : "link") as "video" | "link" | "doc",
            name: r.title || "Resource", url: r.url || "#",
          })),
          projectTask: {
            name: projectTask.title || "Project work", impact: projectTask.score_impact || 3,
            effort: projectTask.effort || "Medium", hours: projectTask.hours || 4,
          },
          milestone: w.milestone || `Complete Week ${i + 1}`,
        };
      });
    }
    return [{ number: 1, theme: "Loading...", hoursPerDay: 4, progressPercent: 0, dsaProblems: [], dailyPlan: [], resources: [], projectTask: { name: "Loading...", impact: 0, effort: "Low", hours: 0 }, milestone: "Loading..." }];
  }, [rm?.weeks_data, rm?.hours_per_day]);

  // Kanban tasks — from backend
  const kanbanTasks = useMemo(() => {
    const tasks = rm?.kanban_tasks || [];
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      todo: tasks.filter((t: any) => t.status === "todo").map((t: any, i: number) => ({
        id: t.id, title: t.title, impact: t.score_impact || 3,
        effort: t.difficulty === "hard" ? "High" : "Medium",
        difficulty: (t.difficulty || "medium").charAt(0).toUpperCase() + (t.difficulty || "medium").slice(1),
        duration: `${t.estimated_weeks || 2} weeks`,
        iconColor: ACTION_COLORS[i % ACTION_COLORS.length],
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inProgress: tasks.filter((t: any) => t.status === "in_progress").map((t: any) => ({
        id: t.id, title: t.title, impact: t.score_impact || 3,
        progress: t.lc_count_required ? Math.round((t.lc_count_done / t.lc_count_required) * 100) : 50,
        difficulty: (t.difficulty || "medium").charAt(0).toUpperCase() + (t.difficulty || "medium").slice(1),
        duration: `${t.estimated_weeks || 2} weeks`,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      done: tasks.filter((t: any) => t.status === "done").map((t: any) => t.title),
    };
  }, [rm?.kanban_tasks]);

  // Skill progress — from backend
  const skillProgress = useMemo(() => {
    if (rm?.skill_progress && Array.isArray(rm.skill_progress)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return rm.skill_progress.map((s: any) => ({
        skill: s.topic, progress: s.required > 0 ? Math.round((s.solved / s.required) * 100) : 0,
      }));
    }
    return [];
  }, [rm?.skill_progress]);

  // Score history — from dedicated endpoint
  const chartScoreHistory = useMemo(() => {
    if (scoreHistory && Array.isArray(scoreHistory)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return scoreHistory.map((s: any) => ({
        month: `W${s.week_number}`, score: s.score, projected: s.projected_score,
      }));
    }
    return [];
  }, [scoreHistory]);

  // Score simulator from company scoring_weights
  const scoreSimulator = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weights = (company?.scoring_weights || {}) as any;
    const labelMap: Record<string, string> = {
      dsa_score: "Master DSA", project_score: "Build Projects", system_design_score: "System Design",
      stack_alignment: "Align Tech Stack", internship_score: "Get Experience", consistency_index: "Build Consistency",
    };
    return Object.entries(weights)
      .filter(([k]) => ["dsa_score", "project_score", "system_design_score", "stack_alignment", "internship_score", "consistency_index"].includes(k))
      .map(([k, v]) => ({ task: labelMap[k] || k, impact: Math.round(Number(v) * 20), selected: false }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 6);
  }, [company?.scoring_weights]);

  // Handle task status change
  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    updateTask.mutate({ companySlug: slug || "", taskId, status: newStatus });
  };

  const [activeWeek, setActiveWeek] = useState(1);
  const [simSelected, setSimSelected] = useState<boolean[]>(scoreSimulator.map(() => false));
  const [chartFilter, setChartFilter] = useState<"1M" | "3M" | "6M" | "1Y">("3M");

  // Safe access to current week data — fallback to first week or a placeholder
  const currentWeekData = weeks[activeWeek - 1] || weeks[0] || {
    number: 1, theme: "Loading...", hoursPerDay: 4, progressPercent: 0,
    dsaProblems: [], dailyPlan: [], resources: [], 
    projectTask: { name: "Loading...", impact: 0, effort: "Low", hours: 0 },
    milestone: "Loading...",
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-[#10B981]" />
          <span className="ml-3 text-sm text-[#6B7280]">Loading roadmap...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Simulator calculations
  const simProjected = currentScore + simSelected.reduce((sum, sel, i) => sel ? sum + scoreSimulator[i].impact : sum, 0);
  const toggleSim = (i: number) => setSimSelected(prev => { const n = [...prev]; n[i] = !n[i]; return n; });

  // Build cumulative score bars for simulator
  const simBars: { label: string; score: number; delta: number }[] = [];
  let runningScore = currentScore;
  simBars.push({ label: "Current Score", score: runningScore, delta: 0 });
  simSelected.forEach((sel, i) => {
    if (sel) {
      const impact = scoreSimulator[i].impact;
      runningScore += impact;
      simBars.push({ label: `After ${scoreSimulator[i].task}`, score: runningScore, delta: impact });
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">

        {/* ═══ PAGE HEADER ═══ */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">My {companyName} Roadmap</h1>
            <p className="text-sm text-[#6B7280]">{companyRole} · {weeksTotal} week plan{rm?.last_synced_at ? ` · Last synced: ${new Date(rm.last_synced_at).toLocaleString()}` : ""}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => syncLC.mutate(slug || "")} disabled={syncLC.isPending} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${syncLC.isPending ? "animate-spin" : ""}`} /> {syncLC.isPending ? "Syncing..." : "Sync LeetCode"}
            </button>
            <button onClick={() => alert('Roadmap regeneration will be available once the AI agent pipeline is connected.')} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
              <RefreshCw className="h-4 w-4" /> Regenerate
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg bg-[#10B981] px-4 py-2 text-sm font-medium text-white hover:bg-[#059669] transition-colors">
              <Download className="h-4 w-4" /> Export Plan
            </button>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#9CA3AF] mb-1">Current Score</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#374151]">{currentScore}%</span>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full px-2 py-0.5">{scoreStatus}</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#9CA3AF] mb-1">Target</p>
            <span className="text-2xl font-bold text-[#10B981]">{targetScore}%</span>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#9CA3AF] mb-1">Time</p>
            <span className="text-2xl font-bold text-[#111827]">{weeksTotal} <span className="text-sm font-normal text-[#9CA3AF]">weeks</span></span>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#9CA3AF] mb-1">Progress</p>
            <span className="text-2xl font-bold text-[#111827]">{progressPercent}%</span>
          </div>
        </div>

        {/* Streak row */}
        <div className="flex items-center gap-4 text-sm text-[#6B7280]">
          <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-[#F59E0B]" /> <span className="font-semibold text-[#111827]">{streakDays} day streak</span></span>
          <span className="text-[#D1D5DB]">·</span>
          <span>Last solved: <span className="font-medium text-[#111827]">{rm?.last_solved_at || "Not started"}</span></span>
          <span className="text-[#D1D5DB]">·</span>
          <span>Problems this week: <span className="font-medium text-[#111827]">{rm?.problems_this_week || 0}</span></span>
        </div>

        {/* Overall progress bar */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#111827]">Overall Progress</span>
            <span className="text-sm font-bold text-[#10B981]">{progressPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-[#F3F4F6]">
            <div className="h-full rounded-full bg-[#10B981] transition-all duration-700" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* ═══ SECTION 1 — LEARNING PHASES ═══ */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-base font-semibold text-[#111827] mb-5">Learning Phases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {phases.map((p) => (
              <div key={p.id} className={`rounded-xl p-5 ${
                p.status === "complete" ? "bg-emerald-50 border border-emerald-200" :
                p.status === "active" ? "bg-white border-2 border-emerald-500 shadow-sm" :
                "bg-gray-50 border border-gray-200 opacity-70"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${p.status === "complete" ? "text-emerald-600" : p.status === "active" ? "text-emerald-600" : "text-gray-400"}`}>Phase {p.id}</span>
                  {p.status === "complete" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {p.status === "active" && <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />}
                  {p.status === "locked" && <Lock className="h-4 w-4 text-gray-400" />}
                </div>
                <h3 className={`text-sm font-bold mb-0.5 ${p.status === "locked" ? "text-gray-500" : "text-[#111827]"}`}>{p.name}</h3>
                <p className="text-xs text-[#9CA3AF] mb-2">Week {p.weeks}</p>
                <div className="flex items-center gap-2 mb-2">
                  {p.status === "complete" && <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Complete</span>}
                  {p.status === "active" && <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1"><Sparkles className="h-3 w-3" /> In Progress</span>}
                  {p.status === "locked" && <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1"><Lock className="h-3 w-3" /> Locked</span>}
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${p.progress}%` }} />
                </div>
                <p className={`text-[10px] font-semibold text-right mt-1 ${p.status === "locked" ? "text-gray-400" : "text-emerald-600"}`}>{p.progress}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 2 — WEEKLY PLAN ═══ */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-base font-semibold text-[#111827] mb-4">Weekly Plan</h2>

          {/* Week pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {Array.from({ length: weeksTotal }, (_, i) => i + 1).map((w) => {
              const isCompleted = w <= (rm?.current_week || 1) - 1;
              const isActive = w === activeWeek;
              return (
                <button key={w} onClick={() => setActiveWeek(w)} className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isCompleted && !isActive ? "bg-emerald-500 text-white" :
                  isActive ? "border-2 border-emerald-500 text-emerald-600 bg-white font-semibold" :
                  "border border-gray-200 text-gray-400"
                }`}>W{w}</button>
              );
            })}
          </div>

          {/* Current week card */}
          <div className="border-l-4 border-emerald-500 border border-[#E5E7EB] rounded-xl p-6 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-[#111827]">Week {currentWeekData.number}: {currentWeekData.theme}</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-3">
              <Clock className="h-3.5 w-3.5" /> {currentWeekData.hoursPerDay} hrs/day <span className="text-[#D1D5DB]">·</span> <span className="text-emerald-600 font-medium">{currentWeekData.progressPercent}% done</span>
            </div>
            <div className="h-2 rounded-full bg-[#F3F4F6] mb-6">
              <div className="h-full rounded-full bg-[#10B981] transition-all" style={{ width: `${currentWeekData.progressPercent}%` }} />
            </div>

            {/* DSA PROBLEMS */}
            <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">DSA Problems</p>
            <div className="space-y-2 mb-6">
              {currentWeekData.dsaProblems.map((p) => (
                <div key={p.id} className={`rounded-lg p-4 flex items-center gap-3 ${
                  p.status === "done" ? "bg-emerald-50 border border-emerald-100" :
                  p.status === "today" ? "bg-amber-50 border border-amber-300" :
                  "bg-white border border-[#E5E7EB]"
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                    p.status === "done" ? "bg-emerald-500" : p.status === "today" ? "border-2 border-amber-400" : "border-2 border-gray-300"
                  }`}>
                    {p.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${p.status === "done" ? "line-through text-gray-400" : "text-[#111827]"}`}>{p.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{p.count} {p.difficulty} problems</p>
                  </div>
                  {p.status === "done" && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5">Done ✓</span>}
                  {p.status === "today" && <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-2 py-0.5">TODAY</span>}
                  {p.status === "upcoming" && <span className="text-xs text-[#9CA3AF]">Upcoming</span>}
                </div>
              ))}
            </div>

            {/* DAILY PLAN */}
            <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">This Week — Daily Plan</p>
            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
              {currentWeekData.dailyPlan.map((d, i) => (
                <div key={d.day} className={`flex border-b border-[#E5E7EB] last:border-0 ${d.isToday ? "bg-amber-50" : ""}`}>
                  <div className={`w-32 shrink-0 px-4 py-3 bg-gray-50 border-r border-[#E5E7EB] ${d.isToday ? "bg-amber-50" : ""}`}>
                    <p className="text-sm font-medium text-[#374151]">{d.day}</p>
                    {d.isToday && <span className="text-[10px] font-bold text-amber-600">TODAY ●</span>}
                  </div>
                  <div className="px-4 py-3 flex-1">
                    <p className="text-sm text-[#6B7280]">{d.task}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* RESOURCES */}
            <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">Resources</p>
            <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
              {currentWeekData.resources.map((r) => (
                <a key={r.name} href={r.url} className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-center gap-3">
                    <ResourceIcon type={r.type} />
                    <span className="text-sm text-[#374151]">{r.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                </a>
              ))}
            </div>

            {/* PROJECT TASK */}
            <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">Project Task</p>
            <div className="border border-[#E5E7EB] rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded border-2 border-gray-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#111827]">{currentWeekData.projectTask.name} <span className="bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5 ml-1">+{currentWeekData.projectTask.impact}%</span></p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-amber-100 text-amber-700 text-xs rounded-full px-2 py-0.5">{currentWeekData.projectTask.effort}</span>
                    <span className="text-xs text-[#9CA3AF]">· {currentWeekData.projectTask.hours} hrs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MILESTONE */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-sm font-medium text-[#374151]">{currentWeekData.milestone} 🔒</p>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3 — SCORE IMPACT SIMULATOR ═══ */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-base font-semibold text-[#111827] mb-1">Score Impact Simulator</h2>
          <p className="text-sm text-[#9CA3AF] mb-5">See how completing tasks improves your match score</p>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left — checkboxes */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">Select tasks to simulate</p>
              <div className="space-y-2">
                {scoreSimulator.map((s, i) => (
                  <button key={s.task} onClick={() => toggleSim(i)} className={`w-full text-left rounded-lg p-3 flex items-center justify-between transition-colors ${
                    simSelected[i] ? "bg-emerald-50 border border-emerald-200" : "bg-white border border-[#E5E7EB] hover:border-[#A7F3D0]"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${simSelected[i] ? "bg-emerald-500" : "border-2 border-gray-300"}`}>
                        {simSelected[i] && <CheckCircle2 className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-sm text-[#374151]">{s.task}</span>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5">+{s.impact}%</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right — score progression */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">Score Progression</p>
              <div className="space-y-4">
                {simBars.map((b, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#6B7280]">{b.label}</span>
                      {b.delta > 0 && <span className="bg-emerald-100 text-emerald-600 text-xs font-bold rounded-full px-2">+{b.delta}%</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-[#111827] w-12">{b.score}%</span>
                      <div className="flex-1 h-4 rounded-full bg-[#F3F4F6]">
                        <div className="h-full rounded-full bg-[#10B981] transition-all duration-500" style={{ width: `${Math.min(100, b.score)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
                {simProjected >= targetScore ? (
                  <div className="bg-emerald-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold text-center">
                    🎯 Target Achieved! Projected Score: {simProjected}%
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">
                    Projected Score: <span className="font-bold text-[#111827]">{simProjected}%</span> · Gap to target ({targetScore}%): <span className="font-bold text-[#EF4444]">{targetScore - simProjected}% remaining</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 4 — TASK BOARD ═══ */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-[#111827]">Task Board</h2>
            <span className="text-sm text-[#9CA3AF]">Sorted by impact</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* TO DO */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">To Do</h3>
                <span className="bg-gray-100 text-gray-600 rounded-full px-2 text-xs font-bold">{kanbanTasks.todo.length}</span>
              </div>
              <div className="space-y-3">
                {kanbanTasks.todo.map((t) => (
                  <div key={t.title} className="relative rounded-xl border border-[#E5E7EB] p-4 bg-white">
                    <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5">+{t.impact}%</span>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold rounded px-1.5 py-0.5 ${t.difficulty === "Hard" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{t.difficulty}</span>
                      <span className="text-xs text-[#9CA3AF]">{t.duration}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#111827]">{t.title}</p>
                    <button onClick={() => handleTaskStatusChange(t.id, "in_progress")} className="text-sm font-medium text-[#10B981] mt-2 hover:underline">Start →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* IN PROGRESS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">In Progress</h3>
                <span className="bg-emerald-100 text-emerald-600 rounded-full px-2 text-xs font-bold">{kanbanTasks.inProgress.length}</span>
              </div>
              <div className="space-y-3">
                {kanbanTasks.inProgress.map((t) => (
                  <div key={t.title} className="relative rounded-xl border-2 border-emerald-400 p-4 bg-white">
                    <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5">+{t.impact}%</span>
                    <p className="text-sm font-semibold text-[#111827] mb-2">{t.title}</p>
                    <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1">
                      <span>Progress</span><span className="font-bold text-[#111827]">{t.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F3F4F6]">
                      <div className="h-full rounded-full bg-[#10B981] transition-all" style={{ width: `${t.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DONE */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Done</h3>
                <span className="bg-emerald-100 text-emerald-600 rounded-full px-2 text-xs font-bold">{kanbanTasks.done.length}</span>
              </div>
              <div className="space-y-2">
                {kanbanTasks.done.map((t) => (
                  <div key={t} className="rounded-xl border border-[#E5E7EB] p-3.5 bg-emerald-50 flex items-center justify-between">
                    <span className="text-sm text-[#6B7280]">{t}</span>
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 5 — PROGRESS CHARTS ═══ */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-[#111827]">Progress Analytics</h2>
            <div className="flex gap-1.5">
              {(["1M", "3M", "6M", "1Y"] as const).map((f) => (
                <button key={f} onClick={() => setChartFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  chartFilter === f ? "bg-[#10B981] text-white" : "border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}>{f}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_1fr_1fr]">
            {/* Line chart */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 lg:col-span-1">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Match Score Over Time</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartScoreHistory} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#E5E7EB" }} />
                  <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#E5E7EB" }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Line type="monotone" dataKey={() => targetScore} name={`Target (${targetScore}%)`} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="score" name="Your Score" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: "#10B981" }} connectNulls />
                  <Line type="monotone" dataKey="projected" name="Projected" stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={1.5} dot={{ r: 2, fill: "#9CA3AF" }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Problems Per Week</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeks.slice(0, 8).map((w, i) => ({ week: `W${i + 1}`, count: 0 }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="week" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#E5E7EB" }} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#E5E7EB" }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Skill progress bars */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#111827] mb-4">Skill Progress</h3>
              <div className="space-y-4">
                {skillProgress.map((s) => (
                  <div key={s.skill}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[#6B7280]">{s.skill}</span>
                      <span className="text-xs font-bold" style={{ color: skillBarColor(s.progress) }}>{s.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F3F4F6]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.progress}%`, backgroundColor: skillBarColor(s.progress) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 6 — NEXT ACTIONS ═══ */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-[#111827]">Next Actions</h2>
            <span className="text-sm text-[#9CA3AF]">Sorted by impact</span>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {kanbanTasks.todo.slice(0, 3).map((a, i) => (
              <div key={a.title} className="relative rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#A7F3D0] transition-colors">
                <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5">+{a.impact}%</span>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg[ACTION_COLORS[i % ACTION_COLORS.length]]}`}>
                  <TaskIcon color={ACTION_COLORS[i % ACTION_COLORS.length]} />
                </div>
                <h4 className="text-sm font-semibold text-[#111827] mt-3">{a.title}</h4>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{a.difficulty} · {a.duration}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F3F4F6]">
                  <span className="text-xs text-[#9CA3AF] flex items-center gap-1"><Clock className="h-3 w-3" /> {a.duration}</span>
                  <button onClick={() => handleTaskStatusChange(a.id, "in_progress")} className="text-sm font-medium text-[#10B981] hover:underline">Start →</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══ FLOATING ASK COACH BUTTON ═══ */}
      <Link href="/coach" className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-5 py-3 text-sm font-medium shadow-lg flex items-center gap-2 z-50 transition-colors">
        <MessageCircle className="h-4 w-4" /> Ask Coach
      </Link>
    </DashboardLayout>
  );
}
