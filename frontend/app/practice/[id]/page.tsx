// Problem detail page — shows problem info, hints, solution approach, and "Solve ↗" link
"use client";

import { use } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { useProblemDetail, useUpdateProblemProgress, usePracticeProgress } from "@/lib/api";
import { ExternalLink, ArrowLeft, Lightbulb, BookOpen, Clock, CheckCircle2, Code2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

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
      className="text-xs font-semibold px-3 py-1 rounded-md"
      style={{ backgroundColor: style.bg, color: style.color }}
    >
      {difficulty}
    </span>
  );
}

/* ── Main page ──────────────────────────────────────── */

export default function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: rawProblem, isLoading } = useProblemDetail(id);
  const problem = rawProblem as ProblemDetail | undefined;
  const { data: progressData } = usePracticeProgress();
  const updateProgress = useUpdateProblemProgress();

  // Get current status for this problem
  const status = useMemo(() => {
    if (!Array.isArray(progressData)) return "unsolved";
    const found = progressData.find((p: { problem_id: string; status: string }) => p.problem_id === id);
    return found?.status || "unsolved";
  }, [progressData, id]);

  const handleMarkSolved = () => {
    const next = status === "solved" ? "unsolved" : "solved";
    updateProgress.mutate({ problemId: id, status: next });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-[#14B8A6]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!problem) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-lg text-[#6B7280]">Problem not found</p>
          <Link href="/practice" className="text-[#14B8A6] text-sm mt-2 inline-block hover:underline">
            ← Back to Practice
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Practice
        </Link>

        {/* Problem header */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 mb-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {problem.lc_number && (
                  <span className="text-sm font-mono text-[#9CA3AF]">#{problem.lc_number}</span>
                )}
                <DiffBadge difficulty={problem.difficulty || "Medium"} />
                <span className="text-xs text-[#9CA3AF] capitalize">{problem.source}</span>
              </div>
              <h1 className="text-xl font-bold text-[#111827] mb-3">{problem.title}</h1>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(problem.tags || []).map((tag: string) => (
                  <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280]">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Study plans */}
              {problem.study_plans?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {problem.study_plans.map((plan: string) => (
                    <span key={plan} className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#F0FDFA] text-[#0D9488]">
                      {plan.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 ml-6">
              {problem.url && (
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14B8A6] text-white text-sm font-semibold hover:bg-[#0D9488] transition-colors"
                >
                  Solve on LeetCode
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button
                onClick={handleMarkSolved}
                disabled={updateProgress.isPending}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  status === "solved"
                    ? "border-[#14B8A6] bg-[#F0FDFA] text-[#0D9488]"
                    : "border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]"
                }`}
              >
                {updateProgress.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {status === "solved" ? "Solved ✓" : "Mark as Solved"}
              </button>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Description */}
          {problem.description && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-[#6B7280]" />
                <h2 className="text-sm font-semibold text-[#111827]">Problem Description</h2>
              </div>
              <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap">{problem.description}</p>
            </div>
          )}

          {/* Hints */}
          {problem.hints?.length > 0 && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-[#F59E0B]" />
                <h2 className="text-sm font-semibold text-[#111827]">Hints</h2>
              </div>
              <ol className="space-y-2">
                {problem.hints.map((hint: string, i: number) => (
                  <li key={i} className="text-sm text-[#4B5563] flex gap-2">
                    <span className="text-[#9CA3AF] font-mono text-xs mt-0.5">{i + 1}.</span>
                    {hint}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Solution approach */}
          {problem.solution_approach && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="h-4 w-4 text-[#14B8A6]" />
                <h2 className="text-sm font-semibold text-[#111827]">Solution Approach</h2>
              </div>
              <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-wrap">{problem.solution_approach}</p>
            </div>
          )}

          {/* Complexity */}
          {problem.complexity_analysis && (
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-[#6B7280]" />
                <h2 className="text-sm font-semibold text-[#111827]">Complexity</h2>
              </div>
              <p className="text-sm text-[#4B5563] font-mono">{problem.complexity_analysis}</p>
            </div>
          )}
        </div>

        {/* Placeholder when no content is available */}
        {!problem.description && !problem.solution_approach && !problem.hints?.length && (
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-8 text-center">
            <BookOpen className="h-8 w-8 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-sm text-[#9CA3AF]">
              No detailed content available yet for this problem.
            </p>
            <p className="text-xs text-[#D1D5DB] mt-1">
              AI explanations will be generated in a future sprint.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
