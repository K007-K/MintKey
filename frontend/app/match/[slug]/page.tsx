// Match Score Report page — premium analytics report view
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { CompanyLogoIcon } from "@/components/ui/CompanyLogos";
import {
  Home, ChevronRight, Clock, Download, Sparkles, Info,
  Code2, Layers, Settings, GraduationCap, Briefcase, TrendingUp,
  Brain, GitBranch, BarChart3, BookOpen, Users, Trophy,
  XCircle, CheckCircle2, AlertCircle, Zap, ShieldAlert, Flame,
  SlidersHorizontal
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

/* ─── Static match data ─── */
const MATCH_DATA: Record<string, {
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
  scoreHistory: { month: string; score: number | null; projected: number | null }[];
  targetScoreLine: number;
  whyScore: { strong: string[]; weak: string[] };
  simulator: { scenarios: { label: string; action: string; currentScore: number; newScore: number }[] };
}> = {
  google: {
    name: "Google", role: "Software Development Engineer I (L3)",
    matchScore: 67, status: "Needs Work", weeksToReadiness: 10,
    targetScore: 85, gapToClose: 18, problemsToSolve: 87, lastUpdated: "2 hours ago",
    breakdown: [
      { component: "DSA", icon: "code", yourScore: 75, target: 90, gap: -15, tooltip: "Data structures & algorithms problem-solving proficiency" },
      { component: "Projects", icon: "layers", yourScore: 45, target: 85, gap: -40, tooltip: "Quality and depth of portfolio projects" },
      { component: "Tech Stack", icon: "settings", yourScore: 70, target: 85, gap: -15, tooltip: "Alignment of your tech stack with company requirements" },
      { component: "Academics", icon: "graduation", yourScore: 80, target: 80, gap: 0, tooltip: "Academic background and GPA alignment" },
      { component: "Internships", icon: "briefcase", yourScore: 65, target: 85, gap: -20, tooltip: "Relevant work experience and internship quality" },
      { component: "Consistency", icon: "trending-up", yourScore: 85, target: 90, gap: -5, tooltip: "How regularly you solve problems and commit code" },
    ],
    radarData: [
      { axis: "Projects", user: 45, target: 85 },
      { axis: "DSA", user: 75, target: 90 },
      { axis: "Consistency", user: 85, target: 90 },
      { axis: "Internships", user: 65, target: 85 },
      { axis: "Academics", user: 80, target: 80 },
      { axis: "Tech Stack", user: 70, target: 85 },
    ],
    dsaAnalysis: {
      total: { solved: 342, required: 450 },
      easy: { solved: 156, required: 150 },
      medium: { solved: 142, required: 200 },
      hard: { solved: 44, required: 100 },
      topics: [
        { name: "Dynamic Programming", solved: 28, required: 60, gap: -32 },
        { name: "Graphs", solved: 45, required: 65, gap: -20 },
        { name: "Trees", solved: 52, required: 60, gap: -8 },
        { name: "Heaps & Priority Queues", solved: 18, required: 40, gap: -22 },
        { name: "Backtracking", solved: 22, required: 35, gap: -13 },
        { name: "Sliding Window", solved: 38, required: 40, gap: -2 },
      ],
    },
    topActions: [
      { title: "Master Dynamic Programming", desc: "Complete 32 DP problems focusing on patterns like Knapsack, LIS, and LCS.", impact: 12, weeks: "3-4 weeks", iconColor: "red", effort: "High", roi: "Very High" },
      { title: "Build System Design Project", desc: "Create a distributed system project (e.g., URL shortener or chat app).", impact: 10, weeks: "2-3 weeks", iconColor: "amber", effort: "Medium", roi: "High" },
      { title: "Strengthen Graph Algorithms", desc: "Focus on advanced graph problems: Dijkstra, Bellman-Ford, Floyd-Warshall.", impact: 8, weeks: "2 weeks", iconColor: "blue", effort: "Medium", roi: "High" },
      { title: "Complete Hard Problems", desc: "Solve 56 more Hard-level problems across all topics to meet target.", impact: 6, weeks: "4-5 weeks", iconColor: "purple", effort: "High", roi: "Medium" },
      { title: "Mock Interview Practice", desc: "Complete 8 mock interviews focusing on communication and problem-solving.", impact: 5, weeks: "4 weeks", iconColor: "green", effort: "Low", roi: "High" },
      { title: "Participate in Contests", desc: "Join 6 weekly contests to improve speed and accuracy under pressure.", impact: 4, weeks: "6 weeks", iconColor: "orange", effort: "Low", roi: "Medium" },
    ],
    scoreHistory: [
      { month: "Jan", score: 42, projected: null },
      { month: "Feb", score: 45, projected: null },
      { month: "Mar", score: 48, projected: null },
      { month: "Apr", score: 52, projected: null },
      { month: "May", score: 55, projected: null },
      { month: "Jun", score: 60, projected: null },
      { month: "Jul", score: 63, projected: null },
      { month: "Aug", score: 65, projected: null },
      { month: "Sep", score: 65, projected: 65 },
      { month: "Oct", score: null, projected: 68 },
      { month: "Nov", score: null, projected: 73 },
      { month: "Dec", score: null, projected: 78 },
    ],
    targetScoreLine: 85,
    whyScore: {
      strong: [
        "Academics meet the expected benchmark for Google L3",
        "Coding consistency is strong — regular commits and problem-solving",
        "DSA fundamentals are above average for Easy & Medium problems",
      ],
      weak: [
        "Project depth significantly below industry expectation (45% vs 85%)",
        "Hard problem count critically lower than target (44/100)",
        "Limited system design exposure — needs immediate attention",
        "Internship experience gap — fewer relevant tech internships",
      ],
    },
    simulator: {
      scenarios: [
        { label: "Solve 50 more DSA problems", action: "50 more problems", currentScore: 67, newScore: 74 },
        { label: "Build 1 backend project", action: "1 backend project", currentScore: 67, newScore: 78 },
        { label: "Complete 20 Hard problems", action: "20 Hard problems", currentScore: 67, newScore: 72 },
        { label: "Do all 3 actions above", action: "all 3 combined", currentScore: 67, newScore: 85 },
      ],
    },
  },
};

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
  const data = MATCH_DATA[slug || "google"] || MATCH_DATA.google;
  const [timeFilter, setTimeFilter] = useState<"1M" | "3M" | "6M" | "1Y">("3M");
  const [activeScenario, setActiveScenario] = useState<number | null>(null);

  /* Time filter slicing */
  const filterMap = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 };
  const months = filterMap[timeFilter];
  const currentMonthIdx = 8;
  const startIdx = Math.max(0, currentMonthIdx - months + 1);
  const filteredHistory = data.scoreHistory.slice(startIdx, startIdx + months + 3).slice(0, 12);

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
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
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
              <button className="flex items-center gap-2 rounded-lg bg-[#10B981] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#059669] transition-colors">
                <Sparkles className="h-4 w-4" /> Generate Preparation Roadmap
              </button>
              <button className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-5 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                <Download className="h-4 w-4" /> Download Report
              </button>
            </div>
          </div>

          {/* Right — Quick Stats + Why This Score */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[#E5E7EB] border-l-4 border-l-[#10B981] bg-[#ECFDF5] p-5">
              <h3 className="text-sm font-semibold text-[#111827] mb-4">Quick Stats</h3>
              <div className="space-y-0">
                {[
                  { label: "Target Score", value: `${data.targetScore}%`, color: "text-[#111827]" },
                  { label: "Gap to Close", value: `${data.gapToClose}%`, color: "text-[#EF4444] font-bold" },
                  { label: "Problems to Solve", value: `${data.problemsToSolve}`, color: "text-[#111827]" },
                  { label: "Last Updated", value: data.lastUpdated, color: "text-[#9CA3AF] text-sm" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between py-3 border-b border-[#A7F3D0] last:border-0">
                    <span className="text-sm text-[#6B7280]">{s.label}</span>
                    <span className={`font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── FIX 2: Why This Score? ── */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#10B981]" /> Why your score is {data.matchScore}%
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-wider mb-1.5">Strong Areas</p>
                  {data.whyScore.strong.map((s, i) => (
                    <p key={i} className="text-xs text-[#6B7280] flex items-start gap-1.5 mb-1">
                      <CheckCircle2 className="h-3 w-3 text-[#10B981] mt-0.5 shrink-0" /> {s}
                    </p>
                  ))}
                </div>
                <div className="border-t border-[#F3F4F6] pt-2.5">
                  <p className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider mb-1.5">Weak Areas</p>
                  {data.whyScore.weak.map((w, i) => (
                    <p key={i} className="text-xs text-[#6B7280] flex items-start gap-1.5 mb-1">
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
            <div className="rounded-xl bg-green-50 border border-green-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[#374151]">Easy</span>
                <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-[#111827]">{data.dsaAnalysis.easy.solved}</span>
                <span className="text-xl text-[#9CA3AF]">/ {data.dsaAnalysis.easy.required}</span>
              </div>
              <div className="h-2 rounded-full bg-green-100 mb-1.5">
                <div className="h-full rounded-full bg-[#10B981]" style={{ width: "100%" }} />
              </div>
              <p className="text-xs text-[#10B981] font-medium">Target exceeded</p>
            </div>

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

        {/* ═══ SECTION 5 — TOP ACTIONS (with ROI) ═══ */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-[#111827]">Top Actions to Improve Score</h3>
            <span className="text-sm text-[#9CA3AF]">Sorted by impact</span>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data.topActions.map((a) => (
              <div key={a.title} className="relative rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#A7F3D0] transition-colors">
                <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5">+{a.impact}%</span>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg[a.iconColor]}`}>
                  <ActionIcon color={a.iconColor} />
                </div>
                <h4 className="text-sm font-semibold text-[#111827] mt-3">{a.title}</h4>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{a.desc}</p>

                {/* ── FIX 3: ROI Details ── */}
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#9CA3AF]">Effort:</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${effortBadge(a.effort)}`}>{a.effort}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#9CA3AF]">ROI:</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${roiBadge(a.roi)}`}>{a.roi}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F3F4F6]">
                  <span className="text-xs text-[#9CA3AF] flex items-center gap-1"><Clock className="h-3 w-3" /> {a.weeks}</span>
                  <button className="text-sm font-medium text-[#10B981] hover:underline">Start →</button>
                </div>
              </div>
            ))}
          </div>
        </div>

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
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={{ stroke: "#E5E7EB" }} />
              <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={{ stroke: "#E5E7EB" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Line
                type="monotone" dataKey={() => data.targetScoreLine} name={`Target (${data.targetScoreLine}%)`}
                stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} dot={false} connectNulls
              />
              <Line
                type="monotone" dataKey="score" name="Your Score"
                stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: "#10B981" }} connectNulls
              />
              <Line
                type="monotone" dataKey="projected" name="Projected"
                stroke="#9CA3AF" strokeDasharray="5 5" strokeWidth={1.5} dot={{ r: 3, fill: "#9CA3AF" }} connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </DashboardLayout>
  );
}
