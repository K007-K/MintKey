// DSA Practice Hub — unified problem database with filters, study plans, progress tracking
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { useState, useMemo } from "react";
import { Search, Hash, CheckCircle2, Clock, Target, ExternalLink, Loader2 } from "lucide-react";
import { useProblems, useStudyPlans, usePracticeStats, usePracticeProgress, useUpdateProblemProgress } from "@/lib/api";

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

const PLAN_DISPLAY: Record<string, string> = {
  neetcode_150: "NeetCode 150",
  neetcode_all: "NeetCode All",
  blind_75: "Blind 75",
  striver_a2z: "Striver A2Z",
  cses: "CSES",
};

/* ── Status icon ─────────────────────────────────────── */

function StatusDot({ status }: { status: string }) {
  if (status === "solved") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#14B8A6]">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (status === "attempted") {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F59E0B]">
        <Clock className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
      </div>
    );
  }
  return <div className="h-5 w-5 rounded-full border-2 border-[#D1D5DB]" />;
}

/* ── Difficulty badge ──────────────────────────────────── */

function DiffBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Easy: { bg: "#ECFDF5", color: "#059669" },
    Medium: { bg: "#FFFBEB", color: "#D97706" },
    Hard: { bg: "#FEF2F2", color: "#DC2626" },
  };
  const style = map[difficulty] || map.Medium;
  return (
    <span
      className="text-[11px] font-semibold px-2.5 py-0.5 rounded"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {difficulty}
    </span>
  );
}

/* ── Skeleton loader ─────────────────────────────────── */

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[48px_50px_1fr_90px_1fr_70px] items-center px-4 py-4 border-b border-[#F9FAFB]">
          <div className="h-5 w-5 rounded-full bg-[#F3F4F6]" />
          <div className="h-3 w-8 rounded bg-[#F3F4F6]" />
          <div className="h-4 w-48 rounded bg-[#F3F4F6]" />
          <div className="h-5 w-14 rounded bg-[#F3F4F6]" />
          <div className="flex gap-1">
            <div className="h-4 w-12 rounded bg-[#F3F4F6]" />
            <div className="h-4 w-16 rounded bg-[#F3F4F6]" />
          </div>
          <div className="h-6 w-14 rounded bg-[#F3F4F6] mx-auto" />
        </div>
      ))}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────── */

export default function PracticePage() {
  const [activeSource, setActiveSource] = useState("All");
  const [activeDifficulty, setActiveDifficulty] = useState("All");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 50;

  /* ── API source mapping ──────────────────────────── */
  const sourceMap: Record<string, string> = {
    "NeetCode": "neetcode",
    "Striver": "striver",
    "CSES": "cses",
    "Blind 75": "blind75",
  };

  /* ── API calls ──────────────────────────────────── */
  const { data: rawProblemsData, isLoading: loadingProblems } = useProblems({
    source: activeSource !== "All" ? sourceMap[activeSource] || activeSource.toLowerCase() : undefined,
    difficulty: activeDifficulty !== "All" ? activeDifficulty : undefined,
    study_plan: activePlan || undefined,
    search: search.trim() || undefined,
    page,
    per_page: perPage,
  });

  const { data: rawPlansData } = useStudyPlans();
  const { data: rawStatsData } = usePracticeStats();
  const { data: progressData } = usePracticeProgress();
  const updateProgress = useUpdateProblemProgress();

  /* ── Derived data (cast from React Query defaults) ── */
  const problemsData = rawProblemsData as { problems: APIProblem[]; total: number; total_pages: number } | undefined;
  const problems: APIProblem[] = problemsData?.problems || [];
  const totalFiltered = problemsData?.total || 0;
  const totalPages = problemsData?.total_pages || 1;

  const plans: StudyPlan[] = (rawPlansData as StudyPlan[] | undefined) || [];
  const statsData = rawStatsData as { total_solved: number; total_attempted: number } | undefined;
  const totalProblems = plans.reduce((sum: number, p: StudyPlan) => sum + p.total, 0) || totalFiltered;
  const solvedCount = statsData?.total_solved || 0;
  const attemptedCount = statsData?.total_attempted || 0;
  const accuracy = solvedCount + attemptedCount > 0
    ? Math.round((solvedCount / (solvedCount + attemptedCount)) * 100)
    : 0;

  // Build progress lookup: problem_id → status
  const progressMap = useMemo(() => {
    const map = new Map<string, string>();
    if (Array.isArray(progressData)) {
      (progressData as ProgressRecord[]).forEach((p) => {
        map.set(p.problem_id, p.status);
      });
    }
    return map;
  }, [progressData]);

  const getStatus = (problemId: string) => progressMap.get(problemId) || "unsolved";

  /* ── Handlers ──────────────────────────────────── */
  const handleToggleSolved = (problemId: string) => {
    const current = getStatus(problemId);
    const next = current === "solved" ? "unsolved" : "solved";
    updateProgress.mutate({ problemId, status: next });
  };

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        {/* ── Sidebar: Study Plans ─────────────────────── */}
        <div className="w-[200px] shrink-0">
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-4">
              Study Plans
            </h3>
            <div className="space-y-3">
              {plans.length > 0 ? plans.map((plan) => {
                const isActive = activePlan === plan.plan;
                // Solved count per plan not available from API yet — show total
                return (
                  <button
                    key={plan.plan}
                    onClick={() => { setActivePlan(isActive ? null : plan.plan); setPage(1); }}
                    className={`w-full text-left transition-colors rounded-lg p-2 -mx-2 ${
                      isActive ? "bg-[#F0FDFA]" : "hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[13px] font-medium ${isActive ? "text-[#0D9488]" : "text-[#111827]"}`}>
                        {PLAN_DISPLAY[plan.plan] || plan.plan}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF]">{plan.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: isActive ? "100%" : "0%",
                          backgroundColor: isActive ? "#14B8A6" : "#3B82F6",
                        }}
                      />
                    </div>
                  </button>
                );
              }) : (
                /* Fallback when API returns empty — show default plans */
                ["NeetCode 150", "Blind 75", "NeetCode All", "Striver A2Z", "CSES"].map((name) => (
                  <div key={name} className="p-2 -mx-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-medium text-[#111827]">{name}</span>
                      <span className="text-[11px] text-[#9CA3AF]">—</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F3F4F6]" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Main content ─────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Page header: title + search */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-[22px] font-bold text-[#111827]">DSA Practice</h1>
              <p className="text-[13px] text-[#6B7280] mt-0.5">
                ~800 problems from NeetCode, Striver, Blind 75, CSES
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search problems..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-[240px] rounded-lg border border-[#E5E7EB] bg-white py-2 pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#14B8A6] focus:outline-none focus:ring-1 focus:ring-[#14B8A6]/30"
              />
            </div>
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            <StatCard label="TOTAL PROBLEMS" value={totalProblems || "—"} icon={<Hash className="h-4 w-4" />} iconBg="#F3F4F6" iconColor="#6B7280" />
            <StatCard label="SOLVED" value={solvedCount} icon={<CheckCircle2 className="h-4 w-4" />} iconBg="#ECFDF5" iconColor="#059669" />
            <StatCard label="ATTEMPTED" value={attemptedCount} icon={<Clock className="h-4 w-4" />} iconBg="#FFFBEB" iconColor="#D97706" />
            <StatCard label="ACCURACY" value={accuracy > 0 ? `${accuracy}%` : "—"} icon={<Target className="h-4 w-4" />} iconBg="#F0FDFA" iconColor="#14B8A6" />
          </div>

          {/* Filter bar: Source pills + Difficulty pills */}
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-1.5">
              {SOURCES.map((src) => (
                <button
                  key={src}
                  onClick={() => { setActiveSource(src); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                    activeSource === src
                      ? "bg-[#14B8A6] text-white"
                      : "border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
            <div className="h-5 w-px bg-[#E5E7EB]" />
            <div className="flex items-center gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => { setActiveDifficulty(d.value); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                    activeDifficulty === d.value
                      ? "bg-[#14B8A6] text-white"
                      : "border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                  }`}
                >
                  {d.color && activeDifficulty !== d.value && (
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  )}
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Problem table */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[48px_50px_1fr_90px_1fr_70px] items-center px-4 py-3 border-b border-[#F3F4F6] text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
              <div>Status</div>
              <div>#</div>
              <div>Title</div>
              <div>Difficulty</div>
              <div>Tags</div>
              <div className="text-center">Action</div>
            </div>

            {/* Rows */}
            {loadingProblems ? (
              <TableSkeleton />
            ) : (
              <div className="divide-y divide-[#F9FAFB]">
                {problems.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-[#9CA3AF]">No problems found</p>
                    <p className="text-xs text-[#D1D5DB] mt-1">
                      {totalProblems === 0
                        ? "Run seed_problems.py to populate the database"
                        : "Try adjusting your filters"}
                    </p>
                  </div>
                ) : (
                  problems.map((p: APIProblem) => {
                    const status = getStatus(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`grid grid-cols-[48px_50px_1fr_90px_1fr_70px] items-center px-4 py-3 transition-colors ${
                          status === "solved" ? "bg-[#F0FDF4]/40" : "hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <button onClick={() => handleToggleSolved(p.id)} className="hover:opacity-70 transition-opacity">
                          <StatusDot status={status} />
                        </button>
                        <div className="text-xs text-[#9CA3AF] font-mono">{p.lc_number || "—"}</div>
                        <div className="text-sm font-medium text-[#111827] truncate pr-3">
                          {p.title}
                        </div>
                        <div>
                          <DiffBadge difficulty={p.difficulty || "Medium"} />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(p.tags || []).slice(0, 4).map((tag: string) => (
                            <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">
                              {tag}
                            </span>
                          ))}
                        </div>
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
                  })
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-[#6B7280]">
                Showing{" "}
                <span className="font-semibold text-[#111827]">
                  {totalFiltered > 0 ? ((page - 1) * perPage) + 1 : 0}-{Math.min(page * perPage, totalFiltered)}
                </span>{" "}
                of <span className="font-semibold text-[#111827]">{totalFiltered}</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-2 py-1 rounded text-[#9CA3AF] hover:bg-[#F9FAFB] disabled:opacity-40"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-7 w-7 rounded text-sm font-medium transition-colors ${
                      page === n ? "bg-[#14B8A6] text-white" : "text-[#6B7280] hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                {totalPages > 5 && (
                  <>
                    <span className="text-[#9CA3AF] px-1">…</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`h-7 w-7 rounded text-sm font-medium transition-colors ${
                        page === totalPages ? "bg-[#14B8A6] text-white" : "text-[#6B7280] hover:bg-[#F9FAFB]"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="px-2 py-1 rounded text-[#9CA3AF] hover:bg-[#F9FAFB] disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ── Stat card component ──────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 flex items-center gap-3">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">{label}</p>
        <p className="text-2xl font-bold text-[#111827] leading-tight">{value}</p>
      </div>
    </div>
  );
}
