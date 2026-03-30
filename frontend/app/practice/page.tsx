// DSA Practice Hub — premium 5-zone layout with URL-driven state, study plan sidebar, pattern filters
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { useState, useMemo, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Hash, CheckCircle2, Clock, Target, ExternalLink,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, X,
  Flame, BookOpen, TrendingUp,
} from "lucide-react";
import {
  useProblems, useStudyPlans, usePracticeStats,
  usePracticeProgress, useUpdateProblemProgress,
  usePlanSolvedCounts, useStreak,
} from "@/lib/api";
import Link from "next/link";

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

const SOURCES = ["All", "NeetCode", "Striver", "CSES", "Blind 75"];
const DIFFICULTIES = [
  { label: "All", value: "All", color: "" },
  { label: "Easy", value: "Easy", color: "#22C55E" },
  { label: "Medium", value: "Medium", color: "#F59E0B" },
  { label: "Hard", value: "Hard", color: "#EF4444" },
];

const DSA_PATTERNS = [
  "Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack",
  "Binary Search", "Linked List", "Trees", "Graphs",
  "Dynamic Programming", "Backtracking", "Greedy", "Heap / Priority Queue",
  "Bit Manipulation", "Math & Geometry", "Tries", "Intervals",
];

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100];

const PLAN_DISPLAY: Record<string, string> = {
  neetcode_150: "NeetCode 150",
  neetcode_all: "NeetCode All",
  blind_75: "Blind 75",
  striver_a2z: "Striver A2Z",
  cses: "CSES",
};

const PLAN_ICONS: Record<string, string> = {
  neetcode_150: "🎯",
  neetcode_all: "📚",
  blind_75: "⚡",
  striver_a2z: "🗺️",
  cses: "🏆",
};

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
      // Reset page to 1 when filters change (unless page itself is being set)
      if (!("page" in updates)) {
        params.delete("page");
      }
      const qs = params.toString();
      router.push(qs ? `/practice?${qs}` : "/practice", { scroll: false });
    },
    [router, searchParams]
  );

  return {
    plan: get("plan"),
    source: get("source") || "All",
    difficulty: get("difficulty") || "All",
    pattern: get("pattern"),
    unsolved: get("unsolved") === "true",
    search: get("search") || "",
    page: parseInt(get("page") || "1", 10),
    perPage: parseInt(get("per_page") || "50", 10),
    set,
  };
}

/* ── Sub-components ─────────────────────────────────────── */

function StatusCircle({ status, onChangeStatus }: { status: string; onChangeStatus: (s: string) => void }) {
  const [showPopover, setShowPopover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowPopover(false);
    }
    if (showPopover) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPopover]);

  const circle = status === "solved" ? (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#14B8A6] transition-transform hover:scale-110">
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  ) : status === "attempted" ? (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F59E0B] transition-transform hover:scale-110">
      <Clock className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
    </div>
  ) : (
    <div className="h-5 w-5 rounded-full border-2 border-[#D1D5DB] transition-all hover:border-[#14B8A6] hover:scale-110" />
  );

  const options = [
    { label: "Mark Solved", value: "solved", icon: <CheckCircle2 className="h-3.5 w-3.5 text-[#14B8A6]" />, active: status === "solved" },
    { label: "Mark Attempted", value: "attempted", icon: <Clock className="h-3.5 w-3.5 text-[#F59E0B]" />, active: status === "attempted" },
    { label: "Mark Unsolved", value: "unsolved", icon: <div className="h-3.5 w-3.5 rounded-full border-2 border-[#D1D5DB]" />, active: status === "unsolved" },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setShowPopover(!showPopover)} className="hover:opacity-80">
        {circle}
      </button>
      {showPopover && (
        <div className="absolute left-0 top-7 z-50 w-44 rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChangeStatus(opt.value); setShowPopover(false); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-[12px] font-medium transition-colors ${
                opt.active ? "bg-[#F0FDFA] text-[#0D9488]" : "text-[#374151] hover:bg-[#F9FAFB]"
              }`}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DiffBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Easy: { bg: "#ECFDF5", color: "#059669" },
    Medium: { bg: "#FFFBEB", color: "#D97706" },
    Hard: { bg: "#FEF2F2", color: "#DC2626" },
  };
  const style = map[difficulty] || { bg: "#F3F4F6", color: "#6B7280" };
  return (
    <span
      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {difficulty || "—"}
    </span>
  );
}

function SortableHeader({
  label, field, currentSort, currentDir, onSort, className = "",
}: {
  label: string; field: SortField; currentSort: SortField; currentDir: SortDir;
  onSort: (f: SortField) => void; className?: string;
}) {
  const isActive = currentSort === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
        isActive ? "text-[#14B8A6]" : "text-[#9CA3AF] hover:text-[#6B7280]"
      } ${className}`}
    >
      {label}
      {isActive ? (
        currentDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-[44px_56px_1fr_80px_140px_72px] items-center px-4 h-12 border-b border-[#F9FAFB]">
          <div className="h-5 w-5 rounded-full bg-[#F3F4F6]" />
          <div className="h-3 w-8 rounded bg-[#F3F4F6]" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-48 rounded bg-[#F3F4F6]" />
            <div className="h-2.5 w-24 rounded bg-[#F3F4F6]" />
          </div>
          <div className="h-5 w-14 rounded bg-[#F3F4F6]" />
          <div className="flex gap-1">
            <div className="h-4 w-12 rounded bg-[#F3F4F6]" />
            <div className="h-4 w-16 rounded bg-[#F3F4F6]" />
          </div>
          <div className="h-7 w-16 rounded bg-[#F3F4F6]" />
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon, iconBg, iconColor }: {
  label: string; value: string | number; icon: React.ReactNode; iconBg: string; iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex items-center gap-3 transition-shadow hover:shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{label}</p>
        <p className="text-[22px] font-bold text-[#111827] leading-tight">{value}</p>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */

function PracticePageContent() {
  const filters = useURLFilters();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showPatternDropdown, setShowPatternDropdown] = useState(false);
  const patternRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Close pattern dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (patternRef.current && !patternRef.current.contains(e.target as Node)) setShowPatternDropdown(false);
    }
    if (showPatternDropdown) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPatternDropdown]);

  // Sync local search with URL on mount
  useEffect(() => { setLocalSearch(filters.search); }, [filters.search]);

  /* ── API source mapping ──────────────────────────── */
  const sourceMap: Record<string, string> = {
    NeetCode: "neetcode", Striver: "striver", CSES: "cses", "Blind 75": "blind75",
  };

  /* ── API calls (parallel) ────────────────────────── */
  const { data: rawProblemsData, isLoading: loadingProblems } = useProblems({
    source: filters.source !== "All" ? sourceMap[filters.source] || filters.source.toLowerCase() : undefined,
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

  /* ── Derived data ─────────────────────────────────── */
  const problemsData = rawProblemsData as { problems: APIProblem[]; total: number; total_pages: number } | undefined;
  const allProblems: APIProblem[] = problemsData?.problems || [];
  const totalFiltered = problemsData?.total || 0;
  const totalPages = problemsData?.total_pages || 1;

  const plans: StudyPlan[] = (rawPlansData as StudyPlan[] | undefined) || [];
  const statsData = rawStatsData as { total_solved: number; total_attempted: number; total_in_plan?: number } | undefined;
  const planSolved = (planSolvedData as Record<string, number> | undefined) || {};
  const streak = (streakData as { current_streak: number; active_today: boolean; total_solve_days: number } | undefined);

  const totalProblems = statsData?.total_in_plan || plans.reduce((sum: number, p: StudyPlan) => sum + p.total, 0) || totalFiltered;
  const solvedCount = statsData?.total_solved || 0;
  const attemptedCount = statsData?.total_attempted || 0;
  const accuracy = solvedCount + attemptedCount > 0
    ? Math.round((solvedCount / (solvedCount + attemptedCount)) * 100)
    : 0;

  // Progress lookup: problem_id → status
  const progressMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(progressData)) {
      (progressData as ProgressRecord[]).forEach((p) => map.set(p.problem_id, p.status));
    }
    return map;
  }, [progressData]);

  const getStatus = (id: string) => progressMap.get(id) || "unsolved";

  /* ── Filter + Sort ────────────────────────────────── */
  const displayProblems = useMemo(() => {
    let filtered = allProblems;

    // Status filter: unsolved only
    if (filters.unsolved) {
      filtered = filtered.filter((p) => getStatus(p.id) !== "solved");
    }

    // Sort
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

  /* ── Handlers ──────────────────────────────────── */
  const handleStatusChange = (problemId: string, status: string) => {
    updateProgress.mutate({ problemId, status: status as "solved" | "attempted" | "unsolved" });
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

  const activeFilterCount = [
    filters.source !== "All" ? 1 : 0,
    filters.difficulty !== "All" ? 1 : 0,
    filters.pattern ? 1 : 0,
    filters.unsolved ? 1 : 0,
    filters.search ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => {
    filters.set({ source: null, difficulty: null, pattern: null, unsolved: null, search: null, page: null, per_page: null });
    setLocalSearch("");
  };

  /* ── Pagination helpers ────────────────────────── */
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

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* ══════════ ZONE 1 — Header ══════════ */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">DSA Practice</h1>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              {totalFiltered > 0 ? totalFiltered.toLocaleString() : "1,100+"} problems from NeetCode 150, Blind 75, Striver A2Z, and CSES
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search problems..."
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-[260px] rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#14B8A6] focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/30 transition-colors"
            />
            {localSearch && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ══════════ ZONE 2 — Stats Bar ══════════ */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label={filters.plan ? PLAN_DISPLAY[filters.plan] || "PLAN" : "TOTAL PROBLEMS"}
            value={totalProblems || "—"}
            icon={<Hash className="h-4 w-4" />}
            iconBg="#F3F4F6" iconColor="#6B7280"
          />
          <StatCard label="SOLVED" value={solvedCount} icon={<CheckCircle2 className="h-4 w-4" />} iconBg="#ECFDF5" iconColor="#059669" />
          <StatCard label="ATTEMPTED" value={attemptedCount} icon={<Clock className="h-4 w-4" />} iconBg="#FFFBEB" iconColor="#D97706" />
          <StatCard label="ACCURACY" value={accuracy > 0 ? `${accuracy}%` : "—"} icon={<Target className="h-4 w-4" />} iconBg="#F0FDFA" iconColor="#14B8A6" />
        </div>

        {/* ══════════ ZONES 3 + 4 — Sidebar + Main ══════════ */}
        <div className="flex gap-5">
          {/* ── Zone 3: Study Plan Sidebar (220px) ─────── */}
          <div className="w-[220px] shrink-0 space-y-4">
            {/* Study plans */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Study Plans
                </h3>
              </div>
              <div className="px-2 pb-3 space-y-0.5">
                {/* "All Problems" option */}
                <button
                  onClick={() => filters.set({ plan: null })}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-all ${
                    !filters.plan
                      ? "bg-[#F0FDFA] border-l-[3px] border-[#14B8A6]"
                      : "hover:bg-[#FAFAFA] border-l-[3px] border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[13px] font-medium ${!filters.plan ? "text-[#0D9488]" : "text-[#111827]"}`}>
                      📋 All Problems
                    </span>
                    <span className="text-[11px] text-[#9CA3AF]">{plans.reduce((s, p) => s + p.total, 0) || "—"}</span>
                  </div>
                </button>

                {plans.length > 0 ? plans.map((plan) => {
                  const isActive = filters.plan === plan.plan;
                  const solved = planSolved[plan.plan] || 0;
                  const pct = plan.total > 0 ? Math.min(100, Math.round((solved / plan.total) * 100)) : 0;
                  return (
                    <button
                      key={plan.plan}
                      onClick={() => filters.set({ plan: isActive ? null : plan.plan })}
                      className={`w-full text-left rounded-lg px-3 py-2.5 transition-all ${
                        isActive
                          ? "bg-[#F0FDFA] border-l-[3px] border-[#14B8A6]"
                          : "hover:bg-[#FAFAFA] border-l-[3px] border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[13px] font-medium ${isActive ? "text-[#0D9488]" : "text-[#111827]"}`}>
                          {PLAN_ICONS[plan.plan] || "📘"} {PLAN_DISPLAY[plan.plan] || plan.plan}
                        </span>
                        <span className={`text-[11px] ${isActive ? "text-[#0D9488] font-semibold" : "text-[#9CA3AF]"}`}>
                          {solved}/{plan.total}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isActive ? "#14B8A6" : pct === 100 ? "#22C55E" : "#3B82F6",
                          }}
                        />
                      </div>
                      {pct > 0 && (
                        <span className="text-[10px] text-[#9CA3AF] mt-1 block">{pct}% complete</span>
                      )}
                    </button>
                  );
                }) : (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse px-3 py-2.5 space-y-2">
                      <div className="h-3 w-24 rounded bg-[#F3F4F6]" />
                      <div className="h-1.5 rounded-full bg-[#F3F4F6]" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* My Progress mini-summary */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                My Progress
              </h3>
              {/* Streak */}
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  streak?.active_today ? "bg-[#FEF3C7]" : "bg-[#F3F4F6]"
                }`}>
                  <Flame className={`h-4 w-4 ${
                    streak?.active_today ? "text-[#F59E0B] animate-pulse" : "text-[#D1D5DB]"
                  }`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-[#111827] leading-none">
                    {streak?.current_streak || 0}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">
                    {streak?.active_today ? "day streak 🔥" : "day streak"}
                  </p>
                </div>
              </div>
              {/* Total solved */}
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#6B7280]">Total solved</span>
                <span className="font-semibold text-[#111827]">{solvedCount}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-[#6B7280]">Solve days</span>
                <span className="font-semibold text-[#111827]">{streak?.total_solve_days || 0}</span>
              </div>
              {!streak?.active_today && (
                <p className="text-[10px] text-[#F59E0B] italic">
                  Solve a problem to continue your streak!
                </p>
              )}
            </div>
          </div>

          {/* ── Zone 4: Filter Bar + Problem Table ─────── */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Source pills */}
              <div className="flex items-center gap-1">
                {SOURCES.map((src) => (
                  <button
                    key={src}
                    onClick={() => filters.set({ source: src === "All" ? null : src })}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                      filters.source === src
                        ? "bg-[#14B8A6] text-white shadow-sm"
                        : "border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]"
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>

              <div className="h-5 w-px bg-[#E5E7EB]" />

              {/* Difficulty pills */}
              <div className="flex items-center gap-1">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => filters.set({ difficulty: d.value === "All" ? null : d.value })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                      filters.difficulty === d.value
                        ? "bg-[#14B8A6] text-white shadow-sm"
                        : "border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]"
                    }`}
                  >
                    {d.color && filters.difficulty !== d.value && (
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    )}
                    {d.label}
                  </button>
                ))}
              </div>

              <div className="h-5 w-px bg-[#E5E7EB]" />

              {/* Pattern dropdown */}
              <div ref={patternRef} className="relative">
                <button
                  onClick={() => setShowPatternDropdown(!showPatternDropdown)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                    filters.pattern
                      ? "bg-[#0D9488] text-white shadow-sm"
                      : "border border-dashed border-[#D1D5DB] text-[#6B7280] hover:border-[#14B8A6] hover:text-[#14B8A6]"
                  }`}
                >
                  <Filter className="h-3 w-3" />
                  {filters.pattern || "Pattern"}
                  {filters.pattern && (
                    <X
                      className="h-3 w-3 ml-0.5 hover:opacity-70"
                      onClick={(e) => { e.stopPropagation(); filters.set({ pattern: null }); }}
                    />
                  )}
                  {!filters.pattern && <ChevronDown className="h-3 w-3 opacity-50" />}
                </button>
                {showPatternDropdown && (
                  <div className="absolute left-0 top-9 z-50 w-56 max-h-[320px] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg">
                    {DSA_PATTERNS.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          filters.set({ pattern: p === filters.pattern ? null : p });
                          setShowPatternDropdown(false);
                        }}
                        className={`flex w-full items-center px-3 py-2 text-[12px] font-medium transition-colors ${
                          filters.pattern === p
                            ? "bg-[#F0FDFA] text-[#0D9488]"
                            : "text-[#374151] hover:bg-[#F9FAFB]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-5 w-px bg-[#E5E7EB]" />

              {/* Unsolved-only toggle */}
              <button
                onClick={() => filters.set({ unsolved: filters.unsolved ? null : "true" })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  filters.unsolved
                    ? "bg-[#14B8A6] text-white shadow-sm"
                    : "border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
              >
                <div className={`relative w-7 h-4 rounded-full transition-colors ${
                  filters.unsolved ? "bg-white/30" : "bg-[#E5E7EB]"
                }`}>
                  <div className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${
                    filters.unsolved ? "left-3.5 bg-white" : "left-0.5 bg-[#9CA3AF]"
                  }`} />
                </div>
                Unsolved only
              </button>

              {/* Active filter count + clear */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-[11px] text-[#EF4444] hover:text-[#DC2626] font-medium ml-auto"
                >
                  <X className="h-3 w-3" />
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Problem table */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[44px_56px_1fr_80px_140px_72px] items-center px-4 h-11 border-b border-[#F3F4F6] bg-[#FAFAFA]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">✓</div>
                <SortableHeader label="#" field="lc_number" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Problem" field="title" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Difficulty" field="difficulty" currentSort={sortField} currentDir={sortDir} onSort={handleSort} />
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Tags</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] text-center">Action</div>
              </div>

              {/* Table rows */}
              {loadingProblems ? (
                <TableSkeleton rows={filters.perPage > 25 ? 15 : 10} />
              ) : displayProblems.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-3xl mb-3">🔍</div>
                  <p className="text-sm font-medium text-[#6B7280]">No problems found</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    {activeFilterCount > 0 ? "Try adjusting your filters" : "Run the seed script to populate problems"}
                  </p>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="mt-3 text-xs text-[#14B8A6] hover:underline font-medium">
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#F9FAFB]">
                  {displayProblems.map((p) => {
                    const status = getStatus(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`grid grid-cols-[44px_56px_1fr_80px_140px_72px] items-center px-4 h-12 transition-colors group ${
                          status === "solved"
                            ? "bg-[#F0FDF4]/40"
                            : "hover:bg-[#FAFAFA]"
                        }`}
                      >
                        {/* Status circle with popover */}
                        <StatusCircle status={status} onChangeStatus={(s) => handleStatusChange(p.id, s)} />

                        {/* LC number */}
                        <div className="text-[11px] text-[#9CA3AF] font-mono">
                          {p.lc_number || (p.source === "cses" ? `C-${p.slug?.split("-")[0] || "—"}` : "—")}
                        </div>

                        {/* Title with pattern subtitle */}
                        <div className="min-w-0 pr-3">
                          <Link
                            href={`/practice/${p.id}`}
                            className={`text-[13px] font-medium truncate block transition-colors group-hover:text-[#14B8A6] ${
                              status === "solved" ? "text-[#9CA3AF] line-through decoration-[#D1D5DB]" : "text-[#111827]"
                            }`}
                          >
                            {p.title}
                          </Link>
                          {p.pattern && (
                            <span className="text-[10px] text-[#9CA3AF] block mt-0.5 truncate">
                              {p.pattern}
                            </span>
                          )}
                        </div>

                        {/* Difficulty */}
                        <div><DiffBadge difficulty={p.difficulty || "Medium"} /></div>

                        {/* Tags with overflow */}
                        <div className="flex items-center gap-1 min-w-0">
                          {(p.tags || []).slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] truncate max-w-[65px]"
                              title={tag}
                            >
                              {tag}
                            </span>
                          ))}
                          {(p.tags || []).length > 2 && (
                            <span
                              className="text-[10px] text-[#9CA3AF] cursor-default"
                              title={(p.tags || []).slice(2).join(", ")}
                            >
                              +{p.tags.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Solve button */}
                        <div className="text-center">
                          {p.url ? (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#14B8A6] text-[#14B8A6] text-[11px] font-semibold hover:bg-[#F0FDFA] transition-colors"
                            >
                              Solve
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-[#D1D5DB]">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ══════════ ZONE 5 — Pagination ══════════ */}
            {totalPages > 0 && !loadingProblems && displayProblems.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="text-[#6B7280] text-[12px]">
                  Showing{" "}
                  <span className="font-semibold text-[#14B8A6]">
                    {totalFiltered > 0 ? (filters.page - 1) * filters.perPage + 1 : 0}–{Math.min(filters.page * filters.perPage, totalFiltered)}
                  </span>{" "}
                  of <span className="font-semibold text-[#14B8A6]">{totalFiltered}</span>
                  {solvedCount > 0 && (
                    <>
                      {" · "}
                      <span className="font-semibold text-[#14B8A6]">{solvedCount}</span> solved
                      {totalProblems > 0 && (
                        <>
                          {" · "}
                          <span className="font-semibold text-[#14B8A6]">
                            {Math.round((solvedCount / totalProblems) * 100)}%
                          </span> complete
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Rows per page */}
                  <div className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                    <span>Rows:</span>
                    <select
                      value={filters.perPage}
                      onChange={(e) => filters.set({ per_page: e.target.value, page: "1" })}
                      className="rounded border border-[#E5E7EB] bg-white px-1.5 py-0.5 text-[12px] text-[#111827] focus:border-[#14B8A6] focus:outline-none cursor-pointer"
                    >
                      {ROWS_PER_PAGE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => filters.set({ page: String(Math.max(1, filters.page - 1)) })}
                      disabled={filters.page <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#F9FAFB] disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {pageNumbers.map((n, i) =>
                      n === "..." ? (
                        <span key={`dots-${i}`} className="px-1 text-[#9CA3AF] text-xs">…</span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => filters.set({ page: String(n) })}
                          className={`h-7 w-7 rounded text-[12px] font-medium transition-colors ${
                            filters.page === n
                              ? "bg-[#14B8A6] text-white"
                              : "text-[#6B7280] hover:bg-[#F9FAFB]"
                          }`}
                        >
                          {n}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => filters.set({ page: String(Math.min(totalPages, filters.page + 1)) })}
                      disabled={filters.page >= totalPages}
                      className="flex h-7 w-7 items-center justify-center rounded text-[#9CA3AF] hover:bg-[#F9FAFB] disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function PracticePageFallback() {
  return (
    <DashboardLayout>
      <div className="space-y-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div><div className="h-6 w-32 rounded bg-[#F3F4F6]" /><div className="h-3 w-64 rounded bg-[#F3F4F6] mt-2" /></div>
          <div className="h-9 w-60 rounded-lg bg-[#F3F4F6]" />
        </div>
        <div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <div key={i} className="h-20 rounded-xl bg-[#F3F4F6]" />)}</div>
        <div className="flex gap-5">
          <div className="w-[220px] shrink-0"><div className="h-[400px] rounded-xl bg-[#F3F4F6]" /></div>
          <div className="flex-1"><div className="h-[500px] rounded-xl bg-[#F3F4F6]" /></div>
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
