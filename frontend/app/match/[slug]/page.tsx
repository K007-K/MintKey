// Match Score Report page — premium analytics report view
"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { CompanyLogoIcon } from "@/components/ui/CompanyLogos";
import {
  Home, ChevronRight, Clock, Download, Sparkles, Info,
  Code2, Layers, Settings, GraduationCap, Briefcase, TrendingUp,
  Brain, GitBranch, BarChart3, BookOpen, Users, Trophy,
  XCircle, CheckCircle2, AlertCircle, Zap, ShieldAlert, Flame,
  SlidersHorizontal, Loader2
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import { useMatchScores, useScoreHistory, useSkillGaps, useCompany, usePlatformStats } from "@/lib/api";

/* ─── Types ─── */
type MatchReportData = {
  name: string; role: string; matchScore: number;
  status: "Strong" | "Good" | "Needs Work" | "Critical";
  weeksToReadiness: number; targetScore: number; gapToClose: number;
  problemsToSolve: number; lastUpdated: string;
  breakdown: { component: string; icon: string; yourScore: number; target: number; gap: number; tooltip: string }[];
  radarData: { axis: string; user: number; target: number }[];
  dsaAnalysis: {
    total: { solved: number; required: number };
    easy: { solved: number; required: number };
    medium: { solved: number; required: number };
    hard: { solved: number; required: number };
    topics: { name: string; solved: number; required: number; gap: number }[];
  };
  topActions: { title: string; desc: string; impact: number; weeks: string; iconColor: string; effort: "Low" | "Medium" | "High"; roi: "Low" | "Medium" | "High" | "Very High" }[];
  scoreHistory: { month: string; score: number | null; projected: number | null; target: number }[];
  targetScoreLine: number;
  whyScore: { strong: string[]; weak: string[] };
  simulator: { scenarios: { label: string; action: string; currentScore: number; newScore: number }[] };
};

/* ─── Weight key → display label / icon mapping ─── */
// Keys match backend scoring_weights DB columns AND scoring engine component_scores
const WEIGHT_MAP: Record<string, { label: string; icon: string; tooltip: string; targetPct: number }> = {
  dsa_score:            { label: "DSA",          icon: "code",        tooltip: "Data structures & algorithms proficiency",       targetPct: 90 },
  dsa:                  { label: "DSA",          icon: "code",        tooltip: "Data structures & algorithms proficiency",       targetPct: 90 },
  project_score:        { label: "Projects",     icon: "layers",      tooltip: "Quality and depth of portfolio projects",        targetPct: 85 },
  projects:             { label: "Projects",     icon: "layers",      tooltip: "Quality and depth of portfolio projects",        targetPct: 85 },
  system_design_score:  { label: "System Design",icon: "settings",    tooltip: "System design knowledge and practical experience",targetPct: 85 },
  system_design:        { label: "System Design",icon: "settings",    tooltip: "System design knowledge and practical experience",targetPct: 85 },
  stack_alignment:      { label: "Tech Stack",   icon: "settings",    tooltip: "Alignment of your tech stack with company needs", targetPct: 85 },
  stack:                { label: "Tech Stack",   icon: "settings",    tooltip: "Alignment of your tech stack with company needs", targetPct: 85 },
  academic_score:       { label: "Academics",    icon: "graduation",  tooltip: "Academic background and GPA alignment",          targetPct: 80 },
  academic:             { label: "Academics",    icon: "graduation",  tooltip: "Academic background and GPA alignment",          targetPct: 80 },
  internship_score:     { label: "Internships",  icon: "briefcase",   tooltip: "Relevant work experience quality",               targetPct: 85 },
  internship:           { label: "Internships",  icon: "briefcase",   tooltip: "Relevant work experience quality",               targetPct: 85 },
  consistency_index:    { label: "Consistency",  icon: "trending-up", tooltip: "Regular problem-solving and code commits",       targetPct: 90 },
  consistency:          { label: "Consistency",  icon: "trending-up", tooltip: "Regular problem-solving and code commits",       targetPct: 90 },
};

/* Map from long key to short backend key for componentScores lookup */
const KEY_TO_BACKEND: Record<string, string> = {
  dsa_score: "dsa", dsa: "dsa",
  project_score: "projects", projects: "projects",
  system_design_score: "system_design", system_design: "system_design",
  stack_alignment: "stack", stack: "stack",
  academic_score: "academic", academic: "academic",
  internship_score: "internship", internship: "internship",
  consistency_index: "consistency", consistency: "consistency",
};

const ACTION_COLORS = ["red", "amber", "blue", "purple", "green", "orange"];

/* ─── Build match report from real company data ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMatchReport(company: Record<string, any> | null, userScores: any[] | null, slug: string, platformStats?: any): MatchReportData {
  // Company data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hiring = (company?.hiring_data || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsa = (company?.dsa_requirements || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weights = (company?.scoring_weights || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sysDesign = (company?.system_design || {}) as any;

  const companyName = (company?.name as string) || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Company");
  const roles = hiring.roles || [];
  const role = roles[0] || "Software Engineer";

  // Total required problems from DSA config
  const minProblems = dsa.minimum_problems || {};
  const totalRequired = minProblems.total || 300;
  const diffDist = dsa.difficulty_distribution || {};

  // Score from user data (if available)
  let matchScore = 0;
  let statusLabel: MatchReportData["status"] = "Needs Work";
  let weeksAway = 12;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let componentScores: Record<string, number> = {};
  let hasRealScores = false;
  let computedAt: string | null = null;

  if (userScores && Array.isArray(userScores)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = userScores.find((s: any) => s.company_slug === slug);
    if (match) {
      hasRealScores = true;
      matchScore = Math.round(Number(match.overall_score) || 0);
      statusLabel = match.status_label || (matchScore >= 85 ? "Strong" : matchScore >= 70 ? "Good" : matchScore >= 50 ? "Needs Work" : "Critical");
      weeksAway = match.weeks_away ?? Math.max(2, Math.round((85 - matchScore) / 3));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bd = (match.breakdown as any) || {};
      // Backend may store flat dict ({dsa: 50, stack: 68}) or nested ({component_scores: {...}})
      componentScores = bd.component_scores || bd;
      computedAt = match.computed_at || null;
    }
  }

  // Build component breakdown from scoring_weights
  const weightEntries = Object.entries(weights).filter(([k]) => WEIGHT_MAP[k]);
  const breakdown = weightEntries.map(([key, weightVal]) => {
    const w = WEIGHT_MAP[key];
    const weight = Number(weightVal) || 0;
    const backendKey = KEY_TO_BACKEND[key] || key;
    const userScore = hasRealScores ? Math.round(componentScores[backendKey] || componentScores[key] || 0) : 0;
    // Target proportional to how important this component is
    const target = w.targetPct;
    return {
      component: w.label,
      icon: w.icon,
      yourScore: userScore,
      target,
      gap: userScore - target,
      tooltip: `${w.tooltip} (weight: ${Math.round(weight * 100)}%)`,
    };
  });

  // If no scoring_weights in DB, provide defaults
  if (breakdown.length === 0) {
    const defaults = [
      { component: "DSA", icon: "code", yourScore: 0, target: 90, gap: -90, tooltip: "Data structures & algorithms" },
      { component: "Projects", icon: "layers", yourScore: 0, target: 85, gap: -85, tooltip: "Portfolio project quality" },
      { component: "Tech Stack", icon: "settings", yourScore: 0, target: 85, gap: -85, tooltip: "Tech stack alignment" },
      { component: "Academics", icon: "graduation", yourScore: 0, target: 80, gap: -80, tooltip: "Academic background" },
      { component: "Internships", icon: "briefcase", yourScore: 0, target: 85, gap: -85, tooltip: "Work experience" },
      { component: "Consistency", icon: "trending-up", yourScore: 0, target: 90, gap: -90, tooltip: "Coding consistency" },
    ];
    breakdown.push(...defaults);
  }

  // Radar data from breakdown
  const radarData = breakdown.map((b) => ({ axis: b.component, user: b.yourScore, target: b.target }));

  // Real LeetCode data from platform stats
  const lc = platformStats?.leetcode || {};
  const userTotalSolved = lc.total_solved || 0;
  const userDiffDist = lc.difficulty_distribution || {};
  const userEasySolved = userDiffDist.Easy || userDiffDist.easy || 0;
  const userMediumSolved = userDiffDist.Medium || userDiffDist.medium || 0;
  const userHardSolved = userDiffDist.Hard || userDiffDist.hard || 0;
  const topicWeakness: Record<string, string> = lc.topic_weakness_map || {};
  // Real per-topic solved counts from LeetCode API (exact numbers)
  const topicSolvedCounts: Record<string, number> = lc.topic_solved_counts || {};

  // DSA Analysis: build from dsa_requirements topic_targets
  const topicTargets = dsa.topic_targets || {};
  const topics = Object.entries(topicTargets).map(([key, val]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = val as any;
    const label = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    const required = t.recommended || t.minimum || 30;
    // Look up user's actual solved count from LeetCode topic data
    // Try multiple key formats: exact label, original key, various casings
    const solved = topicSolvedCounts[label]
      || topicSolvedCounts[key]
      || topicSolvedCounts[label.replace(/ /g, "")]
      || topicSolvedCounts[key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())]
      || (() => {
        // Fuzzy match: find a key in topicSolvedCounts that contains this topic name
        const lowerLabel = label.toLowerCase();
        for (const [k, v] of Object.entries(topicSolvedCounts)) {
          if (k.toLowerCase() === lowerLabel || k.toLowerCase().includes(lowerLabel) || lowerLabel.includes(k.toLowerCase())) {
            return v;
          }
        }
        // Fallback to weakness map approximation if no exact count available
        const strength = topicWeakness[label] || topicWeakness[key] || "";
        return strength === "strong" ? Math.round(required * 0.9) : strength === "medium" ? Math.round(required * 0.5) : strength === "weak" ? Math.round(required * 0.2) : 0;
      })();
    return { name: label, solved, required, gap: solved - required };
  }).sort((a, b) => a.gap - b.gap).slice(0, 8);

  // Difficulty breakdown — use exact per-difficulty targets from DB if available, else fallback to percentages
  const easyReq = minProblems.easy || Math.round(totalRequired * (diffDist.easy_pct || 30) / 100);
  const medReq = minProblems.medium || Math.round(totalRequired * (diffDist.medium_pct || 50) / 100);
  const hardReq = minProblems.hard || Math.round(totalRequired * (diffDist.hard_pct || 20) / 100);

  const dsaAnalysis = {
    total: { solved: userTotalSolved, required: totalRequired },
    easy: { solved: userEasySolved, required: easyReq },
    medium: { solved: userMediumSolved, required: medReq },
    hard: { solved: userHardSolved, required: hardReq },
    topics,
  };

  // Top Actions: derived from scoring weights — prioritize highest weight components
  const sortedWeights = weightEntries
    .map(([key, w]) => ({ key, label: WEIGHT_MAP[key]?.label || key, weight: Number(w) || 0 }))
    .sort((a, b) => b.weight - a.weight);

  const actionTemplates: Record<string, { title: string; desc: string; weeks: string; effort: "Low" | "Medium" | "High"; roi: "Low" | "Medium" | "High" | "Very High" }> = {
    dsa_score: { title: "Master DSA Fundamentals", desc: `Solve ${totalRequired} problems focusing on company-specific patterns.`, weeks: "4-6 weeks", effort: "High", roi: "Very High" },
    project_score: { title: "Build Portfolio Projects", desc: "Create production-quality projects demonstrating system design skills.", weeks: "3-4 weeks", effort: "Medium", roi: "High" },
    system_design_score: { title: "Learn System Design", desc: `Study ${(sysDesign.must_know_designs || []).slice(0, 3).join(", ") || "distributed systems"}.`, weeks: "2-3 weeks", effort: "Medium", roi: "High" },
    stack_alignment: { title: "Align Tech Stack", desc: "Build projects using company's preferred technologies.", weeks: "2-3 weeks", effort: "Medium", roi: "Medium" },
    academic_score: { title: "Strengthen Fundamentals", desc: "Review CS fundamentals: OS, DBMS, Networking concepts.", weeks: "1-2 weeks", effort: "Low", roi: "Medium" },
    internship_score: { title: "Gain Experience", desc: "Seek internships or contribute to open-source projects.", weeks: "4-8 weeks", effort: "High", roi: "High" },
    consistency_index: { title: "Build Consistency", desc: "Maintain daily solving streaks and regular GitHub commits.", weeks: "Ongoing", effort: "Low", roi: "High" },
  };

  const topActions = sortedWeights.slice(0, 6).map((sw, i) => {
    const tmpl = actionTemplates[sw.key] || { title: `Improve ${sw.label}`, desc: `Focus on improving your ${sw.label.toLowerCase()} score.`, weeks: "2-4 weeks", effort: "Medium" as const, roi: "Medium" as const };
    const impact = Math.round(sw.weight * 20);
    return {
      ...tmpl,
      impact,
      iconColor: ACTION_COLORS[i % ACTION_COLORS.length],
    };
  });

  // Why Score: build from breakdown
  const strongAreas = breakdown.filter(b => b.yourScore >= b.target || b.gap >= -5).map(b => 
    hasRealScores ? `${b.component} meets the expected benchmark for ${companyName}` : `${b.component} target: ${b.target}% (${Math.round(Number(weights[Object.keys(WEIGHT_MAP).find(k => WEIGHT_MAP[k].label === b.component) || ""] || 0) * 100)}% weight)`
  );
  const weakAreas = breakdown.filter(b => b.gap < -5).map(b => 
    hasRealScores ? `${b.component} gap: ${b.yourScore}% vs ${b.target}% target (${Math.abs(b.gap)}% behind)` : `${b.component} requires ${b.target}% — needs focused preparation`
  );

  // Score Simulator: based on actual scoring weights
  const simScenarios = sortedWeights.slice(0, 3).map((sw) => {
    const boost = Math.round((sw.weight || 0) * 15);
    return {
      label: `Improve ${sw.label} by 15%`,
      action: `+15% ${sw.label}`,
      currentScore: matchScore,
      newScore: Math.min(100, matchScore + boost),
    };
  });
  // Add combined scenario
  const totalBoost = simScenarios.reduce((sum, s) => sum + (s.newScore - s.currentScore), 0);
  simScenarios.push({
    label: "Do all 3 actions above",
    action: "all 3 combined",
    currentScore: matchScore,
    newScore: Math.min(100, matchScore + totalBoost),
  });

  // Quick stats
  const targetScore = 85;
  const gapToClose = Math.max(0, targetScore - matchScore);
  const problemsToSolve = Math.max(0, totalRequired - userTotalSolved);

  return {
    name: companyName,
    role,
    matchScore,
    status: statusLabel,
    weeksToReadiness: weeksAway,
    targetScore,
    gapToClose,
    problemsToSolve,
    lastUpdated: (() => {
      if (!hasRealScores) return "Not analyzed yet";
      if (!computedAt) return "Just now";
      const diff = Date.now() - new Date(computedAt).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    })(),
    breakdown,
    radarData,
    dsaAnalysis,
    topActions,
    scoreHistory: [],
    targetScoreLine: targetScore,
    whyScore: {
      strong: strongAreas.length > 0 ? strongAreas : ["Run analysis to see your strengths"],
      weak: weakAreas.length > 0 ? weakAreas : ["Run analysis to identify gaps"],
    },
    simulator: { scenarios: simScenarios },
  };
}

/* ─── Icon helpers ─── */
function ComponentIcon({ type }: { type: string }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "code": return <Code2 className={cls} />;
    case "layers": return <Layers className={cls} />;
    case "settings": return <Settings className={cls} />;
    case "graduation": return <GraduationCap className={cls} />;
    case "briefcase": return <Briefcase className={cls} />;
    case "trending-up": return <TrendingUp className={cls} />;
    default: return <Code2 className={cls} />;
  }
}

function ActionIcon({ color }: { color: string }) {
  const cls = "h-5 w-5";
  const iconMap: Record<string, React.ReactNode> = {
    red: <Brain className={cls} style={{ color: "#EF4444" }} />,
    amber: <GitBranch className={cls} style={{ color: "#F59E0B" }} />,
    blue: <BarChart3 className={cls} style={{ color: "#3B82F6" }} />,
    purple: <BookOpen className={cls} style={{ color: "#8B5CF6" }} />,
    green: <Users className={cls} style={{ color: "#10B981" }} />,
    orange: <Trophy className={cls} style={{ color: "#F97316" }} />,
  };
  return <>{iconMap[color] || null}</>;
}

const iconBg: Record<string, string> = {
  red: "bg-red-50", amber: "bg-amber-50", blue: "bg-blue-50",
  purple: "bg-purple-50", green: "bg-green-50", orange: "bg-orange-50",
};

/* ─── Gap badge helpers ─── */
function gapBadgeStyle(gap: number) {
  if (gap === 0) return "bg-green-100 text-green-600";
  if (gap >= -5) return "bg-emerald-100 text-emerald-600";
  if (gap >= -15) return "bg-amber-100 text-amber-600";
  return "bg-red-100 text-red-600";
}

function topicBarColor(gap: number) {
  if (gap >= -5) return "#10B981";
  if (gap >= -15) return "#F59E0B";
  return "#EF4444";
}

function topicGapColor(gap: number) {
  if (gap >= -9) return "text-[#10B981]";
  if (gap >= -19) return "text-[#F59E0B]";
  return "text-[#EF4444]";
}

function effortBadge(effort: string) {
  if (effort === "Low") return "bg-green-50 text-green-700";
  if (effort === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function roiBadge(roi: string) {
  if (roi === "Very High") return "bg-emerald-50 text-emerald-700";
  if (roi === "High") return "bg-green-50 text-green-700";
  if (roi === "Medium") return "bg-amber-50 text-amber-700";
  return "bg-gray-50 text-gray-600";
}

/* ─── Tooltip component ─── */
function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <Info
        className="h-3.5 w-3.5 text-[#9CA3AF] cursor-help hover:text-[#6B7280] transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#111827] text-white text-xs rounded-lg whitespace-nowrap z-50 shadow-lg">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#111827]" />
        </span>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function MatchReportPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { data: rawScores, isLoading: scoresLoading } = useMatchScores();
  const { data: rawHistory } = useScoreHistory(slug || "");
  const { data: rawGaps } = useSkillGaps(slug || "");
  const { data: rawCompany } = useCompany(slug || "");
  const { data: rawPlatformStats } = usePlatformStats();

  // Build page data from company API + user scores
  const data = useMemo((): MatchReportData => {
    const report = buildMatchReport(
      rawCompany as Record<string, unknown> | null,
      rawScores as unknown[] | null,
      slug || "",
      rawPlatformStats
    );

    // Build score history from real analysis runs only
    if (rawHistory && Array.isArray(rawHistory) && rawHistory.length > 0) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      report.scoreHistory = (rawHistory as { overall_score: number; computed_at: string }[]).map((h: { overall_score: number; computed_at: string }, i: number) => ({
        month: months[new Date(h.computed_at).getMonth()] || `M${i}`,
        score: Math.round(Number(h.overall_score) || 0),
        projected: null,
        target: report.targetScoreLine ?? 85,
      }));
    }

    return report;
  }, [slug, rawScores, rawHistory, rawGaps, rawCompany, rawPlatformStats]);

  const [timeFilter, setTimeFilter] = useState<"1M" | "3M" | "6M" | "1Y">("3M");
  const [activeScenario, setActiveScenario] = useState<number | null>(null);

  // Loading state
  if (scoresLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
          <span className="ml-3 text-sm text-[#6B7280]">Loading match report...</span>
        </div>
      </DashboardLayout>
    );
  }

  /* Time filter slicing — projected data starts at month 0 (current) */
  const filterMap = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 };
  const months = filterMap[timeFilter];
  const filteredHistory = data.scoreHistory.slice(0, months + 1);

  /* Status badge colors */
  const statusColors: Record<string, string> = {
    "Strong": "bg-green-100 text-green-700",
    "Good": "bg-blue-100 text-blue-700",
    "Needs Work": "bg-amber-100 text-amber-700",
    "Critical": "bg-red-100 text-red-700",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">

        {/* ═══ SECTION 1 — BREADCRUMB ═══ */}
        <nav className="flex items-center gap-1.5 text-sm text-[#6B7280]">
          <Link href="/dashboard" className="hover:text-[#10B981] transition-colors flex items-center gap-1">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/companies" className="hover:text-[#10B981] transition-colors">Companies</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/company/${slug}`} className="hover:text-[#10B981] transition-colors">{data.name}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-[#111827]">Match Report</span>
        </nav>

        {/* ═══ SECTION 2 — HERO ═══ */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
          {/* Left — Main card */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
            <div className="flex items-center gap-4 mb-6">
              <CompanyLogoIcon slug={data.name.toLowerCase()} size={48} />
              <div>
                <h1 className="text-xl font-bold text-[#111827]">{data.name} Match Report</h1>
                <p className="text-sm text-[#6B7280]">{data.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl font-bold text-[#111827]">{data.matchScore}</span>
              <span className="text-3xl font-bold text-[#9CA3AF]">%</span>
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[data.status]}`}>{data.status}</span>
            </div>

            <div className="w-full h-3 rounded-full bg-[#F3F4F6] mb-5">
              <div className="h-full rounded-full bg-[#10B981] transition-all duration-1000" style={{ width: `${data.matchScore}%` }} />
            </div>

            {/* ── FIX 1: Score Components Mini-Bars ── */}
            <div className="mb-5 p-4 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Score Components</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {data.breakdown.map((b) => (
                  <div key={b.component} className="flex items-center gap-2">
                    <span className="text-xs text-[#6B7280] w-20 shrink-0">{b.component}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[#E5E7EB]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${b.yourScore}%`,
                          backgroundColor: b.gap === 0 ? "#10B981" : b.gap >= -10 ? "#F59E0B" : "#EF4444",
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#374151] w-8 text-right">{b.yourScore}%</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-[#6B7280] flex items-center gap-1.5 mb-2">
              <Clock className="h-4 w-4 text-[#9CA3AF]" />
              You are about <span className="font-bold text-[#111827]">{data.weeksToReadiness} weeks</span> away from readiness.
            </p>

            <div className="flex gap-3 flex-wrap mt-5">
              <Link href={`/roadmap/${slug}`} className="flex items-center gap-2 rounded-lg bg-[#10B981] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#059669] transition-colors">
                <Sparkles className="h-4 w-4" /> Generate Preparation Roadmap
              </Link>
              <button onClick={() => window.print()} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-5 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                <Download className="h-4 w-4" /> Download Report
              </button>
            </div>
          </div>

          {/* Right — Quick Stats + Why This Score */}
          <div className="space-y-3">
            <div className="rounded-xl border border-[#E5E7EB] border-l-4 border-l-[#10B981] bg-[#ECFDF5] p-4">
              <h3 className="text-xs font-semibold text-[#111827] mb-2">Quick Stats</h3>
              <div className="space-y-0">
                {[
                  { label: "Target Score", value: `${data.targetScore}%`, color: "text-[#111827]" },
                  { label: "Gap to Close", value: `${data.gapToClose}%`, color: "text-[#EF4444] font-bold" },
                  { label: "Problems to Solve", value: `${data.problemsToSolve}`, color: "text-[#111827]" },
                  { label: "Last Updated", value: data.lastUpdated, color: "text-[#9CA3AF] text-xs" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b border-[#A7F3D0] last:border-0">
                    <span className="text-xs text-[#6B7280]">{s.label}</span>
                    <span className={`text-sm font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── FIX 2: Why This Score? ── */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <h3 className="text-xs font-semibold text-[#111827] mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[#10B981]" /> Why your score is {data.matchScore}%
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-1">Strong Areas</p>
                  {data.whyScore.strong.map((s, i) => (
                    <p key={i} className="text-[11px] text-[#6B7280] flex items-start gap-1.5 mb-0.5 leading-tight">
                      <CheckCircle2 className="h-3 w-3 text-[#10B981] mt-0.5 shrink-0" /> {s}
                    </p>
                  ))}
                </div>
                <div className="border-t border-[#F3F4F6] pt-2">
                  <p className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider mb-1">Weak Areas</p>
                  {data.whyScore.weak.map((w, i) => (
                    <p key={i} className="text-[11px] text-[#6B7280] flex items-start gap-1.5 mb-0.5 leading-tight">
                      <AlertCircle className="h-3 w-3 text-[#EF4444] mt-0.5 shrink-0" /> {w}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 3 — PERFORMANCE BREAKDOWN ═══ */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Radar Chart */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <h3 className="text-base font-semibold text-[#111827] mb-4">Performance Breakdown</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={data.radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#E5E7EB" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#6B7280", fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} />
                <Radar name="Target" dataKey="target" stroke="#9CA3AF" fill="#9CA3AF" fillOpacity={0.1} strokeDasharray="5 5" />
                <Radar name="Your Score" dataKey="user" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Score Table with Tooltips */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
            <div className="p-6 pb-0">
              <h3 className="text-base font-semibold text-[#111827] mb-4">Detailed Score Breakdown</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-[#F9FAFB] text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                  <th className="text-left px-6 py-3">Component</th>
                  <th className="text-center px-4 py-3">Your Score</th>
                  <th className="text-center px-4 py-3">Target</th>
                  <th className="text-center px-4 py-3">Gap</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown.map((b) => (
                  <tr key={b.component} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-md bg-[#F3F4F6] p-1.5"><ComponentIcon type={b.icon} /></div>
                        <span className="text-sm font-semibold text-[#111827]">{b.component}</span>
                        <InfoTooltip text={b.tooltip} />
                      </div>
                    </td>
                    <td className="text-center text-sm font-semibold text-[#111827] px-4">{b.yourScore}%</td>
                    <td className="text-center text-sm text-[#6B7280] px-4">{b.target}%</td>
                    <td className="text-center px-4">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${gapBadgeStyle(b.gap)}`}>
                        {b.gap === 0 ? "Met ✓" : `${b.gap}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ SECTION 4 — DSA DEEP ANALYSIS ═══ */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#111827]">DSA Deep Analysis</h3>
            <span className="text-sm text-[#9CA3AF]">Last 90 days</span>
          </div>

          {/* Top row — Total / Easy / Medium */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-4">
            {/* Total */}
            <div className="rounded-xl bg-green-50 border border-green-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#374151]">Total Problems</span>
                <Code2 className="h-4 w-4 text-[#10B981]" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-[#111827]">{data.dsaAnalysis.total.solved}</span>
                <span className="text-xl text-[#9CA3AF]">/ {data.dsaAnalysis.total.required}</span>
              </div>
              <div className="h-2 rounded-full bg-green-100 mb-1.5">
                <div className="h-full rounded-full bg-[#10B981]" style={{ width: `${Math.min(100, (data.dsaAnalysis.total.solved / data.dsaAnalysis.total.required) * 100)}%` }} />
              </div>
              <p className="text-xs text-[#6B7280]">{Math.round((data.dsaAnalysis.total.solved / data.dsaAnalysis.total.required) * 100)}% of target solved</p>
            </div>

            {/* Easy */}
            {(() => {
              const easyPct = data.dsaAnalysis.easy.required > 0 ? Math.min(100, (data.dsaAnalysis.easy.solved / data.dsaAnalysis.easy.required) * 100) : 0;
              const easyExceeded = data.dsaAnalysis.easy.solved >= data.dsaAnalysis.easy.required;
              const easyRemaining = data.dsaAnalysis.easy.required - data.dsaAnalysis.easy.solved;
              return (
                <div className={`rounded-xl p-5 ${easyExceeded ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[#374151]">Easy</span>
                    {easyExceeded ? <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> : <AlertCircle className="h-4 w-4 text-[#F59E0B]" />}
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-[#111827]">{data.dsaAnalysis.easy.solved}</span>
                    <span className="text-xl text-[#9CA3AF]">/ {data.dsaAnalysis.easy.required}</span>
                  </div>
                  <div className={`h-2 rounded-full ${easyExceeded ? 'bg-green-100' : 'bg-amber-100'} mb-1.5`}>
                    <div className={`h-full rounded-full ${easyExceeded ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`} style={{ width: `${easyPct}%` }} />
                  </div>
                  {easyExceeded
                    ? <p className="text-xs text-[#10B981] font-medium">Target exceeded</p>
                    : <p className="text-xs text-[#D97706] font-medium">{easyRemaining} more needed</p>
                  }
                </div>
              );
            })()}

            {/* Medium */}
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#374151]">Medium</span>
                <AlertCircle className="h-4 w-4 text-[#F59E0B]" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-[#111827]">{data.dsaAnalysis.medium.solved}</span>
                <span className="text-xl text-[#9CA3AF]">/ {data.dsaAnalysis.medium.required}</span>
              </div>
              <div className="h-2 rounded-full bg-amber-100 mb-1.5">
                <div className="h-full rounded-full bg-[#F59E0B]" style={{ width: `${(data.dsaAnalysis.medium.solved / data.dsaAnalysis.medium.required) * 100}%` }} />
              </div>
              <p className="text-xs text-[#D97706] font-medium">{data.dsaAnalysis.medium.required - data.dsaAnalysis.medium.solved} more needed</p>
            </div>
          </div>

          {/* Hard — Full-width critical card with STRONGER red indicator */}
          <div className="rounded-xl bg-red-50 border-2 border-red-300 p-6 mb-6 relative overflow-hidden">
            {/* Pulsing critical badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                <ShieldAlert className="h-3.5 w-3.5" /> CRITICAL GAP
              </span>
            </div>
            {/* Red left stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EF4444] rounded-l-xl" />
            <span className="text-sm font-bold text-[#991B1B] block mb-3 pl-2">Hard Problems</span>
            <div className="flex items-baseline gap-2 mb-2 pl-2">
              <span className="text-3xl font-bold text-[#111827]">{data.dsaAnalysis.hard.solved}</span>
              <span className="text-xl text-[#9CA3AF]">/ {data.dsaAnalysis.hard.required}</span>
            </div>
            <div className="h-3 rounded-full bg-red-100 mb-2 ml-2">
              <div className="h-full rounded-full bg-[#EF4444]" style={{ width: `${(data.dsaAnalysis.hard.solved / data.dsaAnalysis.hard.required) * 100}%` }} />
            </div>
            <p className="text-sm text-[#EF4444] font-semibold pl-2 flex items-center gap-1.5">
              <Flame className="h-4 w-4" /> Critical gap: {data.dsaAnalysis.hard.required - data.dsaAnalysis.hard.solved} more needed to hit target
            </p>
          </div>

          {/* Topic Gaps */}
          <h4 className="text-base font-semibold text-[#111827] mb-4">Topic Gaps</h4>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {data.dsaAnalysis.topics.map((t) => (
              <div key={t.name} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-[#111827]">{t.name}</span>
                  <span className={`text-sm font-bold ${topicGapColor(t.gap)}`}>{t.gap}</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-2">{t.solved} / {t.required} problems</p>
                <div className="h-2 rounded-full bg-[#F3F4F6]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(t.solved / t.required) * 100}%`, backgroundColor: topicBarColor(t.gap) }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Actions removed — displayed in roadmap page */}

        {/* ═══ SECTION 5.5 — SCORE SIMULATOR ═══ */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] flex items-center justify-center">
              <SlidersHorizontal className="h-4 w-4 text-[#10B981]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#111827]">Score Simulator</h3>
              <p className="text-xs text-[#9CA3AF]">See how specific actions would improve your match score</p>
            </div>
          </div>

          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {data.simulator.scenarios.map((sc, i) => {
              const isActive = activeScenario === i;
              const delta = sc.newScore - sc.currentScore;
              return (
                <button
                  key={sc.label}
                  onClick={() => setActiveScenario(isActive ? null : i)}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    isActive
                      ? "border-[#10B981] bg-[#ECFDF5] shadow-sm"
                      : "border-[#E5E7EB] bg-white hover:border-[#A7F3D0]"
                  }`}
                >
                  <p className="text-sm font-medium text-[#111827] mb-3">{sc.label}</p>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Current</p>
                      <p className="text-xl font-bold text-[#6B7280]">{sc.currentScore}%</p>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-[#E5E7EB] rounded-full relative">
                        <div className="absolute left-0 top-0 h-full rounded-full bg-[#9CA3AF]" style={{ width: `${sc.currentScore}%` }} />
                        <div className="absolute left-0 top-0 h-full rounded-full bg-[#10B981] transition-all duration-500" style={{ width: isActive ? `${sc.newScore}%` : `${sc.currentScore}%` }} />
                      </div>
                      <span className="text-sm font-bold text-[#10B981]">→</span>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">After</p>
                      <p className={`text-xl font-bold ${isActive ? "text-[#10B981]" : "text-[#374151]"}`}>{sc.newScore}%</p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">+{delta}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ SECTION 6 — SCORE IMPROVEMENT OVER TIME ═══ */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#111827]">Score Improvement Over Time</h3>
            {data.scoreHistory.length > 1 && (
              <div className="flex gap-1.5">
                {(["1M", "3M", "6M", "1Y"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                      timeFilter === f ? "bg-[#10B981] text-white" : "border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {data.scoreHistory.length >= 2 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={filteredHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={{ stroke: "#E5E7EB" }} />
                <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={{ stroke: "#E5E7EB" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} formatter={(value) => (value == null || Number.isNaN(Number(value))) ? "—" : `${value}%`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Line
                  type="monotone" dataKey="target" name={`Target (${data.targetScoreLine}%)`}
                  stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} dot={false} connectNulls
                />
                <Line
                  type="monotone" dataKey="score" name="Your Score"
                  stroke="#10B981" strokeWidth={2} dot={{ r: 5, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }} connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-[#ECFDF5] flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-[#10B981]" />
              </div>
              {data.scoreHistory.length === 1 ? (
                <>
                  <p className="text-sm font-semibold text-[#111827] mb-1">First analysis complete — {data.matchScore}%</p>
                  <p className="text-xs text-[#6B7280] max-w-sm">Run another analysis after improving your skills to see how your score changes over time.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#111827] mb-1">No score history yet</p>
                  <p className="text-xs text-[#6B7280] max-w-sm">Run your first analysis to start tracking your progress over time.</p>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
