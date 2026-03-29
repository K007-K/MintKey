// Problem detail page — comprehensive view with problem metadata, solve CTA, status tracking, and learning resources
"use client";

import { use, useMemo, useState, useCallback } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { useProblemDetail, useUpdateProblemProgress, usePracticeProgress, useProblems } from "@/lib/api";
import {
  ExternalLink, ArrowLeft, Lightbulb, BookOpen, Clock, CheckCircle2,
  Code2, Loader2, Target, Zap, TrendingUp, Play, ChevronDown, ChevronUp,
  Timer, Award, Hash, Tag, Layers, Eye, EyeOff
} from "lucide-react";
import Link from "next/link";

/* ── Types ──────────────────────────────────────────────── */

interface ProblemDetail {
  id: string;
  source: string;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  description: string | null;
  url: string | null;
  category: string | null;
  study_plans: string[];
  company_tags: string[];
  hints: string[];
  solution_approach: string | null;
  solution_code: string | null;
  complexity_analysis: string | null;
  pattern: string | null;
  lc_number: number | null;
}

interface APIProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  tags: string[];
  url: string | null;
  lc_number: number | null;
  source: string;
}

/* ── Constants ──────────────────────────────────────────── */

const PATTERN_DISPLAY: Record<string, { label: string; icon: string; description: string }> = {
  arrays_hashing: { label: "Arrays & Hashing", icon: "📊", description: "Use hash maps or sets for O(1) lookup. Think about frequency counting." },
  two_pointers: { label: "Two Pointers", icon: "👆", description: "Place two pointers and move them based on a condition. Works on sorted arrays or linked lists." },
  sliding_window: { label: "Sliding Window", icon: "🪟", description: "Maintain a window that expands/shrinks. Track a running result as the window moves." },
  stack: { label: "Stack", icon: "📚", description: "Use LIFO structure for matching pairs, monotonic sequences, or expression evaluation." },
  binary_search: { label: "Binary Search", icon: "🔍", description: "Divide the search space in half each time. Look for a sorted property to exploit." },
  linked_list: { label: "Linked List", icon: "🔗", description: "Use fast/slow pointers, dummy nodes, or reversal techniques." },
  trees: { label: "Trees", icon: "🌳", description: "Think recursively — process root, then recurse on left and right subtrees." },
  heap: { label: "Heap / Priority Queue", icon: "⛰️", description: "Use a heap when you need the min/max element repeatedly. Good for top-K problems." },
  graphs: { label: "Graphs", icon: "🕸️", description: "Model as adjacency list. Use BFS for shortest path, DFS for connectivity/cycles." },
  dynamic_programming: { label: "Dynamic Programming", icon: "🧠", description: "Break into overlapping subproblems. Define state, transition, and base cases." },
  backtracking: { label: "Backtracking", icon: "↩️", description: "Try all possibilities recursively. Prune invalid branches early." },
  greedy: { label: "Greedy", icon: "🎯", description: "Make the locally optimal choice at each step. Prove it leads to global optimum." },
  bit_manipulation: { label: "Bit Manipulation", icon: "💾", description: "Use XOR, AND, OR, shifts to solve problems in O(1) space." },
  math_geometry: { label: "Math & Geometry", icon: "📐", description: "Look for mathematical patterns, formulas, or geometric properties." },
  trie: { label: "Trie", icon: "🔤", description: "Build a prefix tree for efficient string searching and autocomplete." },
  intervals: { label: "Intervals", icon: "📏", description: "Sort by start time. Merge overlapping or find gaps between intervals." },
  strings: { label: "Strings", icon: "📝", description: "Consider character frequency, palindromes, substrings, or pattern matching." },
  sorting: { label: "Sorting", icon: "📶", description: "Sort first, then apply techniques like binary search or two pointers." },
  divide_and_conquer: { label: "Divide & Conquer", icon: "✂️", description: "Split the problem in half, solve each half, then combine results." },
  union_find: { label: "Union Find", icon: "🔗", description: "Use disjoint set union for grouping connected components efficiently." },
};

const STUDY_PLAN_DISPLAY: Record<string, { label: string; color: string }> = {
  neetcode_150: { label: "NeetCode 150", color: "#14B8A6" },
  neetcode_all: { label: "NeetCode All", color: "#3B82F6" },
  blind_75: { label: "Blind 75", color: "#8B5CF6" },
  striver_a2z: { label: "Striver A2Z", color: "#F59E0B" },
  cses: { label: "CSES", color: "#EF4444" },
};

const RESOURCE_LINKS: Record<string, { label: string; urlTemplate: string }[]> = {
  general: [
    { label: "NeetCode Video", urlTemplate: "https://www.youtube.com/results?search_query=neetcode+{title}" },
    { label: "Striver's Explanation", urlTemplate: "https://www.youtube.com/results?search_query=take+u+forward+{title}" },
    { label: "Discuss on LeetCode", urlTemplate: "https://leetcode.com/problems/{slug}/discuss/" },
  ],
};

/* ── Sub-components ────────────────────────────────────── */

function DiffBadge({ difficulty }: { difficulty: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Easy: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
    Medium: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
    Hard: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  };
  const style = map[difficulty] || map.Medium;
  return (
    <span
      className="text-xs font-bold px-3 py-1 rounded-full"
      style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {difficulty}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "solved") return (
    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
      <CheckCircle2 className="h-3.5 w-3.5" /> Solved
    </div>
  );
  if (status === "attempted") return (
    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
      <Clock className="h-3.5 w-3.5" /> Attempted
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
      <Target className="h-3.5 w-3.5" /> Unsolved
    </div>
  );
}

function CollapsibleSection({
  icon: Icon,
  iconColor,
  title,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#F9FAFB] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4.5 w-4.5" style={{ color: iconColor }} />
          <h3 className="text-sm font-semibold text-[#111827]">{title}</h3>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-[#9CA3AF]" /> : <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-[#F3F4F6]">{children}</div>}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────── */

export default function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: rawProblem, isLoading } = useProblemDetail(id);
  const problem = rawProblem as ProblemDetail | undefined;
  const { data: progressData } = usePracticeProgress();
  const updateProgress = useUpdateProblemProgress();
  const [showSolution, setShowSolution] = useState(false);

  // Fetch related problems with same tags (first tag)
  const primaryTag = problem?.tags?.[0] || "";
  const { data: relatedData } = useProblems({ page: 1, per_page: 100 });

  // Get current status
  const status = useMemo(() => {
    if (!Array.isArray(progressData)) return "unsolved";
    const found = progressData.find((p: { problem_id: string; status: string }) => p.problem_id === id);
    return found?.status || "unsolved";
  }, [progressData, id]);

  // Find similar problems (same primary tag, different problem)
  const similarProblems = useMemo(() => {
    if (!relatedData?.problems || !primaryTag) return [];
    return (relatedData.problems as APIProblem[])
      .filter((p) => p.id !== id && p.tags?.some((t: string) => t.toLowerCase() === primaryTag.toLowerCase()))
      .slice(0, 5);
  }, [relatedData, id, primaryTag]);

  const handleStatusToggle = useCallback(() => {
    const next = status === "unsolved" ? "attempted" : status === "attempted" ? "solved" : "unsolved";
    updateProgress.mutate({ problemId: id, status: next });
  }, [status, id, updateProgress]);

  const patternInfo = problem?.pattern ? PATTERN_DISPLAY[problem.pattern] : null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-4 w-32 bg-[#F3F4F6] rounded mb-6" />
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-8">
            <div className="h-6 w-48 bg-[#F3F4F6] rounded mb-4" />
            <div className="h-8 w-96 bg-[#F3F4F6] rounded mb-4" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-[#F3F4F6] rounded-full" />
              <div className="h-6 w-24 bg-[#F3F4F6] rounded-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!problem) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-[#D1D5DB] mx-auto mb-4" />
          <p className="text-lg font-medium text-[#6B7280]">Problem not found</p>
          <Link href="/practice" className="text-[#14B8A6] text-sm mt-3 inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Practice
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Practice
        </Link>

        {/* ── HERO HEADER ──────────────────────────────── */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 md:p-8 mb-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Top metadata row */}
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                {problem.lc_number && (
                  <span className="flex items-center gap-1 text-sm font-mono font-semibold text-[#6B7280] bg-[#F3F4F6] px-2.5 py-0.5 rounded-md">
                    <Hash className="h-3.5 w-3.5" />
                    {problem.lc_number}
                  </span>
                )}
                <DiffBadge difficulty={problem.difficulty || "Medium"} />
                <StatusBadge status={status} />
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-[#111827] mb-4">{problem.title}</h1>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(problem.tags || []).map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/practice?tag=${encodeURIComponent(tag)}`}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] transition-colors"
                  >
                    <Tag className="h-3 w-3 inline mr-1" />
                    {tag}
                  </Link>
                ))}
              </div>

              {/* Study plans */}
              {problem.study_plans?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {problem.study_plans.map((plan: string) => {
                    const planInfo = STUDY_PLAN_DISPLAY[plan];
                    return (
                      <span
                        key={plan}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
                        style={{
                          backgroundColor: planInfo ? `${planInfo.color}15` : "#F0FDFA",
                          color: planInfo?.color || "#0D9488",
                          border: `1px solid ${planInfo ? `${planInfo.color}30` : "#99F6E4"}`,
                        }}
                      >
                        <Layers className="h-3 w-3 inline mr-1" />
                        {planInfo?.label || plan.replace(/_/g, " ")}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 shrink-0">
              {/* PRIMARY CTA: Solve on LeetCode */}
              {problem.url && (
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#14B8A6] to-[#0D9488] text-white text-sm font-bold shadow-lg shadow-[#14B8A6]/20 hover:shadow-xl hover:shadow-[#14B8A6]/30 hover:scale-[1.02] transition-all"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Solve on LeetCode
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>
              )}

              {/* Status toggle */}
              <button
                onClick={handleStatusToggle}
                disabled={updateProgress.isPending}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  status === "solved"
                    ? "border-[#059669] bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5]"
                    : status === "attempted"
                    ? "border-[#D97706] bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7]"
                    : "border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]"
                }`}
              >
                {updateProgress.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === "solved" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : status === "attempted" ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
                {status === "solved" ? "Solved ✓ (Click to reset)" : status === "attempted" ? "Mark as Solved" : "Mark as Attempted"}
              </button>
            </div>
          </div>
        </div>

        {/* ── CONTENT GRID ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT: Main content (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Pattern Strategy Card — always show if pattern exists */}
            {patternInfo && (
              <div className="rounded-xl border-2 border-[#E0F2FE] bg-gradient-to-r from-[#F0F9FF] to-white p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{patternInfo.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#1E40AF] mb-1">
                      Pattern: {patternInfo.label}
                    </h3>
                    <p className="text-sm text-[#3B82F6] leading-relaxed">
                      {patternInfo.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {problem.description && (
              <CollapsibleSection icon={BookOpen} iconColor="#6B7280" title="Problem Description" defaultOpen>
                <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap mt-3">
                  {problem.description}
                </p>
              </CollapsibleSection>
            )}

            {/* Hints */}
            {problem.hints?.length > 0 && (
              <CollapsibleSection icon={Lightbulb} iconColor="#F59E0B" title={`Hints (${problem.hints.length})`}>
                <ol className="space-y-3 mt-3">
                  {problem.hints.map((hint: string, i: number) => (
                    <li
                      key={i}
                      className="text-sm text-[#4B5563] flex gap-3 p-3 rounded-lg bg-[#FFFBEB]/50 border border-[#FDE68A]/30"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-[#FDE68A] text-[#D97706] text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{hint}</span>
                    </li>
                  ))}
                </ol>
              </CollapsibleSection>
            )}

            {/* Solution Approach */}
            {problem.solution_approach && (
              <CollapsibleSection icon={Code2} iconColor="#14B8A6" title="Solution Approach">
                <div className="mt-3">
                  <button
                    onClick={() => setShowSolution(!showSolution)}
                    className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] transition-colors mb-3"
                  >
                    {showSolution ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showSolution ? "Hide Solution" : "Reveal Solution"}
                  </button>
                  {showSolution && (
                    <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                      {problem.solution_approach}
                    </p>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* Complexity Analysis */}
            {problem.complexity_analysis && (
              <CollapsibleSection icon={Timer} iconColor="#6B7280" title="Complexity Analysis">
                <div className="mt-3 p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] font-mono text-sm text-[#4B5563]">
                  {problem.complexity_analysis}
                </div>
              </CollapsibleSection>
            )}

            {/* CTA for when no content sections exist */}
            {!problem.description && !problem.solution_approach && !problem.hints?.length && (
              <div className="rounded-xl border-2 border-dashed border-[#E5E7EB] p-8 text-center bg-[#FAFAFA]">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#14B8A6]/10 to-[#3B82F6]/10 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-[#14B8A6]" />
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#374151] mb-2">Ready to solve this one?</h3>
                <p className="text-sm text-[#9CA3AF] mb-4 max-w-md mx-auto">
                  Open this problem on LeetCode, solve it there, then come back and mark your progress.
                  {patternInfo && ` This is a ${patternInfo.label} problem — ${patternInfo.description.toLowerCase()}`}
                </p>
                {problem.url && (
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14B8A6] text-white text-sm font-bold hover:bg-[#0D9488] transition-colors"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Open on LeetCode
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar (1 col) */}
          <div className="space-y-5">
            {/* Quick Info Card */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#F59E0B]" />
                Quick Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#6B7280]">Difficulty</span>
                  <DiffBadge difficulty={problem.difficulty || "Medium"} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#6B7280]">Source</span>
                  <span className="text-xs font-semibold text-[#374151] capitalize">{problem.source}</span>
                </div>
                {problem.lc_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#6B7280]">LeetCode #</span>
                    <span className="text-xs font-mono font-semibold text-[#374151]">{problem.lc_number}</span>
                  </div>
                )}
                {patternInfo && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[#6B7280]">Pattern</span>
                    <span className="text-xs font-semibold text-[#1E40AF]">
                      {patternInfo.icon} {patternInfo.label}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#6B7280]">Your Status</span>
                  <StatusBadge status={status} />
                </div>
              </div>
            </div>

            {/* Learning Resources */}
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#14B8A6]" />
                Learning Resources
              </h3>
              <div className="space-y-2">
                {RESOURCE_LINKS.general.map((resource) => {
                  const url = resource.urlTemplate
                    .replace("{title}", encodeURIComponent(problem.title))
                    .replace("{slug}", problem.slug || "");
                  return (
                    <a
                      key={resource.label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-colors group"
                    >
                      <span className="text-xs font-medium text-[#374151]">{resource.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#9CA3AF] group-hover:text-[#14B8A6] transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Company Tags */}
            {problem.company_tags?.length > 0 && (
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                <h3 className="text-sm font-bold text-[#111827] mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-[#8B5CF6]" />
                  Asked by Companies
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {problem.company_tags.map((company: string) => (
                    <span
                      key={company}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]"
                    >
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Problems */}
            {similarProblems.length > 0 && (
              <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                <h3 className="text-sm font-bold text-[#111827] mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#3B82F6]" />
                  Similar Problems
                </h3>
                <div className="space-y-1.5">
                  {similarProblems.map((sp) => (
                    <Link
                      key={sp.id}
                      href={`/practice/${sp.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#F9FAFB] transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {sp.lc_number && (
                          <span className="text-[10px] font-mono text-[#9CA3AF] shrink-0">#{sp.lc_number}</span>
                        )}
                        <span className="text-xs font-medium text-[#374151] truncate group-hover:text-[#14B8A6] transition-colors">
                          {sp.title}
                        </span>
                      </div>
                      <DiffBadge difficulty={sp.difficulty || "Medium"} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
