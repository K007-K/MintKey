// Roadmap page — AI-powered preparation dashboard
"use client";

import { useState } from "react";
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

import { useCompany } from "@/lib/api";

/* ═══ Types for roadmap data ═══ */
type RoadmapPageData = {
  company: { slug: string; name: string; role: string };
  currentScore: number; targetScore: number; weeksTotal: number; weeksCompleted: number;
  progressPercent: number; streak: number; lastSolved: string; problemsThisWeek: number;
  phases: { id: number; name: string; weeks: string; status: "complete" | "active" | "locked"; progress: number }[];
  weeks: {
    number: number; theme: string; hoursPerDay: number; progressPercent: number;
    dsaProblems: { id: number; name: string; count: number; difficulty: string; status: "done" | "today" | "upcoming" }[];
    dailyPlan: { day: string; task: string; isToday: boolean }[];
    resources: { type: "video" | "link" | "doc"; name: string; url: string }[];
    projectTask: { name: string; impact: number; effort: string; hours: number };
    milestone: string;
  }[];
  scoreSimulator: { task: string; impact: number; selected: boolean }[];
  taskBoard: {
    todo: { title: string; impact: number; effort: string; difficulty: string; duration: string; iconColor: string }[];
    inProgress: { title: string; impact: number; progress: number; difficulty: string; duration: string }[];
    done: string[];
  };
  charts: {
    scoreHistory: { month: string; score: number | null; projected: number | null }[];
    problemsPerWeek: { week: string; count: number }[];
    skillProgress: { skill: string; progress: number }[];
  };
  nextActions: { title: string; desc: string; impact: number; duration: string; iconColor: string }[];
};

const ACTION_COLORS = ["red", "amber", "blue", "purple", "green", "orange"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* ─── Build roadmap from company API data ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRoadmapData(company: Record<string, any> | null, slug: string): RoadmapPageData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hiring = (company?.hiring_data || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsa = (company?.dsa_requirements || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weights = (company?.scoring_weights || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sysDesign = (company?.system_design || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resources = (company?.resources || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const behavioral = (company?.behavioral || {}) as any;

  const companyName = (company?.name as string) || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Company");
  const role = (hiring.roles || [])[0] || "Software Engineer";

  // Extract DSA topics sorted by frequency (most important first)
  const topicTargets = dsa.topic_targets || {};
  const topicEntries = Object.entries(topicTargets)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map(([key, val]: [string, any]) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      frequency: val.frequency_pct || 50,
      minimum: val.minimum || 20,
      recommended: val.recommended || 30,
    }))
    .sort((a, b) => b.frequency - a.frequency);

  const totalRequired = (dsa.minimum_problems?.total) || 300;

  // Real resources from company data
  const dsaResources = (resources.dsa || []).slice(0, 3);
  const sdResources = (resources.system_design || []).slice(0, 3);
  const behResources = (resources.behavioral || []).slice(0, 3);
  const platforms = (resources.platforms || []).slice(0, 3);

  // Build resources for a given section
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function mapResources(resList: any[], fallbackType: "video" | "link" | "doc"): { type: "video" | "link" | "doc"; name: string; url: string }[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return resList.map((r: any) => ({
      type: (r.url?.includes("youtube") || r.url?.includes("video")) ? "video" as const : r.url?.includes("leetcode") ? "link" as const : fallbackType,
      name: r.name || "Resource",
      url: r.url || "#",
    }));
  }

  // System design must-knows
  const mustKnowDesigns = sysDesign.must_know_designs || [];
  const sdRequired = sysDesign.required_at_sde1 || false;

  // Calculate weeks based on DSA weight
  const dsaWeight = Number(weights.dsa_score || 0.3);
  const projWeight = Number(weights.project_score || 0.15);
  const sdWeight = Number(weights.system_design_score || 0.1);
  const totalWeeks = Math.max(8, Math.round(totalRequired / 30)); // ~30 problems/week pace

  // Build phases from scoring weights
  const dsaWeeks = Math.round(totalWeeks * 0.5);
  const projWeeks = Math.round(totalWeeks * 0.25);
  const sdWeeks = sdRequired ? Math.round(totalWeeks * 0.15) : 1;
  const finalWeeks = Math.max(1, totalWeeks - dsaWeeks - projWeeks - sdWeeks);

  const phases = [
    { id: 1, name: "DSA Foundation", weeks: `1-${dsaWeeks}`, status: "active" as const, progress: 0 },
    { id: 2, name: "Projects & Stack", weeks: `${dsaWeeks + 1}-${dsaWeeks + projWeeks}`, status: "locked" as const, progress: 0 },
    { id: 3, name: sdRequired ? "System Design" : "Advanced Topics", weeks: `${dsaWeeks + projWeeks + 1}-${dsaWeeks + projWeeks + sdWeeks}`, status: "locked" as const, progress: 0 },
    { id: 4, name: "Final Prep", weeks: `${totalWeeks - finalWeeks + 1}-${totalWeeks}`, status: "locked" as const, progress: 0 },
  ];

  // Build weekly plans from DSA topics
  const weeks: RoadmapPageData["weeks"] = [];
  let topicIdx = 0;

  for (let w = 1; w <= Math.min(totalWeeks, 12); w++) {
    // Each week covers 1-2 DSA topics
    const weekTopics = topicEntries.slice(topicIdx, topicIdx + 2);
    if (weekTopics.length === 0) break;
    topicIdx = (topicIdx + 2) % topicEntries.length;

    const theme = weekTopics.map(t => t.label).join(" & ");
    const isFirstWeek = w === 1;
    const isFinalWeek = w === totalWeeks;

    // DSA problems for the week
    const dsaProblems = weekTopics.map((t, i) => ({
      id: i + 1,
      name: t.label,
      count: Math.min(10, Math.round(t.recommended / Math.ceil(totalWeeks / 2))),
      difficulty: t.frequency >= 70 ? "Hard" : t.frequency >= 50 ? "Medium" : "Easy",
      status: "upcoming" as const,
    }));

    // Daily plan based on the week topics
    const dailyPlan = DAYS.map((day, dayIdx) => {
      let task = "";
      if (dayIdx < 2) task = `Solve ${weekTopics[0]?.label || "DSA"} problems (pattern practice)`;
      else if (dayIdx < 4) task = weekTopics[1] ? `Solve ${weekTopics[1].label} problems` : `Mixed ${weekTopics[0]?.label || "DSA"} practice`;
      else if (dayIdx === 4) task = "Project work / code review";
      else if (dayIdx === 5) task = "Mock interview / timed practice";
      else task = "Rest & light review";
      return { day, task, isToday: false };
    });

    // Resources: use real URLs from company data
    let weekResources: { type: "video" | "link" | "doc"; name: string; url: string }[];
    if (w <= dsaWeeks) {
      weekResources = mapResources(dsaResources, "link");
    } else if (w <= dsaWeeks + projWeeks) {
      weekResources = mapResources(platforms, "link");
    } else if (w <= dsaWeeks + projWeeks + sdWeeks) {
      weekResources = mapResources(sdResources, "doc");
    } else {
      weekResources = mapResources(behResources, "doc");
    }
    // Fallback if empty
    if (weekResources.length === 0) {
      weekResources = [{ type: "link", name: `${companyName} Prep Resources`, url: "#" }];
    }

    const projectTask = isFirstWeek
      ? { name: "Set up GitHub repo with README", impact: 2, effort: "Low", hours: 2 }
      : isFinalWeek
        ? { name: "Polish portfolio & update resume", impact: 5, effort: "Low", hours: 4 }
        : { name: `Build ${theme.toLowerCase()} feature for portfolio project`, impact: 3, effort: "Medium", hours: 5 };

    weeks.push({
      number: w,
      theme,
      hoursPerDay: w <= 3 ? 4 : 5,
      progressPercent: 0,
      dsaProblems,
      dailyPlan,
      resources: weekResources,
      projectTask,
      milestone: w === dsaWeeks ? "Complete DSA Foundation Phase" : w === totalWeeks ? `Ready for ${companyName} interviews!` : `Complete Week ${w} tasks`,
    });
  }

  // Score simulator from weights
  const weightEntries = Object.entries(weights)
    .filter(([k]) => ["dsa_score", "project_score", "system_design_score", "stack_alignment", "internship_score", "consistency_index"].includes(k))
    .map(([k, v]) => ({ key: k, weight: Number(v) || 0 }))
    .sort((a, b) => b.weight - a.weight);

  const labelMap: Record<string, string> = {
    dsa_score: "Master DSA", project_score: "Build Projects", system_design_score: "System Design",
    stack_alignment: "Align Tech Stack", internship_score: "Get Experience", consistency_index: "Build Consistency",
  };

  const scoreSimulator = weightEntries.slice(0, 6).map((sw, i) => ({
    task: labelMap[sw.key] || sw.key,
    impact: Math.round(sw.weight * 20),
    selected: i < 2,
  }));

  // Task board from DSA topics
  const todoTopics = topicEntries.slice(0, 5);
  const taskBoard = {
    todo: todoTopics.map((t, i) => ({
      title: `Master ${t.label}`,
      impact: Math.round(t.frequency / 10),
      effort: t.frequency >= 70 ? "High" : "Medium",
      difficulty: t.frequency >= 70 ? "Hard" : "Medium",
      duration: `${Math.ceil(t.recommended / 10)} weeks`,
      iconColor: ACTION_COLORS[i % ACTION_COLORS.length],
    })),
    inProgress: [] as { title: string; impact: number; progress: number; difficulty: string; duration: string }[],
    done: [] as string[],
  };

  // Charts — set up empty/target data
  const skillProgress = topicEntries.slice(0, 5).map(t => ({
    skill: t.label,
    progress: 0,
  }));

  const charts = {
    scoreHistory: [] as { month: string; score: number | null; projected: number | null }[],
    problemsPerWeek: weeks.slice(0, 8).map((_, i) => ({ week: `W${i + 1}`, count: 0 })),
    skillProgress,
  };

  // Next actions from weight priorities
  const actionDesc: Record<string, string> = {
    dsa_score: `Focus on ${topicEntries.slice(0, 3).map(t => t.label).join(", ")} — top patterns for ${companyName}.`,
    project_score: "Build production-quality portfolio projects demonstrating full-stack skills.",
    system_design_score: mustKnowDesigns.length > 0
      ? `Study: ${mustKnowDesigns.slice(0, 3).join(", ")}.`
      : "Learn system design fundamentals — load balancers, caching, databases.",
    stack_alignment: "Build projects using the company's preferred technologies.",
    internship_score: "Seek internships or contribute to open-source projects.",
    consistency_index: "Maintain daily solving streaks and regular GitHub commits.",
  };

  const nextActions = weightEntries.slice(0, 3).map((sw, i) => ({
    title: labelMap[sw.key] || sw.key,
    desc: actionDesc[sw.key] || `Improve your ${labelMap[sw.key] || sw.key} score.`,
    impact: Math.round(sw.weight * 20),
    duration: `${Math.ceil(sw.weight * 10)} weeks`,
    iconColor: ACTION_COLORS[i],
  }));

  return {
    company: { slug: slug || "", name: companyName, role },
    currentScore: 0,
    targetScore: 85,
    weeksTotal: totalWeeks,
    weeksCompleted: 0,
    progressPercent: 0,
    streak: 0,
    lastSolved: "Not started",
    problemsThisWeek: 0,
    phases,
    weeks,
    scoreSimulator,
    taskBoard,
    charts,
    nextActions,
  };
}

/* ─── Icon helpers ─── */
const iconBg: Record<string, string> = { red: "bg-red-50", amber: "bg-amber-50", blue: "bg-blue-50", purple: "bg-purple-50", green: "bg-green-50", orange: "bg-orange-50" };
const iconColor: Record<string, string> = { red: "#EF4444", amber: "#F59E0B", blue: "#3B82F6", purple: "#8B5CF6", green: "#10B981", orange: "#F97316" };

function TaskIcon({ color }: { color: string }) {
  const cls = "h-4 w-4";
  const c = iconColor[color] || "#6B7280";
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
  const { data: rawCompany, isLoading } = useCompany(slug || "");

  // Build roadmap from company API data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = buildRoadmapData(rawCompany as Record<string, any> | null, slug || "");

  const companyName = data.company.name;
  const companyRole = data.company.role;

  const [activeWeek, setActiveWeek] = useState(1);
  const [simSelected, setSimSelected] = useState<boolean[]>(data.scoreSimulator.map((s: { selected: boolean }) => s.selected));
  const [chartFilter, setChartFilter] = useState<"1M" | "3M" | "6M" | "1Y">("3M");

  // Safe access to current week data — fallback to first week or a placeholder
  const currentWeekData = data.weeks[activeWeek - 1] || data.weeks[0] || {
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
  const simProjected = data.currentScore + simSelected.reduce((sum, sel, i) => sel ? sum + data.scoreSimulator[i].impact : sum, 0);
  const toggleSim = (i: number) => setSimSelected(prev => { const n = [...prev]; n[i] = !n[i]; return n; });

  // Build cumulative score bars for simulator
  const simBars: { label: string; score: number; delta: number }[] = [];
  let runningScore = data.currentScore;
  simBars.push({ label: "Current Score", score: runningScore, delta: 0 });
  simSelected.forEach((sel, i) => {
    if (sel) {
      const impact = data.scoreSimulator[i].impact;
      runningScore += impact;
      simBars.push({ label: `After ${data.scoreSimulator[i].task}`, score: runningScore, delta: impact });
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">

        {/* ═══ PAGE HEADER ═══ */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">My {companyName} Roadmap</h1>
            <p className="text-sm text-[#6B7280]">{companyRole} · {data.weeksTotal} week plan</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => alert('Roadmap regeneration will be available once the AI agent pipeline is connected.')} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
              <RefreshCw className="h-4 w-4" /> Regenerate Roadmap
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
              <span className="text-2xl font-bold text-[#374151]">{data.currentScore}%</span>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full px-2 py-0.5">Needs Work</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#9CA3AF] mb-1">Target</p>
            <span className="text-2xl font-bold text-[#10B981]">{data.targetScore}%</span>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#9CA3AF] mb-1">Time</p>
            <span className="text-2xl font-bold text-[#111827]">{data.weeksTotal} <span className="text-sm font-normal text-[#9CA3AF]">weeks</span></span>
          </div>
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="text-xs text-[#9CA3AF] mb-1">Progress</p>
            <span className="text-2xl font-bold text-[#111827]">{data.progressPercent}%</span>
          </div>
        </div>

        {/* Streak row */}
        <div className="flex items-center gap-4 text-sm text-[#6B7280]">
          <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-[#F59E0B]" /> <span className="font-semibold text-[#111827]">{data.streak} day streak</span></span>
          <span className="text-[#D1D5DB]">·</span>
          <span>Last solved: <span className="font-medium text-[#111827]">{data.lastSolved}</span></span>
          <span className="text-[#D1D5DB]">·</span>
          <span>Problems this week: <span className="font-medium text-[#111827]">{data.problemsThisWeek}</span></span>
        </div>

        {/* Overall progress bar */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#111827]">Overall Progress</span>
            <span className="text-sm font-bold text-[#10B981]">{data.progressPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-[#F3F4F6]">
            <div className="h-full rounded-full bg-[#10B981] transition-all duration-700" style={{ width: `${data.progressPercent}%` }} />
          </div>
        </div>

        {/* ═══ SECTION 1 — LEARNING PHASES ═══ */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h2 className="text-base font-semibold text-[#111827] mb-5">Learning Phases</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.phases.map((p) => (
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
            {Array.from({ length: data.weeksTotal }, (_, i) => i + 1).map((w) => {
              const isCompleted = w <= data.weeksCompleted;
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
                {data.scoreSimulator.map((s, i) => (
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
                {simProjected >= data.targetScore ? (
                  <div className="bg-emerald-500 text-white rounded-lg px-4 py-2.5 text-sm font-semibold text-center">
                    🎯 Target Achieved! Projected Score: {simProjected}%
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">
                    Projected Score: <span className="font-bold text-[#111827]">{simProjected}%</span> · Gap to target ({data.targetScore}%): <span className="font-bold text-[#EF4444]">{data.targetScore - simProjected}% remaining</span>
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
                <span className="bg-gray-100 text-gray-600 rounded-full px-2 text-xs font-bold">{data.taskBoard.todo.length + 3}</span>
              </div>
              <div className="space-y-3">
                {data.taskBoard.todo.map((t) => (
                  <div key={t.title} className="relative rounded-xl border border-[#E5E7EB] p-4 bg-white">
                    <span className="absolute top-3 right-3 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5">+{t.impact}%</span>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold rounded px-1.5 py-0.5 ${t.difficulty === "Hard" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{t.difficulty}</span>
                      <span className="text-xs text-[#9CA3AF]">{t.duration}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#111827]">{t.title}</p>
                    <button className="text-sm font-medium text-[#10B981] mt-2 hover:underline">Start →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* IN PROGRESS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">In Progress</h3>
                <span className="bg-emerald-100 text-emerald-600 rounded-full px-2 text-xs font-bold">{data.taskBoard.inProgress.length}</span>
              </div>
              <div className="space-y-3">
                {data.taskBoard.inProgress.map((t) => (
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
                <span className="bg-emerald-100 text-emerald-600 rounded-full px-2 text-xs font-bold">{data.taskBoard.done.length + 7}</span>
              </div>
              <div className="space-y-2">
                {data.taskBoard.done.map((t) => (
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
                <LineChart data={data.charts.scoreHistory} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#E5E7EB" }} />
                  <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#E5E7EB" }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Line type="monotone" dataKey={() => data.targetScore} name={`Target (${data.targetScore}%)`} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="score" name="Your Score" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: "#10B981" }} connectNulls />
                  <Line type="monotone" dataKey="projected" name="Projected" stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={1.5} dot={{ r: 2, fill: "#9CA3AF" }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#111827] mb-3">Problems Per Week</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.charts.problemsPerWeek} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
                {data.charts.skillProgress.map((s) => (
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
            {data.nextActions.map((a) => (
              <div key={a.title} className="relative rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#A7F3D0] transition-colors">
                <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5">+{a.impact}%</span>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg[a.iconColor]}`}>
                  <TaskIcon color={a.iconColor} />
                </div>
                <h4 className="text-sm font-semibold text-[#111827] mt-3">{a.title}</h4>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{a.desc}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F3F4F6]">
                  <span className="text-xs text-[#9CA3AF] flex items-center gap-1"><Clock className="h-3 w-3" /> {a.duration}</span>
                  <button className="text-sm font-medium text-[#10B981] hover:underline">Start →</button>
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
