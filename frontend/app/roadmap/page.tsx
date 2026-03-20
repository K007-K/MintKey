// My Roadmaps — hub page showing target company roadmap cards
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { CompanyLogoIcon } from "@/components/ui/CompanyLogos";
import { Plus, Clock, Loader2, Info } from "lucide-react";
import { useCompanies, useMatchScores } from "@/lib/api";
import { useTargetCompanies } from "@/lib/useTargetCompanies";

/* ── SVG Circular Progress Ring ─────────────────────────── */
function ScoreRing({ pct, size = 52 }: { pct: number; size?: number }) {
  const strokeW = 4.5;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const hasScore = pct > 0;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} className="flex-shrink-0" viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={strokeW} />
      {/* Colored arc */}
      {hasScore && (
        <circle
          cx={cx} cy={cy} r={r}
          fill="none" stroke="#10B981" strokeWidth={strokeW}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          className="transition-all duration-700"
        />
      )}
      {/* Center label */}
      {hasScore ? (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 14, fontWeight: 700, fill: "#111827" }}>
          {pct}%
        </text>
      ) : (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 16, fontWeight: 700, fill: "#9CA3AF" }}>
          &#x2014;
        </text>
      )}
    </svg>
  );
}

/* ── Types ─────────────────────────────────────────────── */
interface RoadmapCard {
  slug: string;
  name: string;
  role: string;
  score: number;
  currentWeek: number;
  totalWeeks: number;
  progressPct: number;
  phase: string;
  problemsDone: number;
  problemsTotal: number;
  projectsDone: number;
  projectsTotal: number;
  hoursThisWeek: number;
  lastStudied: string;
  started: boolean;
}

/* ── Build card data from company API ──────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRoadmapCard(raw: Record<string, any>, score: number): RoadmapCard {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hiring = (raw.hiring_data || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsa = (raw.dsa_requirements || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = (raw.projects || {}) as any;
  const minProblems = dsa.minimum_problems || {};
  const impressiveProjects = projects.impressive_projects || [];
  const roles = hiring.roles || [];

  return {
    slug: raw.slug as string,
    name: raw.name as string,
    role: roles[0] || "Software Engineer",
    score,
    currentWeek: 0,
    totalWeeks: 8,
    progressPct: 0,
    phase: "",
    problemsDone: 0,
    problemsTotal: minProblems.total || 80,
    projectsDone: 0,
    projectsTotal: impressiveProjects.length || 5,
    hoursThisWeek: 0,
    lastStudied: "",
    started: false,
  };
}

/* ── Page ──────────────────────────────────────────────── */
export default function RoadmapPage() {
  const { data: rawCompanies, isLoading } = useCompanies();
  const { data: rawScores } = useMatchScores();
  const { targetSlugs } = useTargetCompanies();

  /* Build score lookup */
  const scoreMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (rawScores && Array.isArray(rawScores)) {
      for (const s of rawScores as { company_slug: string; overall_score: number }[]) {
        map[s.company_slug] = Math.round(s.overall_score);
      }
    }
    return map;
  }, [rawScores]);

  /* Build roadmap cards for target companies */
  const cards: RoadmapCard[] = useMemo(() => {
    if (!rawCompanies || !Array.isArray(rawCompanies)) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (rawCompanies as Record<string, any>[])
      .filter((c) => targetSlugs.includes(c.slug as string))
      .map((c) => buildRoadmapCard(c, scoreMap[c.slug as string] || 0));
  }, [rawCompanies, targetSlugs, scoreMap]);

  const activePlans = cards.filter((c) => c.started).length;

  if (isLoading) {
    return (
      <DashboardLayout title="My Roadmaps" subtitle="Your personalized preparation plans for target companies">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
          <span className="ml-3 text-sm text-[#6B7280]">Loading roadmaps...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Roadmaps" subtitle="Your personalized preparation plans for target companies">
      <div className="max-w-[900px] mx-auto space-y-6">

        {/* ── Header badge ── */}
        <div className="flex items-center justify-between">
          <div />
          <span className="rounded-full border border-[#10B981] px-3 py-1 text-xs font-semibold text-[#10B981]">
            {activePlans > 0 ? `${activePlans} Active Plan${activePlans !== 1 ? "s" : ""}` : "No Active Plans"}
          </span>
        </div>

        {/* ── Stats bar — vertically stacked ── */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-[#111827]">0</div>
            <div className="text-xs text-[#6B7280]">total study hours</div>
          </div>
          <div className="text-center border-x border-[#F3F4F6]">
            <div className="text-lg font-bold text-[#111827]">🔥 0</div>
            <div className="text-xs text-[#6B7280]">day streak</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-[#10B981]">{cards.length > 0 ? `${Math.round(cards.reduce((a, c) => a + c.score, 0) / cards.length)}%` : "—"}</div>
            <div className="text-xs text-[#6B7280]">avg match score</div>
          </div>
        </div>

        {/* ── Roadmap cards grid ── */}
        <div className="grid gap-5 sm:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.slug}
              className={`rounded-xl border bg-white p-6 transition-all hover:shadow-md ${
                card.started ? "border-l-4 border-l-[#10B981] border-[#E5E7EB]" : "border-[#E5E7EB]"
              }`}
            >
              {/* Header: logo + name + score ring */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <CompanyLogoIcon slug={card.slug} size={40} />
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">{card.name}</h3>
                    <p className="text-xs text-[#9CA3AF]">{card.role}</p>
                  </div>
                </div>
                <ScoreRing pct={card.score} size={48} />
              </div>

              {/* Progress section */}
              <div className="mb-4">
                {card.started ? (
                  <>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#374151] font-medium">Week {card.currentWeek} of {card.totalWeeks}</span>
                      <span className="text-[#9CA3AF]">{card.progressPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-[#10B981] transition-all duration-700" style={{ width: `${card.progressPct}%` }} />
                    </div>
                    {card.phase && (
                      <span className="inline-block rounded-md border border-[#10B981] px-2.5 py-1 text-[11px] font-medium text-[#10B981] mb-3">
                        {card.phase}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#9CA3AF] font-medium">Not started</span>
                      <span className="text-[#9CA3AF]">0%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E5E7EB] overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-[#D1D5DB]" style={{ width: "0%" }} />
                    </div>
                  </>
                )}
              </div>

              {/* Stats row */}
              <p className="text-xs text-[#9CA3AF] mb-4">
                {card.problemsDone}/{card.problemsTotal} Problems · {card.projectsDone}/{card.projectsTotal} Projects · {card.hoursThisWeek} hrs
              </p>

              {/* CTA button */}
              {card.started ? (
                <Link
                  href={`/roadmap/${card.slug}`}
                  className="flex items-center justify-center w-full rounded-lg bg-[#10B981] py-3 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.98] transition-all"
                >
                  Continue Roadmap →
                </Link>
              ) : (
                <Link
                  href={`/roadmap/${card.slug}`}
                  className="flex items-center justify-center w-full rounded-lg border border-[#10B981] py-3 text-sm font-semibold text-[#10B981] hover:bg-[#ECFDF5] active:scale-[0.98] transition-all"
                >
                  Start Roadmap →
                </Link>
              )}

              {/* Last studied / analysis note */}
              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-[#9CA3AF]">
                <Clock className="h-3 w-3" />
                {card.started && card.lastStudied ? card.lastStudied : "Analysis required to generate roadmap"}
              </div>
            </div>
          ))}

          {/* Add Target Company card */}
          {cards.length < 5 && (
            <Link
              href="/companies"
              className="rounded-xl border-2 border-dashed border-[#D1D5DB] bg-white p-6 flex flex-col items-center justify-center gap-3 min-h-[280px] hover:border-[#10B981] hover:bg-[#F0FDF4] transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#D1D5DB] flex items-center justify-center group-hover:border-[#10B981] transition-colors">
                <Plus className="h-6 w-6 text-[#D1D5DB] group-hover:text-[#10B981] transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#374151] group-hover:text-[#10B981] transition-colors">+ Add Target Company</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Browse and add up to 5 targets</p>
              </div>
            </Link>
          )}
        </div>

        {/* ── Footer info ── */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF] pt-2">
          <Info className="h-3.5 w-3.5" />
          <span>You can target up to 5 companies simultaneously.</span>
          <Link href="/companies" className="text-[#10B981] font-medium hover:underline">Manage targets →</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
