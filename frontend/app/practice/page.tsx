// DSA Practice Hub — Premium workspace with indigo color system, slide-out detail panel
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { useState, useMemo, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, CheckCircle2, Clock, Target, ExternalLink,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, X,
  Flame, AlertTriangle, Shuffle, Play, ChevronRight as ChevronR,
} from "lucide-react";
import {
  useProblems, useStudyPlans, usePracticeStats,
  usePracticeProgress, useUpdateProblemProgress,
  usePlanSolvedCounts, useStreak, useProblemDetail,
} from "@/lib/api";

/* ── Types ──────────────────────────────────────────────── */

interface APIProblem {
  id: string;
  lc_number: number | null;
  title: string;
  difficulty: string;
  url: string | null;
  tags: string[];
  study_plans: string[];
  pattern: string | null;
  source: string;
  slug: string;
  description?: string;
  hints?: string[];
  solution_approach?: string;
  solution_code?: Record<string, string>;
  complexity_analysis?: string;
}

interface ProgressRecord {
  problem_id: string;
  status: string;
  solved_at: string | null;
  attempts_count: number;
}

interface StudyPlan {
  plan: string;
  total: number;
}

/* ── Constants ──────────────────────────────────────────── */

const PLAN_DISPLAY: Record<string, string> = {
  neetcode_150: "NeetCode 150",
  neetcode_all: "NeetCode All",
  blind_75: "Blind 75",
  striver_a2z: "Striver SDE Sheet",
  cses: "CSES Problem Set",
};

const PLAN_ACCENT: Record<string, string> = {
  neetcode_150: "#4F46E5",
  neetcode_all: "#7C3AED",
  blind_75: "#D97706",
  striver_a2z: "#2563EB",
  cses: "#16A34A",
};

const PLAN_ICON_BG: Record<string, string> = {
  neetcode_150: "#EEF2FF",
  neetcode_all: "#F5F3FF",
  blind_75: "#FFFBEB",
  striver_a2z: "#EFF6FF",
  cses: "#F0FDF4",
};

const DSA_CATEGORIES = [
  "Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack",
  "Binary Search", "Linked List", "Trees", "Graphs",
  "Dynamic Programming", "Backtracking", "Greedy", "Heap / Priority Queue",
  "Bit Manipulation", "Math & Geometry", "Tries", "Intervals",
];

type SortField = "lc_number" | "difficulty" | "title" | null;
type SortDir = "asc" | "desc";

/* ── URL Filters Hook ───────────────────────────────────── */

function useURLFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const get = useCallback((key: string) => searchParams.get(key), [searchParams]);

  const set = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "All" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      if (!("page" in updates)) params.delete("page");
      const qs = params.toString();
      router.push(qs ? `/practice?${qs}` : "/practice", { scroll: false });
    },
    [router, searchParams]
  );

  return {
    plan: get("plan"),
    difficulty: get("difficulty") || "All",
    pattern: get("pattern"),
    unsolved: get("unsolved") === "true",
    search: get("search") || "",
    page: parseInt(get("page") || "1", 10),
    perPage: parseInt(get("per_page") || "50", 10),
    set,
  };
}

/* ── Difficulty color helper (plain text, no pill) ──────── */

function diffColor(d: string): string {
  if (d === "Easy") return "#16A34A";
  if (d === "Medium") return "#D97706";
  if (d === "Hard") return "#DC2626";
  return "#6B7280";
}

/* ── Status icon ─────────────────────────────────────────── */

function StatusIcon({ status, onClick }: { status: string; onClick: () => void }) {
  if (status === "solved") {
    return (
      <button onClick={onClick} className="flex h-5 w-5 items-center justify-center rounded-full transition-transform hover:scale-110" style={{ backgroundColor: "#16A34A" }}>
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    );
  }
  if (status === "attempted") {
    return (
      <button onClick={onClick} className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition-transform hover:scale-110" style={{ borderColor: "#D97706" }}>
        <div className="w-2 h-0.5 rounded-full" style={{ backgroundColor: "#D97706" }} />
      </button>
    );
  }
  return (
    <button onClick={onClick} className="h-4 w-4 rounded border-2 transition-all hover:border-[#4F46E5]" style={{ borderColor: "#D1D5DB", borderRadius: 4 }} />
  );
}

/* ── Sortable Header ─────────────────────────────────────── */

function SortableHeader({ label, field, currentSort, currentDir, onSort }: {
  label: string; field: SortField; currentSort: SortField; currentDir: SortDir; onSort: (f: SortField) => void;
}) {
  const isActive = currentSort === field;
  return (
    <button onClick={() => onSort(field)} className="flex items-center gap-1 transition-colors" style={{
      fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
      color: isActive ? "#4F46E5" : "#9CA3AF",
    }}>
      {label}
      {isActive ? (currentDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronDown className="h-3 w-3 opacity-30" />}
    </button>
  );
}

/* ── Right Detail Panel ──────────────────────────────────── */

function DetailPanel({ problemId, onClose }: { problemId: string; onClose: () => void }) {
  const { data: rawDetail, isLoading } = useProblemDetail(problemId);
  const problem = rawDetail as APIProblem | undefined;
  const [activeTab, setActiveTab] = useState<"description" | "hints" | "notes">("description");

  if (!problemId) return null;

  const tabs = [
    { key: "description" as const, label: "Description" },
    { key: "hints" as const, label: `Hints${problem?.hints?.length ? ` (${problem.hints.length})` : ""}` },
    { key: "notes" as const, label: "My Notes" },
  ];

  return (
    <div className="flex flex-col h-full" style={{
      borderLeft: "1px solid #E4E7EC",
      boxShadow: "-4px 0 20px rgba(0,0,0,0.06)",
      backgroundColor: "#FFFFFF",
    }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span style={{ fontFamily: "var(--font-fira-code), monospace", fontSize: 13, color: "#9CA3AF" }}>
              #{problem?.lc_number || "—"}
            </span>
            {problem?.difficulty && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{
                backgroundColor: problem.difficulty === "Easy" ? "#F0FDF4" : problem.difficulty === "Medium" ? "#FFFBEB" : "#FEF2F2",
                color: diffColor(problem.difficulty),
                fontSize: 11,
              }}>
                {problem.difficulty.toUpperCase()}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
            {isLoading ? <div className="h-6 w-48 rounded bg-gray-100 animate-pulse" /> : problem?.title || "—"}
          </h2>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 transition-colors mt-1">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex px-6 gap-6" style={{ borderBottom: "1px solid #E4E7EC" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="pb-3 transition-colors relative"
            style={{
              fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? "#4F46E5" : "#6B7280",
            }}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: "#4F46E5" }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-gray-100" style={{ width: `${60 + Math.random() * 40}%` }} />
            ))}
          </div>
        ) : activeTab === "description" ? (
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
            {problem?.description ? (
              <div className="space-y-4" dangerouslySetInnerHTML={{
                __html: problem.description
                  .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#111827;font-weight:600">$1</strong>')
                  .replace(/`(.*?)`/g, '<code style="background:#F8FAFC;border:1px solid #E4E7EC;border-radius:4px;padding:2px 6px;font-family:var(--font-fira-code),monospace;font-size:13px;color:#1E293B">$1</code>')
                  .replace(/\n\n/g, '</p><p style="margin-top:12px">')
                  .replace(/\n/g, '<br/>')
              }} />
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">Description not available yet.</p>
                <p className="text-xs text-gray-300 mt-1">Click "Solve" to view on LeetCode</p>
              </div>
            )}
            {problem?.complexity_analysis && (
              <div className="mt-6 p-4 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid #E4E7EC" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Constraints:</p>
                <div style={{ fontFamily: "var(--font-fira-code), monospace", fontSize: 13, color: "#374151" }}>
                  {problem.complexity_analysis}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === "hints" ? (
          <div className="space-y-3">
            {problem?.hints?.length ? problem.hints.map((hint, i) => (
              <div key={i} className="p-4 rounded-lg" style={{ background: "#F8FAFC", border: "1px solid #E4E7EC" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", marginBottom: 6 }}>HINT {i + 1}</p>
                <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{hint}</p>
              </div>
            )) : (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">No hints available</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">Notes feature coming soon</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderTop: "1px solid #E4E7EC" }}>
        {problem?.url && (
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ border: "1px solid #4F46E5", color: "#4F46E5", backgroundColor: "#FFFFFF" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#EEF2FF"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#FFFFFF"; }}
          >
            <ExternalLink className="h-4 w-4" /> LeetCode
          </a>
        )}
        <button
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "#16A34A", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#15803D"; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#16A34A"; }}
        >
          <CheckCircle2 className="h-4 w-4" /> Mark Solved
        </button>
      </div>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────── */

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center px-5 gap-5" style={{ height: 56, borderBottom: "1px solid #F3F4F6" }}>
          <div className="h-4 w-4 rounded bg-gray-100" />
          <div className="h-3 w-8 rounded bg-gray-100" />
          <div className="h-4 w-48 rounded bg-gray-100 flex-1" />
          <div className="h-3 w-12 rounded bg-gray-100" />
          <div className="h-5 w-24 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

/* ── Main Page Content ────────────────────────────────────── */

function PracticePageContent() {
  const filters = useURLFilters();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState(filters.search);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setLocalSearch(filters.search); }, [filters.search]);

  /* ── API calls ────────────────────────────────────── */
  const { data: rawProblemsData, isLoading: loadingProblems } = useProblems({
    difficulty: filters.difficulty !== "All" ? filters.difficulty : undefined,
    study_plan: filters.plan || undefined,
    pattern: filters.pattern || undefined,
    search: filters.search.trim() || undefined,
    page: filters.page,
    per_page: filters.perPage,
  });

  const { data: rawPlansData } = useStudyPlans();
  const { data: rawStatsData } = usePracticeStats(filters.plan);
  const { data: progressData } = usePracticeProgress();
  const { data: planSolvedData } = usePlanSolvedCounts();
  const { data: streakData } = useStreak();
  const updateProgress = useUpdateProblemProgress();

  /* ── Derived data ────────────────────────────────── */
  const problemsData = rawProblemsData as { problems: APIProblem[]; total: number; total_pages: number } | undefined;
  const allProblems: APIProblem[] = problemsData?.problems || [];
  const totalFiltered = problemsData?.total || 0;
  const totalPages = problemsData?.total_pages || 1;

  const plans: StudyPlan[] = (rawPlansData as StudyPlan[] | undefined) || [];
  const stats = rawStatsData as { total_solved: number; total_attempted: number; total_in_plan?: number } | undefined;
  const planSolved = (planSolvedData as Record<string, number> | undefined) || {};
  const streak = (streakData as { current_streak: number; active_today: boolean; total_solve_days: number } | undefined);

  const totalProblems = stats?.total_in_plan || plans.reduce((s: number, p: StudyPlan) => s + p.total, 0) || totalFiltered;
  const solvedCount = stats?.total_solved || 0;
  const attemptedCount = stats?.total_attempted || 0;
  const accuracy = solvedCount + attemptedCount > 0 ? ((solvedCount / (solvedCount + attemptedCount)) * 100).toFixed(1) : "0";

  const progressMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(progressData)) {
      (progressData as ProgressRecord[]).forEach((p) => map.set(p.problem_id, p.status));
    }
    return map;
  }, [progressData]);

  const getStatus = (id: string) => progressMap.get(id) || "unsolved";

  // Category counts from currently loaded problems
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allProblems.forEach((p) => {
      if (p.pattern) {
        counts[p.pattern] = (counts[p.pattern] || 0) + 1;
      }
    });
    return counts;
  }, [allProblems]);

  /* ── Filter + Sort ────────────────────────────────── */
  const displayProblems = useMemo(() => {
    let filtered = allProblems;
    if (filters.unsolved) {
      filtered = filtered.filter((p) => getStatus(p.id) !== "solved");
    }
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let cmp = 0;
        if (sortField === "lc_number") cmp = (a.lc_number || 9999) - (b.lc_number || 9999);
        else if (sortField === "difficulty") {
          const order: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 };
          cmp = (order[a.difficulty] || 4) - (order[b.difficulty] || 4);
        } else if (sortField === "title") cmp = a.title.localeCompare(b.title);
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return filtered;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProblems, filters.unsolved, sortField, sortDir, progressMap]);

  /* ── Handlers ────────────────────────────────────── */
  const handleStatusToggle = (problemId: string) => {
    const current = getStatus(problemId);
    const next = current === "unsolved" ? "attempted" : current === "attempted" ? "solved" : "unsolved";
    updateProgress.mutate({ problemId, status: next as "solved" | "attempted" | "unsolved" });
  };

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }, [sortField]);

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      filters.set({ search: value || null });
    }, 200);
  };

  const handleRandomProblem = () => {
    if (displayProblems.length === 0) return;
    const unsolved = displayProblems.filter((p) => getStatus(p.id) === "unsolved");
    const pool = unsolved.length > 0 ? unsolved : displayProblems;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setSelectedProblemId(random.id);
  };

  /* ── Pagination ────────────────────────────────── */
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (filters.page > 3) pages.push("...");
      for (let i = Math.max(2, filters.page - 1); i <= Math.min(totalPages - 1, filters.page + 1); i++) pages.push(i);
      if (filters.page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, filters.page]);

  /* ── Active plan display ────────────────────────── */
  const activePlanKey = filters.plan || "neetcode_150";
  const activePlanName = PLAN_DISPLAY[activePlanKey] || "All Problems";
  const activePlanTotal = plans.find((p) => p.plan === activePlanKey)?.total || totalProblems;

  /* ── Weekly solved (mock for +N display) ────────── */
  const weeklySolved = Math.min(solvedCount, 3);

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-64px)]" style={{ backgroundColor: "#FAFBFC" }}>
        {/* ══════════ LEFT SIDEBAR (240px) ══════════ */}
        <div className="w-60 shrink-0 overflow-y-auto py-5 px-4 space-y-5" style={{ borderRight: "1px solid #E4E7EC" }}>
          {/* My Progress card */}
          <div className="rounded-xl p-4 space-y-3" style={{ border: "1px solid #E4E7EC", backgroundColor: "#FFFFFF" }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>
                MY PROGRESS
              </span>
              {(streak?.current_streak || 0) > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: "#F97316", fontSize: 11, fontWeight: 700 }}>
                  <Flame className="h-3 w-3" />
                  {streak?.current_streak} Day Streak
                </span>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span style={{ fontSize: 32, fontWeight: 800, color: "#111827", lineHeight: 1 }}>
                  {solvedCount}
                </span>
                <span style={{ fontSize: 14, color: "#9CA3AF" }}>/ {totalProblems} solved</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E4E7EC" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{
                  width: `${totalProblems > 0 ? Math.min(100, (solvedCount / totalProblems) * 100) : 0}%`,
                  backgroundColor: "#4F46E5",
                }} />
              </div>
            </div>

            {/* Warning / Behind alert */}
            {!streak?.active_today && (
              <div className="flex items-start gap-2 p-3 rounded-lg" style={{
                backgroundColor: "#FFFBEB",
                borderLeft: "3px solid #F59E0B",
              }}>
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                <p style={{ fontSize: 12, color: "#92400E", lineHeight: 1.4 }}>
                  You&apos;re falling behind. Practice recommended today.
                </p>
              </div>
            )}
          </div>

          {/* Study Plans */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 8 }}>
              STUDY PLANS
            </p>
            <div className="space-y-0.5">
              {plans.length > 0 ? plans.map((plan) => {
                const isActive = filters.plan === plan.plan;
                const solved = planSolved[plan.plan] || 0;
                const pct = plan.total > 0 ? Math.min(100, (solved / plan.total) * 100) : 0;
                const accent = PLAN_ACCENT[plan.plan] || "#4F46E5";
                return (
                  <button
                    key={plan.plan}
                    onClick={() => filters.set({ plan: isActive ? null : plan.plan })}
                    className="w-full text-left rounded-lg px-3 py-2.5 transition-all relative"
                    style={{
                      backgroundColor: isActive ? "#EEF2FF" : "transparent",
                      borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 14, fontWeight: 500, color: isActive ? "#4F46E5" : "#111827" }}>
                        {PLAN_DISPLAY[plan.plan] || plan.plan}
                      </span>
                      <span style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "var(--font-fira-code), monospace" }}>
                        {solved}/{plan.total}
                      </span>
                    </div>
                    {/* Thin progress bar */}
                    <div className="h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: "#E4E7EC" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${pct}%`,
                        backgroundColor: accent,
                      }} />
                    </div>
                  </button>
                );
              }) : (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse px-3 py-2.5 space-y-2">
                    <div className="h-3 w-28 rounded bg-gray-100" />
                    <div className="h-[3px] rounded-full bg-gray-100" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Categories */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 8 }}>
              CATEGORIES
            </p>
            <div className="space-y-0.5">
              {DSA_CATEGORIES.filter((cat) => !filters.pattern || categoryCounts[cat]).slice(0, 8).map((cat) => {
                const isActive = filters.pattern === cat;
                const count = categoryCounts[cat] || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => filters.set({ pattern: isActive ? null : cat })}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2 transition-all hover:bg-gray-50"
                    style={{
                      backgroundColor: isActive ? "#EEF2FF" : "transparent",
                    }}
                  >
                    <span className="flex items-center gap-2" style={{ fontSize: 13, color: isActive ? "#4F46E5" : "#374151", fontWeight: isActive ? 500 : 400 }}>
                      <span style={{ fontSize: 12 }}>⚡</span>
                      {cat}
                    </span>
                    {count > 0 && (
                      <span className="flex items-center justify-center rounded-full min-w-[22px] h-[22px] px-1" style={{
                        backgroundColor: "#F3F4F6",
                        fontSize: 11, fontWeight: 600, color: "#374151",
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ══════════ CENTER AREA ══════════ */}
        <div className={`flex-1 min-w-0 overflow-y-auto transition-all duration-300 ${selectedProblemId ? "" : ""}`}>
          <div className="max-w-[960px] mx-auto px-6 py-5 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
                  {activePlanName}
                </h1>
                <p style={{ fontSize: 14, fontWeight: 400, color: "#6B7280", marginTop: 4 }}>
                  Master the top {activePlanTotal} coding interview questions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRandomProblem}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-gray-100"
                  style={{ border: "1px solid #E4E7EC", color: "#374151", backgroundColor: "#FFFFFF" }}
                >
                  <Shuffle className="h-4 w-4" /> Random
                </button>
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
                  style={{ backgroundColor: "#4F46E5", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#4338CA"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#4F46E5"; }}
                >
                  <Play className="h-4 w-4" /> Resume Practice
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "TOTAL PROBLEMS", value: activePlanTotal || "—", icon: "📊" },
                { label: "SOLVED", value: solvedCount, extra: weeklySolved > 0 ? `+${weeklySolved} this week` : undefined, icon: "✅" },
                { label: "ATTEMPTED", value: attemptedCount, icon: "⏳" },
                { label: "ACCURACY", value: `${accuracy}%`, icon: "🎯" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl px-5 py-4 transition-shadow hover:shadow-sm" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E4E7EC" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ fontSize: 14 }}>{stat.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>
                      {stat.label}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span style={{ fontSize: 32, fontWeight: 800, color: "#111827", lineHeight: 1 }}>
                      {stat.value}
                    </span>
                    {stat.extra && (
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#16A34A" }}>{stat.extra}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>All Categories</span>
              <div className="flex items-center gap-1.5">
                {["Easy", "Medium", "Hard"].map((d) => {
                  const isActive = filters.difficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => filters.set({ difficulty: isActive ? null : d })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        border: isActive ? "none" : "1px solid #E4E7EC",
                        backgroundColor: isActive ? "#4F46E5" : "#FFFFFF",
                        color: isActive ? "#FFFFFF" : "#374151",
                      }}
                    >
                      {!isActive && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: diffColor(d) }} />}
                      {d}
                    </button>
                  );
                })}
              </div>

              <div className="h-5 w-px" style={{ backgroundColor: "#E4E7EC" }} />

              <label className="flex items-center gap-2 cursor-pointer select-none" style={{ fontSize: 13, color: "#6B7280" }}>
                <input
                  type="checkbox"
                  checked={filters.unsolved}
                  onChange={() => filters.set({ unsolved: filters.unsolved ? null : "true" })}
                  className="rounded"
                  style={{ accentColor: "#4F46E5", width: 14, height: 14 }}
                />
                Unsolved only
              </label>

              <div className="flex-1" />

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#9CA3AF" }} />
                <input
                  type="text"
                  placeholder="Search problems, patterns..."
                  value={localSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-[240px] rounded-lg py-2 pl-9 pr-3 text-sm transition-colors focus:outline-none"
                  style={{ border: "1px solid #E4E7EC", color: "#111827", backgroundColor: "#FFFFFF" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#4F46E5"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79,70,229,0.1)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "#E4E7EC"; e.currentTarget.style.boxShadow = "none"; }}
                />
                {localSearch && (
                  <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="h-3.5 w-3.5" style={{ color: "#9CA3AF" }} />
                  </button>
                )}
              </div>
            </div>

            {/* Problem Table */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E4E7EC", backgroundColor: "#FFFFFF" }}>
              {/* Header */}
              <div className="grid items-center px-5" style={{
                gridTemplateColumns: "44px 56px 1fr 90px 160px 28px",
                height: 44, borderBottom: "1px solid #E4E7EC", backgroundColor: "#FAFBFC",
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>
                  STATUS
                </span>
                <SortableHeader label="#" field="lc_number" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="TITLE" field="title" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="DIFFICULTY" field="difficulty" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>
                  PATTERN
                </span>
                <span />
              </div>

              {/* Rows */}
              {loadingProblems ? (
                <TableSkeleton rows={12} />
              ) : displayProblems.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="text-3xl mb-3">🔍</div>
                  <p className="text-sm font-medium" style={{ color: "#6B7280" }}>No problems found</p>
                  <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Try adjusting your filters</p>
                </div>
              ) : (
                <div>
                  {displayProblems.map((p, idx) => {
                    const status = getStatus(p.id);
                    const isSelected = selectedProblemId === p.id;
                    const isEven = idx % 2 === 1;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProblemId(p.id)}
                        className="grid items-center px-5 cursor-pointer transition-colors group"
                        style={{
                          gridTemplateColumns: "44px 56px 1fr 90px 160px 28px",
                          height: 56,
                          borderBottom: "1px solid #F3F4F6",
                          backgroundColor: isSelected ? "#EEF2FF" : isEven ? "#FAFBFC" : "#FFFFFF",
                          borderLeft: isSelected ? "3px solid #4F46E5" : "3px solid transparent",
                          paddingLeft: isSelected ? 17 : 20,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = "#F8F9FF";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = isEven ? "#FAFBFC" : "#FFFFFF";
                        }}
                      >
                        {/* Status */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <StatusIcon status={status} onClick={() => handleStatusToggle(p.id)} />
                        </div>

                        {/* Number */}
                        <span style={{ fontFamily: "var(--font-fira-code), monospace", fontSize: 13, color: "#9CA3AF" }}>
                          {p.lc_number || "—"}
                        </span>

                        {/* Title */}
                        <span className="truncate pr-3" style={{
                          fontSize: 14, fontWeight: 500,
                          color: status === "solved" ? "#9CA3AF" : "#111827",
                          textDecoration: status === "solved" ? "line-through" : "none",
                        }}>
                          {p.title}
                        </span>

                        {/* Difficulty — plain text */}
                        <span style={{ fontSize: 13, fontWeight: 500, color: diffColor(p.difficulty || "Medium") }}>
                          {p.difficulty || "Medium"}
                        </span>

                        {/* Pattern chip */}
                        <div className="flex items-center gap-1 min-w-0">
                          {p.pattern && (
                            <span
                              className="inline-block truncate max-w-[120px] group-hover:text-[#4F46E5] transition-colors"
                              style={{
                                fontSize: 12, fontWeight: 500, color: "#374151",
                                backgroundColor: "#F3F4F6", border: "1px solid #E4E7EC",
                                borderRadius: 6, padding: "4px 10px",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#EEF2FF"; e.currentTarget.style.color = "#4F46E5"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#F3F4F6"; e.currentTarget.style.color = "#374151"; }}
                            >
                              {p.pattern}
                            </span>
                          )}
                          {(p.tags?.length || 0) > 1 && p.pattern && (
                            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>
                              +{p.tags.length - 1}
                            </span>
                          )}
                        </div>

                        {/* Chevron on hover */}
                        <ChevronR
                          className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "#9CA3AF" }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 0 && !loadingProblems && displayProblems.length > 0 && (
              <div className="flex items-center justify-between pb-4">
                <span style={{ fontSize: 13, color: "#6B7280" }}>
                  Showing {totalFiltered > 0 ? (filters.page - 1) * filters.perPage + 1 : 0}–{Math.min(filters.page * filters.perPage, totalFiltered)} of {totalFiltered} problems
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => filters.set({ page: String(Math.max(1, filters.page - 1)) })}
                    disabled={filters.page <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30 hover:bg-gray-100"
                    style={{ border: "1px solid #E4E7EC" }}
                  >
                    <ChevronLeft className="h-4 w-4" style={{ color: "#6B7280" }} />
                  </button>
                  {pageNumbers.map((n, i) =>
                    n === "..." ? (
                      <span key={`dots-${i}`} className="px-2" style={{ color: "#9CA3AF", fontSize: 13 }}>…</span>
                    ) : (
                      <button
                        key={n}
                        onClick={() => filters.set({ page: String(n) })}
                        className="h-8 w-8 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          border: filters.page === n ? "none" : "1px solid #E4E7EC",
                          backgroundColor: filters.page === n ? "#4F46E5" : "#FFFFFF",
                          color: filters.page === n ? "#FFFFFF" : "#374151",
                        }}
                      >
                        {n}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => filters.set({ page: String(Math.min(totalPages, filters.page + 1)) })}
                    disabled={filters.page >= totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-30 hover:bg-gray-100"
                    style={{ border: "1px solid #E4E7EC" }}
                  >
                    <ChevronRight className="h-4 w-4" style={{ color: "#6B7280" }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ RIGHT DETAIL PANEL ══════════ */}
        {selectedProblemId && (
          <div className="w-[400px] shrink-0 overflow-hidden transition-all duration-300">
            <DetailPanel problemId={selectedProblemId} onClose={() => setSelectedProblemId(null)} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ── Suspense wrapper ─────────────────────────────────────── */

function PracticePageFallback() {
  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-64px)] animate-pulse" style={{ backgroundColor: "#FAFBFC" }}>
        <div className="w-60 shrink-0 p-4 space-y-4" style={{ borderRight: "1px solid #E4E7EC" }}>
          <div className="h-40 rounded-xl bg-gray-100" />
          <div className="h-48 rounded-xl bg-gray-100" />
        </div>
        <div className="flex-1 p-6 space-y-5">
          <div className="h-8 w-48 rounded bg-gray-100" />
          <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-100" />)}</div>
          <div className="h-[500px] rounded-xl bg-gray-100" />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<PracticePageFallback />}>
      <PracticePageContent />
    </Suspense>
  );
}
