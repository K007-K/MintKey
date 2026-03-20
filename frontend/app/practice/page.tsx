// DSA Practice Hub — unified problem database with filters, study plans, progress tracking
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { useState, useMemo } from "react";
import { Search, Hash, CheckCircle2, Clock, Target, ExternalLink } from "lucide-react";

/* ── Types ──────────────────────────────────────────────── */

interface Problem {
  lc_number: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  url: string;
  tags: string[];
  study_plans: string[];
  status: "unsolved" | "attempted" | "solved";
}

/* ── Mock data (will be replaced by API call) ────────── */

const STUDY_PLANS = [
  { key: "neetcode_150", name: "NeetCode 150", total: 150, solved: 127 },
  { key: "blind_75", name: "Blind 75", total: 75, solved: 61 },
  { key: "neetcode_all", name: "NeetCode All", total: 450, solved: 126 },
  { key: "striver_a2z", name: "Striver A2Z", total: 350, solved: 88 },
  { key: "cses", name: "CSES", total: 300, solved: 66 },
];

const MOCK_PROBLEMS: Problem[] = [
  { lc_number: 1, title: "Two Sum", difficulty: "Easy", url: "https://leetcode.com/problems/two-sum/", tags: ["Array", "Hash Map"], study_plans: ["neetcode_150", "blind_75"], status: "solved" },
  { lc_number: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", tags: ["Hash Table", "String", "Sliding Window"], study_plans: ["neetcode_150", "blind_75"], status: "attempted" },
  { lc_number: 23, title: "Merge k Sorted Lists", difficulty: "Hard", url: "https://leetcode.com/problems/merge-k-sorted-lists/", tags: ["Linked List", "Divide and Conquer", "Heap"], study_plans: ["neetcode_150", "blind_75"], status: "unsolved" },
  { lc_number: 121, title: "Best Time to Buy and Sell Stock", difficulty: "Easy", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", tags: ["Array", "Dynamic Programming"], study_plans: ["neetcode_150", "blind_75"], status: "solved" },
  { lc_number: 200, title: "Number of Islands", difficulty: "Medium", url: "https://leetcode.com/problems/number-of-islands/", tags: ["Array", "DFS", "BFS", "Union Find"], study_plans: ["neetcode_150", "blind_75"], status: "unsolved" },
  { lc_number: 15, title: "3Sum", difficulty: "Medium", url: "https://leetcode.com/problems/3sum/", tags: ["Array", "Two Pointers", "Sorting"], study_plans: ["neetcode_150", "blind_75"], status: "solved" },
  { lc_number: 53, title: "Maximum Subarray", difficulty: "Medium", url: "https://leetcode.com/problems/maximum-subarray/", tags: ["Array", "Divide and Conquer", "DP"], study_plans: ["neetcode_150", "blind_75"], status: "solved" },
  { lc_number: 70, title: "Climbing Stairs", difficulty: "Easy", url: "https://leetcode.com/problems/climbing-stairs/", tags: ["Math", "DP", "Memoization"], study_plans: ["neetcode_150"], status: "solved" },
  { lc_number: 124, title: "Binary Tree Maximum Path Sum", difficulty: "Hard", url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/", tags: ["Tree", "DFS", "DP"], study_plans: ["neetcode_150"], status: "unsolved" },
  { lc_number: 42, title: "Trapping Rain Water", difficulty: "Hard", url: "https://leetcode.com/problems/trapping-rain-water/", tags: ["Array", "Two Pointers", "Stack"], study_plans: ["neetcode_150","blind_75"], status: "attempted" },
  { lc_number: 11, title: "Container With Most Water", difficulty: "Medium", url: "https://leetcode.com/problems/container-with-most-water/", tags: ["Array", "Two Pointers", "Greedy"], study_plans: ["neetcode_150", "blind_75"], status: "solved" },
  { lc_number: 49, title: "Group Anagrams", difficulty: "Medium", url: "https://leetcode.com/problems/group-anagrams/", tags: ["Array", "Hash Table", "String", "Sorting"], study_plans: ["neetcode_150", "blind_75"], status: "solved" },
];

const SOURCES = ["All", "NeetCode", "Striver", "CSES", "Blind 75"];
const DIFFICULTIES = [
  { label: "All", value: "All", color: "" },
  { label: "Easy", value: "Easy", color: "#22C55E" },
  { label: "Medium", value: "Medium", color: "#F59E0B" },
  { label: "Hard", value: "Hard", color: "#EF4444" },
];

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

/* ── Main page ──────────────────────────────────────── */

export default function PracticePage() {
  const [activeSource, setActiveSource] = useState("All");
  const [activeDifficulty, setActiveDifficulty] = useState("All");
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 50;

  /* Stats */
  const totalProblems = 780;
  const solvedCount = 342;
  const attemptedCount = 89;
  const accuracy = 79;

  /* Filtered problems */
  const filtered = useMemo(() => {
    let list = [...MOCK_PROBLEMS];
    if (activeDifficulty !== "All") {
      list = list.filter((p) => p.difficulty === activeDifficulty);
    }
    if (activePlan) {
      list = list.filter((p) => p.study_plans.includes(activePlan));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || String(p.lc_number).includes(q)
      );
    }
    return list;
  }, [activeDifficulty, activePlan, search]);

  const totalFiltered = filtered.length;
  const pagedProblems = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));

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
              {STUDY_PLANS.map((plan) => {
                const pct = Math.round((plan.solved / plan.total) * 100);
                const isActive = activePlan === plan.key;
                return (
                  <button
                    key={plan.key}
                    onClick={() => setActivePlan(isActive ? null : plan.key)}
                    className={`w-full text-left transition-colors rounded-lg p-2 -mx-2 ${
                      isActive ? "bg-[#F0FDFA]" : "hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[13px] font-medium ${
                          isActive ? "text-[#0D9488]" : "text-[#111827]"
                        }`}
                      >
                        {plan.name}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF]">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isActive ? "#14B8A6" : "#3B82F6",
                        }}
                      />
                    </div>
                  </button>
                );
              })}
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
            <StatCard label="TOTAL PROBLEMS" value={totalProblems} icon={<Hash className="h-4 w-4" />} iconBg="#F3F4F6" iconColor="#6B7280" />
            <StatCard label="SOLVED" value={solvedCount} icon={<CheckCircle2 className="h-4 w-4" />} iconBg="#ECFDF5" iconColor="#059669" />
            <StatCard label="ATTEMPTED" value={attemptedCount} icon={<Clock className="h-4 w-4" />} iconBg="#FFFBEB" iconColor="#D97706" />
            <StatCard label="ACCURACY" value={`${accuracy}%`} icon={<Target className="h-4 w-4" />} iconBg="#F0FDFA" iconColor="#14B8A6" />
          </div>

          {/* Filter bar: Source pills + Difficulty pills */}
          <div className="flex items-center gap-6 mb-4">
            {/* Source pills */}
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

            {/* Divider */}
            <div className="h-5 w-px bg-[#E5E7EB]" />

            {/* Difficulty pills */}
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
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
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
            <div className="divide-y divide-[#F9FAFB]">
              {pagedProblems.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#9CA3AF]">
                  No problems found
                </div>
              ) : (
                pagedProblems.map((p) => (
                  <div
                    key={p.lc_number}
                    className={`grid grid-cols-[48px_50px_1fr_90px_1fr_70px] items-center px-4 py-3 transition-colors ${
                      p.status === "solved" ? "bg-[#F0FDF4]/40" : "hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div>
                      <StatusDot status={p.status} />
                    </div>
                    <div className="text-xs text-[#9CA3AF] font-mono">{p.lc_number}</div>
                    <div className="text-sm font-medium text-[#111827] truncate pr-3">
                      {p.title}
                    </div>
                    <div>
                      <DiffBadge difficulty={p.difficulty} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(p.tags || []).slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-center">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#14B8A6] text-[#14B8A6] text-[11px] font-semibold hover:bg-[#F0FDFA] transition-colors"
                      >
                        Solve
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-[#6B7280]">
              Showing <span className="font-semibold text-[#111827]">{((page - 1) * perPage) + 1}-{Math.min(page * perPage, totalFiltered)}</span> of{" "}
              <span className="font-semibold text-[#111827]">{totalFiltered}</span>
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
                    page === n
                      ? "bg-[#14B8A6] text-white"
                      : "text-[#6B7280] hover:bg-[#F9FAFB]"
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
