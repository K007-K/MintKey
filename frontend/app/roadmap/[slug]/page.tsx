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

/* ═══ STATIC DATA ═══ */
const ROADMAP_DATA: Record<string, {
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
}> = {
  google: {
    company: { slug: "google", name: "Google", role: "Software Engineer I" },
    currentScore: 67, targetScore: 85, weeksTotal: 10, weeksCompleted: 3,
    progressPercent: 35, streak: 14, lastSolved: "Today", problemsThisWeek: 18,
    phases: [
      { id: 1, name: "Foundation", weeks: "1-3", status: "complete", progress: 100 },
      { id: 2, name: "Core DSA", weeks: "4-8", status: "active", progress: 60 },
      { id: 3, name: "Projects", weeks: "9-12", status: "locked", progress: 0 },
      { id: 4, name: "Final Prep", weeks: "13-17", status: "locked", progress: 0 },
    ],
    weeks: [
      { number: 1, theme: "Arrays & Two Pointers", hoursPerDay: 4, progressPercent: 100, dsaProblems: [{ id: 1, name: "Arrays Basics", count: 5, difficulty: "Easy", status: "done" }, { id: 2, name: "Two Pointers", count: 5, difficulty: "Easy", status: "done" }, { id: 3, name: "Sliding Window", count: 5, difficulty: "Medium", status: "done" }], dailyPlan: [{ day: "Monday", task: "Solve 5 Array basics problems", isToday: false }, { day: "Tuesday", task: "Two Pointers pattern practice", isToday: false }, { day: "Wednesday", task: "Sliding Window problems", isToday: false }, { day: "Thursday", task: "Mixed practice session", isToday: false }, { day: "Friday", task: "Review and revise weak areas", isToday: false }, { day: "Saturday", task: "Mock test — Arrays", isToday: false }, { day: "Sunday", task: "Rest & light review", isToday: false }], resources: [{ type: "video", name: "NeetCode Arrays Playlist", url: "#" }, { type: "link", name: "LeetCode Arrays Tag", url: "#" }, { type: "doc", name: "Two Pointers Cheatsheet", url: "#" }], projectTask: { name: "Set up GitHub repo with README", impact: 2, effort: "Low", hours: 2 }, milestone: "Complete Foundation Week 1" },
      { number: 2, theme: "Linked Lists & Stacks", hoursPerDay: 4, progressPercent: 100, dsaProblems: [{ id: 1, name: "Linked Lists", count: 5, difficulty: "Medium", status: "done" }, { id: 2, name: "Stack & Queue", count: 5, difficulty: "Medium", status: "done" }, { id: 3, name: "Monotonic Stack", count: 3, difficulty: "Medium", status: "done" }], dailyPlan: [{ day: "Monday", task: "Linked List reversal patterns", isToday: false }, { day: "Tuesday", task: "Stack-based problems", isToday: false }, { day: "Wednesday", task: "Queue and Deque patterns", isToday: false }, { day: "Thursday", task: "Monotonic Stack problems", isToday: false }, { day: "Friday", task: "Mixed linked list + stack", isToday: false }, { day: "Saturday", task: "Mock test — Stacks", isToday: false }, { day: "Sunday", task: "Rest & light review", isToday: false }], resources: [{ type: "video", name: "NeetCode Stacks Playlist", url: "#" }, { type: "link", name: "LeetCode Stack Tag", url: "#" }, { type: "doc", name: "Stack Patterns Guide", url: "#" }], projectTask: { name: "Implement stack-based feature", impact: 2, effort: "Low", hours: 3 }, milestone: "Complete Foundation Week 2" },
      { number: 3, theme: "Trees & Binary Search", hoursPerDay: 4, progressPercent: 100, dsaProblems: [{ id: 1, name: "Binary Trees", count: 5, difficulty: "Medium", status: "done" }, { id: 2, name: "BST Operations", count: 5, difficulty: "Medium", status: "done" }, { id: 3, name: "Binary Search", count: 5, difficulty: "Medium", status: "done" }], dailyPlan: [{ day: "Monday", task: "Binary Tree traversals", isToday: false }, { day: "Tuesday", task: "BST insert/delete/search", isToday: false }, { day: "Wednesday", task: "Binary Search variations", isToday: false }, { day: "Thursday", task: "Tree DFS/BFS problems", isToday: false }, { day: "Friday", task: "Mixed tree problems", isToday: false }, { day: "Saturday", task: "Mock test — Trees", isToday: false }, { day: "Sunday", task: "Rest & light review", isToday: false }], resources: [{ type: "video", name: "NeetCode Trees Playlist", url: "#" }, { type: "link", name: "LeetCode Trees Tag", url: "#" }, { type: "doc", name: "Tree Patterns Guide", url: "#" }], projectTask: { name: "Add tree-based data structure", impact: 3, effort: "Medium", hours: 4 }, milestone: "Complete Foundation Phase" },
      { number: 4, theme: "Dynamic Programming Foundation", hoursPerDay: 5, progressPercent: 40, dsaProblems: [{ id: 1, name: "Graph BFS/DFS", count: 5, difficulty: "Medium", status: "done" }, { id: 2, name: "DP 1D Patterns", count: 5, difficulty: "Medium", status: "today" }, { id: 3, name: "DP Knapsack", count: 5, difficulty: "Medium", status: "upcoming" }], dailyPlan: [{ day: "Monday", task: "Solve 5 DP 1D Pattern problems on LeetCode", isToday: true }, { day: "Tuesday", task: "Solve 5 DP 1D Pattern problems (continued)", isToday: false }, { day: "Wednesday", task: "Study DP Knapsack patterns — Aditya Verma playlist", isToday: false }, { day: "Thursday", task: "Solve 5 DP Knapsack problems on LeetCode", isToday: false }, { day: "Friday", task: "Implement DP solution — add to GitHub project", isToday: false }, { day: "Saturday", task: "Mock interview — 1 DSA problem timed (45 min)", isToday: false }, { day: "Sunday", task: "Review weak problems + update DSA tracker", isToday: false }], resources: [{ type: "video", name: "Aditya Verma DP Playlist", url: "#" }, { type: "link", name: "LeetCode DP Tag", url: "#" }, { type: "doc", name: "CSES DP Section", url: "#" }], projectTask: { name: "Add Redis caching layer to your backend project", impact: 4, effort: "Medium", hours: 6 }, milestone: "Complete all Week 4 tasks to unlock Phase 3" },
      { number: 5, theme: "DP Advanced Patterns", hoursPerDay: 5, progressPercent: 0, dsaProblems: [{ id: 1, name: "DP on Grids", count: 5, difficulty: "Medium", status: "upcoming" }, { id: 2, name: "DP on Strings", count: 5, difficulty: "Hard", status: "upcoming" }, { id: 3, name: "DP Optimization", count: 5, difficulty: "Hard", status: "upcoming" }], dailyPlan: [{ day: "Monday", task: "Grid DP problems", isToday: false }, { day: "Tuesday", task: "String DP — LCS, Edit Distance", isToday: false }, { day: "Wednesday", task: "Matrix Chain Multiplication", isToday: false }, { day: "Thursday", task: "DP bitmask problems", isToday: false }, { day: "Friday", task: "Project work — API endpoints", isToday: false }, { day: "Saturday", task: "Mock interview", isToday: false }, { day: "Sunday", task: "Review + tracker update", isToday: false }], resources: [{ type: "video", name: "Striver DP Series", url: "#" }, { type: "link", name: "LeetCode DP Hard", url: "#" }, { type: "doc", name: "DP Patterns Cheatsheet", url: "#" }], projectTask: { name: "Build REST API endpoints", impact: 5, effort: "Medium", hours: 8 }, milestone: "Complete DP Advanced module" },
      { number: 6, theme: "Graph Algorithms", hoursPerDay: 5, progressPercent: 0, dsaProblems: [{ id: 1, name: "Dijkstra's Algorithm", count: 3, difficulty: "Hard", status: "upcoming" }, { id: 2, name: "Union Find", count: 4, difficulty: "Medium", status: "upcoming" }, { id: 3, name: "Topological Sort", count: 3, difficulty: "Medium", status: "upcoming" }], dailyPlan: [{ day: "Monday", task: "Dijkstra's shortest path", isToday: false }, { day: "Tuesday", task: "Bellman-Ford algorithm", isToday: false }, { day: "Wednesday", task: "Union-Find problems", isToday: false }, { day: "Thursday", task: "Topological sort problems", isToday: false }, { day: "Friday", task: "Project — database integration", isToday: false }, { day: "Saturday", task: "Mock interview", isToday: false }, { day: "Sunday", task: "Review + tracker update", isToday: false }], resources: [{ type: "video", name: "William Fiset Graphs", url: "#" }, { type: "link", name: "LeetCode Graph Tag", url: "#" }, { type: "doc", name: "Graph Algorithms Guide", url: "#" }], projectTask: { name: "Add database layer to project", impact: 4, effort: "High", hours: 10 }, milestone: "Complete Graph module" },
      { number: 7, theme: "Heaps & Greedy", hoursPerDay: 5, progressPercent: 0, dsaProblems: [{ id: 1, name: "Heap Problems", count: 5, difficulty: "Medium", status: "upcoming" }, { id: 2, name: "Greedy Algorithms", count: 5, difficulty: "Medium", status: "upcoming" }], dailyPlan: [{ day: "Monday", task: "Priority Queue basics", isToday: false }, { day: "Tuesday", task: "K-way merge problems", isToday: false }, { day: "Wednesday", task: "Greedy interval problems", isToday: false }, { day: "Thursday", task: "Activity selection & scheduling", isToday: false }, { day: "Friday", task: "Project work", isToday: false }, { day: "Saturday", task: "Mock interview", isToday: false }, { day: "Sunday", task: "Review", isToday: false }], resources: [{ type: "video", name: "Heap Playlist", url: "#" }, { type: "link", name: "LeetCode Heap Tag", url: "#" }, { type: "doc", name: "Greedy Patterns", url: "#" }], projectTask: { name: "Implement priority queue feature", impact: 3, effort: "Medium", hours: 5 }, milestone: "Complete Heap & Greedy modules" },
      { number: 8, theme: "Backtracking & Recursion", hoursPerDay: 5, progressPercent: 0, dsaProblems: [{ id: 1, name: "Backtracking Basics", count: 5, difficulty: "Medium", status: "upcoming" }, { id: 2, name: "Advanced Recursion", count: 5, difficulty: "Hard", status: "upcoming" }], dailyPlan: [{ day: "Monday", task: "Subsets, Permutations", isToday: false }, { day: "Tuesday", task: "N-Queens, Sudoku Solver", isToday: false }, { day: "Wednesday", task: "Word Search, Combination Sum", isToday: false }, { day: "Thursday", task: "Advanced backtracking", isToday: false }, { day: "Friday", task: "Project — testing & docs", isToday: false }, { day: "Saturday", task: "Full mock interview", isToday: false }, { day: "Sunday", task: "Phase 2 comprehensive review", isToday: false }], resources: [{ type: "video", name: "Backtracking Masterclass", url: "#" }, { type: "link", name: "LeetCode Backtracking", url: "#" }, { type: "doc", name: "Recursion Tree Method", url: "#" }], projectTask: { name: "Deploy project to Railway", impact: 5, effort: "Medium", hours: 4 }, milestone: "Complete Core DSA Phase" },
      { number: 9, theme: "System Design Basics", hoursPerDay: 5, progressPercent: 0, dsaProblems: [{ id: 1, name: "Design Patterns", count: 3, difficulty: "Medium", status: "upcoming" }, { id: 2, name: "System Components", count: 3, difficulty: "Medium", status: "upcoming" }], dailyPlan: [{ day: "Monday", task: "Load balancers & proxies", isToday: false }, { day: "Tuesday", task: "Database sharding & replication", isToday: false }, { day: "Wednesday", task: "Caching strategies", isToday: false }, { day: "Thursday", task: "Message queues", isToday: false }, { day: "Friday", task: "Design URL shortener", isToday: false }, { day: "Saturday", task: "Mock system design", isToday: false }, { day: "Sunday", task: "Review", isToday: false }], resources: [{ type: "video", name: "System Design Primer", url: "#" }, { type: "link", name: "Grokking System Design", url: "#" }, { type: "doc", name: "System Design Template", url: "#" }], projectTask: { name: "Build URL shortener project", impact: 8, effort: "High", hours: 15 }, milestone: "Complete System Design basics" },
      { number: 10, theme: "Final Review & Mock Interviews", hoursPerDay: 6, progressPercent: 0, dsaProblems: [{ id: 1, name: "Mixed Hard Problems", count: 10, difficulty: "Hard", status: "upcoming" }, { id: 2, name: "Timed Practice", count: 5, difficulty: "Medium", status: "upcoming" }], dailyPlan: [{ day: "Monday", task: "Full-length mock interview", isToday: false }, { day: "Tuesday", task: "Weak area revision", isToday: false }, { day: "Wednesday", task: "System design practice", isToday: false }, { day: "Thursday", task: "Behavioral prep", isToday: false }, { day: "Friday", task: "Final mock interview", isToday: false }, { day: "Saturday", task: "Light review only", isToday: false }, { day: "Sunday", task: "Rest before interviews", isToday: false }], resources: [{ type: "video", name: "Google Interview Tips", url: "#" }, { type: "link", name: "Pramp Mock Interviews", url: "#" }, { type: "doc", name: "Interview Day Checklist", url: "#" }], projectTask: { name: "Polish portfolio & update resume", impact: 5, effort: "Low", hours: 4 }, milestone: "Ready for Google interviews!" },
    ],
    scoreSimulator: [
      { task: "Master Dynamic Programming", impact: 12, selected: true },
      { task: "Build Backend Project", impact: 10, selected: true },
      { task: "System Design Basics", impact: 7, selected: false },
      { task: "Mock Interviews", impact: 6, selected: false },
      { task: "Graph Algorithms", impact: 8, selected: false },
      { task: "Participate in Contests", impact: 4, selected: false },
    ],
    taskBoard: {
      todo: [
        { title: "Master Dynamic Programming", impact: 12, effort: "High", difficulty: "Hard", duration: "3 weeks", iconColor: "red" },
        { title: "Build Backend Project", impact: 10, effort: "High", difficulty: "Hard", duration: "2 weeks", iconColor: "amber" },
        { title: "Graph Algorithms", impact: 8, effort: "Medium", difficulty: "Medium", duration: "2 weeks", iconColor: "blue" },
        { title: "System Design Basics", impact: 7, effort: "Medium", difficulty: "Medium", duration: "3 weeks", iconColor: "purple" },
        { title: "Mock Interviews", impact: 6, effort: "Medium", difficulty: "Medium", duration: "4 weeks", iconColor: "green" },
      ],
      inProgress: [
        { title: "DP 1D Problems", impact: 6, progress: 40, difficulty: "Medium", duration: "1 week" },
        { title: "REST API Project", impact: 5, progress: 70, difficulty: "Medium", duration: "ongoing" },
        { title: "Binary Search Practice", impact: 4, progress: 55, difficulty: "Medium", duration: "1 week" },
      ],
      done: ["Graph BFS/DFS", "Arrays & Strings", "Two Pointers", "Linked Lists", "Stack & Queue"],
    },
    charts: {
      scoreHistory: [
        { month: "Jan", score: 42, projected: null }, { month: "Feb", score: 45, projected: null },
        { month: "Mar", score: 48, projected: null }, { month: "Apr", score: 52, projected: null },
        { month: "May", score: 55, projected: null }, { month: "Jun", score: 60, projected: null },
        { month: "Jul", score: 63, projected: null }, { month: "Aug", score: 65, projected: null },
        { month: "Sep", score: 67, projected: 67 }, { month: "Oct", score: null, projected: 70 },
        { month: "Nov", score: null, projected: 74 }, { month: "Dec", score: null, projected: 78 },
      ],
      problemsPerWeek: [
        { week: "W1", count: 25 }, { week: "W2", count: 28 }, { week: "W3", count: 32 }, { week: "W4", count: 22 },
        { week: "W5", count: 30 }, { week: "W6", count: 27 }, { week: "W7", count: 34 }, { week: "W8", count: 32 },
      ],
      skillProgress: [
        { skill: "Dynamic Programming", progress: 55 },
        { skill: "Graph Algorithms", progress: 80 },
        { skill: "System Design", progress: 30 },
        { skill: "Projects", progress: 35 },
      ],
    },
    nextActions: [
      { title: "Master Dynamic Programming", desc: "Focus on DP patterns and solve 32 problems (Knapsack, LCS, Matrix Chain).", impact: 12, duration: "3 weeks", iconColor: "red" },
      { title: "System Design Project", desc: "Build a distributed backend system like URL shortener or key-value store.", impact: 10, duration: "2 weeks", iconColor: "amber" },
      { title: "Mock Interviews", desc: "Complete 8 mock interview sessions focusing on communication and problem-solving.", impact: 6, duration: "4 weeks", iconColor: "blue" },
    ],
  },
};

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
  const data = ROADMAP_DATA[slug || "google"] || ROADMAP_DATA.google;

  const [activeWeek, setActiveWeek] = useState(4);
  const [simSelected, setSimSelected] = useState<boolean[]>(data.scoreSimulator.map(s => s.selected));
  const [chartFilter, setChartFilter] = useState<"1M" | "3M" | "6M" | "1Y">("3M");

  const currentWeekData = data.weeks[activeWeek - 1] || data.weeks[3];

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
            <h1 className="text-2xl font-bold text-[#111827]">My {data.company.name} Roadmap</h1>
            <p className="text-sm text-[#6B7280]">{data.company.role} · {data.weeksTotal} week plan</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
              <RefreshCw className="h-4 w-4" /> Regenerate Roadmap
            </button>
            <button className="flex items-center gap-2 rounded-lg bg-[#10B981] px-4 py-2 text-sm font-medium text-white hover:bg-[#059669] transition-colors">
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
