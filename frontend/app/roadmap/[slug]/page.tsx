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

import { useCompany, useRoadmapData, useUpdateTask, useScoreHistory, useSyncLeetCode, useSyncGitHub, useExportRoadmap, useRegenerateRoadmap } from "@/lib/api";

const ACTION_COLORS = ["red", "amber", "blue", "purple", "green", "orange"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* ─── Skill label mapping — transform raw DB names to readable labels ─── */
const SKILL_LABEL_MAP: Record<string, string> = {
  oops_required: "OOP Concepts",
  additional_valued: "Additional Skills",
  languages_accepted: "Languages",
  preferred_languages: "Preferred Languages",
  core_cs: "Core CS Fundamentals",
  soft_skills: "Soft Skills",
};
function cleanSkillLabel(raw: string): string {
  if (SKILL_LABEL_MAP[raw]) return SKILL_LABEL_MAP[raw];
  // Title-case already readable names
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
  const syncGH = useSyncGitHub();
  const exportRM = useExportRoadmap();
  const regenerate = useRegenerateRoadmap();

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
        status: p.status === "done" ? "complete" : p.status === "unlocked" ? "active" : "locked",
        progress: p.progress ?? 0,
      }));
    }
    return [
      { id: 1, name: "DSA Foundation", weeks: "1-6", status: "active" as const, progress: 0 },
      { id: 2, name: "Projects & Stack", weeks: "7-12", status: "locked" as const, progress: 0 },
      { id: 3, name: "System Design", weeks: "13-18", status: "locked" as const, progress: 0 },
      { id: 4, name: "Final Prep", weeks: "19-24", status: "locked" as const, progress: 0 },
    ];
  }, [rm?.phases, progressPercent]);

  // Sync result banner state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [syncResult, setSyncResult] = useState<{type: string; data: any} | null>(null);

  // Problem map from API — source of truth for progress (grouped by week)
  const problemMap = useMemo(() => {
    const map: Record<number, Array<{
      slug: string; topic: string; difficulty: string; order: number;
      status: string; solved_at: string | null; url: string;
    }>> = {};
    for (const p of (rm?.problem_map || [])) {
      (map[p.week] ||= []).push(p);
    }
    return map;
  }, [rm?.problem_map]);

  const weeks = useMemo(() => {
    if (rm?.weeks_data && Array.isArray(rm.weeks_data) && rm.weeks_data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return rm.weeks_data.map((w: any, i: number) => {
        const daily = w.daily_plan || {};
        const dsaTask = w.dsa_task || {};
        const projectTask = w.project_task || {};
        const resources = w.resources || [];
        const weekNum = w.week_number || i + 1;
        // Derive DSA status from server data (NOT local state)
        const dsaStatus = dsaTask.status || "upcoming";
        const dsaCount = dsaTask.count || 5;
        const dsaCountDone = dsaTask.count_done || 0;
        const dsaProgress = dsaCount > 0 ? dsaCountDone / dsaCount : 0;
        // Project done is tracked via server, not local state
        const projDone = projectTask.done ?? false;
        // Week progress derived from problem_map (server truth)
        const weekProgress = w.progress != null ? Math.round(w.progress) : Math.round(dsaProgress * 100);
        return {
          number: weekNum,
          theme: w.theme || `Week ${i + 1}`,
          hoursPerDay: rm.hours_per_day || 4,
          progressPercent: weekProgress,
          dsa: {
            label: dsaTask.label || "",
            lcTag: dsaTask.lc_tag || "",
            count: dsaCount,
            countDone: dsaCountDone,
            difficulty: dsaTask.difficulty || "Medium",
            status: dsaStatus,
            problems: dsaTask.problems || [],
          },
          dailyPlan: DAYS.map((day) => ({
            day, task: daily[day.toLowerCase()] || "Study", isToday: false,
          })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          resources: resources.map((r: any) => ({
            type: (r.url?.includes("youtube") ? "video" : "link") as "video" | "link" | "doc",
            name: r.title || "Resource", url: r.url || "#",
          })),
          projectTask: {
            name: projectTask.title || projectTask.label || "Project work",
            impact: projectTask.score_impact || 3,
            effort: projectTask.effort || "Medium",
            hours: projectTask.hours || 4,
            done: projDone,
          },
          milestone: w.milestone || `Complete Week ${i + 1}`,
          weekNumber: weekNum,
        };
      });
    }
    return [{ number: 1, theme: "Loading...", hoursPerDay: 4, progressPercent: 0, dsa: { label: "", lcTag: "", count: 0, countDone: 0, difficulty: "Medium", status: "upcoming", problems: [] }, dailyPlan: [], resources: [], projectTask: { name: "Loading...", impact: 0, effort: "Low", hours: 0, done: false }, milestone: "Loading...", weekNumber: 1 }];
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
        skill: cleanSkillLabel(s.topic), progress: s.required > 0 ? Math.round((s.solved / s.required) * 100) : 0,
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

  // Handle task status change (Task Board)
  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    updateTask.mutate({ companySlug: slug || "", taskId, status: newStatus });
  };

  // Toggle handlers REMOVED — progress is verified by platform sync, not user clicks

  const [activeWeek, setActiveWeek] = useState(1);
  const [simSelected, setSimSelected] = useState<boolean[]>(scoreSimulator.map(() => false));

  // Safe access to current week data — fallback to first week or a placeholder
  const currentWeekData = weeks[activeWeek - 1] || weeks[0] || {
    number: 1, theme: "Loading...", hoursPerDay: 4, progressPercent: 0,
    dsa: { label: "", lcTag: "", count: 0, countDone: 0, difficulty: "Medium", status: "upcoming", problems: [] },
    dailyPlan: [], resources: [], 
    projectTask: { name: "Loading...", impact: 0, effort: "Low", hours: 0, done: false },
    milestone: "Loading...", weekNumber: 1,
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
            <button onClick={() => syncLC.mutate(slug || "", {
              onSuccess: (result) => {
                setSyncResult({ type: "leetcode", data: result || {} });
                setTimeout(() => setSyncResult(null), 6000);
              },
            })} disabled={syncLC.isPending} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${syncLC.isPending ? "animate-spin" : ""}`} /> {syncLC.isPending ? "Syncing..." : "Sync LeetCode"}
            </button>
            <button onClick={() => syncGH.mutate(slug || "", {
              onSuccess: (result) => {
                setSyncResult({ type: "github", data: result || {} });
                setTimeout(() => setSyncResult(null), 6000);
              },
            })} disabled={syncGH.isPending} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${syncGH.isPending ? "animate-spin" : ""}`} /> {syncGH.isPending ? "Syncing..." : "Sync GitHub"}
            </button>
            <button onClick={() => regenerate.mutate(slug || "")} disabled={regenerate.isPending} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${regenerate.isPending ? "animate-spin" : ""}`} /> {regenerate.isPending ? "Generating..." : "Regenerate"}
            </button>
            <button onClick={() => exportRM.mutate(slug || "")} disabled={exportRM.isPending} className="flex items-center gap-2 rounded-lg bg-[#10B981] px-4 py-2 text-sm font-medium text-white hover:bg-[#059669] transition-colors disabled:opacity-50">
              <Download className="h-4 w-4" /> {exportRM.isPending ? "Exporting..." : "Export Plan"}
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

        {/* Sync Result Banner */}
        {syncResult && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">
                {syncResult.type === "leetcode" ? "LeetCode" : "GitHub"} Sync Complete
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                {syncResult.data?.new_submissions != null && `${syncResult.data.new_submissions} new submissions found · `}
                {syncResult.data?.problems_matched != null && `${syncResult.data.problems_matched} roadmap problems matched · `}
                {syncResult.data?.progress_pct != null && `Progress: ${syncResult.data.progress_pct}%`}
                {syncResult.data?.message && syncResult.data.message}
              </p>
            </div>
            <button onClick={() => setSyncResult(null)} className="text-emerald-400 hover:text-emerald-600 text-lg leading-none">&times;</button>
          </div>
        )}

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

          {/* Week pills — grouped by phase */}
          <div className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide items-end">
            {phases.map((phase, pi) => {
              const [start, end] = phase.weeks.split("-").map(Number);
              const phaseWeeks = Array.from({ length: end - start + 1 }, (_, i) => start + i);
              return (
                <div key={phase.id} className="flex items-end gap-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] whitespace-nowrap mb-0.5">P{phase.id}</span>
                    <div className="flex gap-1">
                      {phaseWeeks.map((w) => {
                        const isCompleted = w <= (rm?.current_week || 1) - 1;
                        const isActive = w === activeWeek;
                        return (
                          <button key={w} onClick={() => setActiveWeek(w)} className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                            isCompleted && !isActive ? "bg-emerald-500 text-white" :
                            isActive ? "border-2 border-emerald-500 text-emerald-600 bg-white font-semibold" :
                            "border border-gray-200 text-gray-400 hover:border-gray-300"
                          }`}>W{w}</button>
                        );
                      })}
                    </div>
                  </div>
                  {pi < phases.length - 1 && <div className="w-px h-5 bg-gray-200 mx-1 mb-0.5" />}
                </div>
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

            {/* DSA PROBLEMS — Verified Status from problem_map */}
            <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">DSA Problems <span className="text-gray-300 font-normal normal-case">· {currentWeekData.dsa.countDone}/{currentWeekData.dsa.count} solved</span></p>
            <div className="space-y-2 mb-6">
              {(problemMap[currentWeekData.number] || []).length > 0 ? (
                (problemMap[currentWeekData.number] || []).map((problem) => (
                  <div key={problem.slug} className={`w-full rounded-lg p-3 flex items-center gap-3 transition-all duration-200 ${
                    problem.status === "solved"
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-white border border-[#E5E7EB]"
                  }`}>
                    {/* Status dot — green=solved, gray=pending */}
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      problem.status === "solved" ? "bg-emerald-500" : "border-2 border-gray-300"
                    }`}>
                      {problem.status === "solved" && <CheckCircle2 className="h-3 w-3 text-white" />}
                    </div>

                    {/* Problem name */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium capitalize ${problem.status === "solved" ? "line-through text-gray-400" : "text-[#111827]"}`}>
                        {problem.slug.replace(/-/g, " ")}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">{problem.difficulty}</p>
                    </div>

                    {/* Proof link + timestamp */}
                    {problem.status === "solved" ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-emerald-600">
                          {new Date(problem.solved_at!).toLocaleDateString()}
                        </span>
                        <a href={problem.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                          View ↗
                        </a>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Verified ✓</span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#9CA3AF] shrink-0">Not solved</span>
                    )}
                  </div>
                ))
              ) : (
                /* Fallback for old roadmaps without problem map */
                <div className="bg-white border border-dashed border-[#D1D5DB] rounded-lg p-4">
                  <p className="text-sm text-[#6B7280]">{currentWeekData.dsa.label || "DSA problems"}</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Tag: {currentWeekData.dsa.lcTag} · {currentWeekData.dsa.count} problems</p>
                  <p className="text-xs text-amber-500 mt-2">⚠ Regenerate roadmap to get specific problem assignments with verified tracking</p>
                </div>
              )}
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
              {currentWeekData.resources.map((r: { name: string; url: string; type: string }) => (
                <a key={r.name} href={r.url} className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                  <div className="flex items-center gap-3">
                    <ResourceIcon type={r.type} />
                    <span className="text-sm text-[#374151]">{r.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#9CA3AF]" />
                </a>
              ))}
            </div>

            {/* PROJECT TASK — Read-only server status */}
            <p className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-3">Project Task</p>
            <div className={`w-full text-left border rounded-lg p-4 mb-6 ${
              currentWeekData.projectTask.done
                ? "bg-emerald-50 border-emerald-200"
                : "border-[#E5E7EB]"
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                  currentWeekData.projectTask.done
                    ? "bg-emerald-500"
                    : "border-2 border-gray-300"
                }`}>
                  {currentWeekData.projectTask.done && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    currentWeekData.projectTask.done ? "line-through text-gray-400" : "text-[#111827]"
                  }`}>{currentWeekData.projectTask.name} <span className="bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5 ml-1">+{currentWeekData.projectTask.impact}%</span></p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-amber-100 text-amber-700 text-xs rounded-full px-2 py-0.5">{currentWeekData.projectTask.effort}</span>
                    <span className="text-xs text-[#9CA3AF]">· {currentWeekData.projectTask.hours} hrs</span>
                    {currentWeekData.projectTask.done && <span className="text-xs font-bold text-emerald-600">✓ Verified by GitHub</span>}
                    {!currentWeekData.projectTask.done && <span className="text-xs text-gray-400">Detected via GitHub sync</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* MILESTONE */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-sm font-medium text-[#374151]">{currentWeekData.milestone}</p>
              </div>
              {currentWeekData.progressPercent >= 70 ? (
                <span className="bg-emerald-500 text-white text-xs font-bold rounded-full px-3 py-1">🎉 Week Complete!</span>
              ) : (
                <span className="text-xs text-[#9CA3AF]">{currentWeekData.progressPercent}% — complete tasks to unlock</span>
              )}
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

        {/* ═══ SECTION 4 — TASK BOARD (Compact) ═══ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#111827]">Task Board</h2>
            <span className="text-sm text-[#9CA3AF]">Sorted by impact</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* TO DO */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">To Do</h3>
                <span className="bg-gray-100 text-gray-600 rounded-full px-2 text-xs font-bold">{kanbanTasks.todo.length}</span>
              </div>
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {kanbanTasks.todo.map((t: { id?: string; title: string; impact: number; difficulty: string; duration: string; description: string }) => (
                  <div key={t.title} className="rounded-lg border border-[#E5E7EB] p-3 bg-white hover:border-[#A7F3D0] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${t.difficulty === "Hard" ? "bg-red-100 text-red-700" : t.difficulty === "Medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{t.difficulty}</span>
                        <span className="text-[11px] text-[#9CA3AF]">{t.duration}</span>
                      </div>
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full px-1.5 py-0.5">+{t.impact}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#111827] truncate pr-2">{t.title}</p>
                      <button onClick={() => t.id && handleTaskStatusChange(t.id, "in_progress")} className="text-xs font-semibold text-[#10B981] hover:underline shrink-0">Start →</button>
                    </div>
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
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {kanbanTasks.inProgress.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                    <Clock className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-[#9CA3AF]">Click &quot;Start →&quot; on a todo task</p>
                  </div>
                ) : (
                  kanbanTasks.inProgress.map((t: { id?: string; title: string; impact: number; progress: number }) => (
                    <div key={t.title} className="rounded-lg border-2 border-emerald-300 p-3 bg-white">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-[#111827] truncate pr-2">{t.title}</p>
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full px-1.5 py-0.5 shrink-0">+{t.impact}%</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 rounded-full bg-[#F3F4F6]">
                          <div className="h-full rounded-full bg-[#10B981] transition-all" style={{ width: `${t.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-[#6B7280] w-8 text-right">{t.progress}%</span>
                      </div>
                      <button onClick={() => (t as { id?: string }).id && handleTaskStatusChange((t as { id?: string }).id!, "done")} className="text-xs font-semibold text-emerald-600 hover:underline">Mark Done ✓</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DONE */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Done</h3>
                <span className="bg-emerald-100 text-emerald-600 rounded-full px-2 text-xs font-bold">{kanbanTasks.done.length}</span>
              </div>
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {kanbanTasks.done.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                    <CheckCircle2 className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-[#9CA3AF]">Completed tasks appear here</p>
                  </div>
                ) : (
                  kanbanTasks.done.map((t: string) => (
                    <div key={t} className="rounded-lg border border-emerald-200 p-3 bg-emerald-50 flex items-center justify-between">
                      <span className="text-sm text-[#6B7280] truncate pr-2">{t}</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 5 — PROGRESS ANALYTICS (2-col layout) ═══ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#111827]">Progress Analytics</h2>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-[2fr_1fr]">
            {/* Left: Charts stacked vertically */}
            <div className="space-y-4">
              {/* Score Over Time */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Match Score Over Time</h3>
                {chartScoreHistory.length > 0 ? (
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
                ) : (
                  <div className="flex flex-col items-center justify-center h-[220px] text-center">
                    <TrendingUp className="h-8 w-8 text-gray-200 mb-2" />
                    <p className="text-sm font-medium text-[#9CA3AF]">No score data yet</p>
                    <p className="text-xs text-[#D1D5DB] mt-1">Complete tasks and sync your profiles to track progress</p>
                  </div>
                )}
              </div>

              {/* Problems Per Week */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">Problems Per Week</h3>
                {(() => {
                  const barData = weeks.slice(0, 8).map((w, i) => ({ week: `W${i + 1}`, count: w.dsa.countDone || 0 }));
                  const hasData = barData.some((d) => d.count > 0);
                  return hasData ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="week" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#E5E7EB" }} />
                        <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#E5E7EB" }} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} />
                        <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[220px] text-center">
                      <BarChart3 className="h-8 w-8 text-gray-200 mb-2" />
                      <p className="text-sm font-medium text-[#9CA3AF]">No problems solved yet</p>
                      <p className="text-xs text-[#D1D5DB] mt-1">Start solving DSA problems to see weekly stats</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right: Skill Progress (constrained scroll) */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#111827] mb-4">Skill Progress</h3>
              {skillProgress.length > 0 ? (
                <div className="relative">
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 pb-2">
                    {skillProgress.map((s) => (
                      <div key={s.skill}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#6B7280]">{s.skill}</span>
                          <span className="text-xs font-bold" style={{ color: skillBarColor(s.progress) }}>{s.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#F3F4F6]">
                          <div className="h-full rounded-full transition-all" style={{ width: `${s.progress}%`, backgroundColor: skillBarColor(s.progress) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {skillProgress.length > 10 && (
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-xl" />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <Target className="h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-sm font-medium text-[#9CA3AF]">No skills tracked yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Actions section removed — redundant with Task Board */}

      </div>

      {/* ═══ FLOATING ASK COACH BUTTON ═══ */}
      <Link href="/coach" className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-5 py-3 text-sm font-medium shadow-lg flex items-center gap-2 z-50 transition-colors">
        <MessageCircle className="h-4 w-4" /> Ask Coach
      </Link>
    </DashboardLayout>
  );
}
