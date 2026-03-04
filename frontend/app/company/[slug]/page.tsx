// Company detail / blueprint page — gap-first intelligent design
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { CompanyLogoIcon } from "@/components/ui/CompanyLogos";
import { AlertTriangle, ArrowLeft, ExternalLink, BookOpen, ArrowRight } from "lucide-react";

/* ─── Types ─── */
interface TopicGap {
  name: string;
  required: number;
  solved: number;
  pct: number;
  impact: number;
}
interface InterviewStage { label: string; duration: string; }
interface Resource { name: string; priority: "HIGH" | "MEDIUM" | "LOW"; url: string; }

/* ─── Static data per company (will be dynamic later) ─── */
const COMPANY_DATA: Record<string, {
  name: string; role: string; tier: string; salary: string; dsaLevel: string;
  matchScore: number;
  difficultyMap: { area: string; level: string; color: string }[];
  dsaTopics: TopicGap[];
  sysDesignTopics: { name: string; pct: number }[];
  projects: string[];
  timeline: InterviewStage[];
  resources: Resource[];
}> = {
  google: {
    name: "Google", role: "SDE-1 Hiring Blueprint", tier: "FAANG", salary: "$150k – $280k", dsaLevel: "Extreme DSA",
    matchScore: 67,
    difficultyMap: [
      { area: "DSA Importance", level: "Very High", color: "#DC2626" },
      { area: "System Design", level: "Medium", color: "#D97706" },
      { area: "Projects", level: "Important", color: "#10B981" },
    ],
    dsaTopics: [
      { name: "Dynamic Programming", required: 40, solved: 8, pct: 20, impact: 8 },
      { name: "Graphs", required: 30, solved: 24, pct: 80, impact: 3 },
      { name: "Trees", required: 25, solved: 25, pct: 100, impact: 0 },
      { name: "Arrays & Hashing", required: 35, solved: 30, pct: 86, impact: 2 },
      { name: "Binary Search", required: 20, solved: 14, pct: 70, impact: 4 },
      { name: "Sliding Window", required: 15, solved: 6, pct: 40, impact: 5 },
    ],
    sysDesignTopics: [
      { name: "Distributed Systems", pct: 45 },
      { name: "Database Design", pct: 60 },
      { name: "API Design", pct: 80 },
      { name: "Caching Strategies", pct: 30 },
    ],
    projects: [
      "Distributed backend service with microservices architecture",
      "Real-time data pipeline handling 10k+ events/sec",
      "Open-source contribution with meaningful code review",
      "Frontend project with performance optimization focus",
    ],
    timeline: [
      { label: "OA", duration: "90 min" },
      { label: "Tech 1", duration: "45 min" },
      { label: "Tech 2", duration: "45 min" },
      { label: "System Design", duration: "60 min" },
      { label: "Googleyness", duration: "45 min" },
    ],
    resources: [
      { name: "NeetCode 150", priority: "HIGH", url: "#" },
      { name: "Grokking System Design", priority: "HIGH", url: "#" },
      { name: "Aditya Verma DP Playlist", priority: "HIGH", url: "#" },
      { name: "System Design Primer", priority: "MEDIUM", url: "#" },
      { name: "LeetCode Google Tag", priority: "MEDIUM", url: "#" },
      { name: "Google Interview Tips Blog", priority: "LOW", url: "#" },
    ],
  },
};

const TABS = ["Overview", "DSA", "System Design", "Projects", "Interview", "Resources"] as const;
type Tab = typeof TABS[number];

/* ─── Page ─── */
export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const data = COMPANY_DATA[slug] || COMPANY_DATA.google;
  const name = data?.name || slug.charAt(0).toUpperCase() + slug.slice(1);

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [showSticky, setShowSticky] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setShowSticky(rect.bottom < 0);
      }
    };
    const main = document.querySelector("main");
    main?.addEventListener("scroll", handleScroll);
    return () => main?.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <DashboardLayout title={`${name} Blueprint`} subtitle="Company-specific preparation roadmap">
      <div className="relative">
        {/* Back button */}
        <button onClick={() => router.push("/companies")} className="mb-4 flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Companies
        </button>

        {/* ─── HERO SECTION ─── */}
        <div ref={heroRef} className="rounded-lg border border-[#e5e7eb] bg-white p-6 mb-5">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Left: Logo + Info */}
            <div className="flex items-start gap-4 flex-1">
              <CompanyLogoIcon slug={slug} size={56} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-[#111827]">{name.toUpperCase()}</h1>
                </div>
                <p className="text-sm text-[#6B7280] mb-2.5">{data.role}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-md bg-[#EEF2FF] px-2.5 py-1 text-[11px] font-semibold text-[#4F46E5]">{data.tier}</span>
                  <span className="rounded-md bg-[#F3F4F6] px-2.5 py-1 text-[11px] font-semibold text-[#374151]">{data.salary}</span>
                  <span className="rounded-md bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-semibold text-[#DC2626]">{data.dsaLevel}</span>
                </div>
              </div>
            </div>

            {/* Right: Match Score + CTAs */}
            <div className="md:text-right space-y-3">
              <div>
                <p className="text-xs text-[#9CA3AF] mb-1">Your Match Score</p>
                <div className="flex items-center gap-3 md:justify-end">
                  <span className="text-3xl font-bold text-[#111827]">{data.matchScore}%</span>
                  <div className="w-40 h-3 rounded-full bg-[#F3F4F6] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${data.matchScore}%`, backgroundColor: data.matchScore >= 80 ? '#10B981' : data.matchScore >= 60 ? '#F59E0B' : '#EF4444' }} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 md:justify-end">
                <button className="rounded-lg bg-[#111827] px-4 py-2 text-sm font-medium text-white hover:bg-[#1F2937] active:scale-[0.98] transition-all">
                  Generate Roadmap
                </button>
                <button className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] active:scale-[0.98] transition-all">
                  Detailed Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TAB NAVIGATION ─── */}
        <div className="border-b border-[#e5e7eb] mb-5">
          <nav className="flex gap-6 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[#111827] text-[#111827]"
                    : "border-transparent text-[#9CA3AF] hover:text-[#6B7280]"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* ─── TAB CONTENT ─── */}
        {activeTab === "Overview" && <OverviewTab data={data} setTab={setActiveTab} />}
        {activeTab === "DSA" && <DSATab topics={data.dsaTopics} />}
        {activeTab === "System Design" && <SystemDesignTab topics={data.sysDesignTopics} />}
        {activeTab === "Projects" && <ProjectsTab projects={data.projects} />}
        {activeTab === "Interview" && <InterviewTab stages={data.timeline} />}
        {activeTab === "Resources" && <ResourcesTab resources={data.resources} />}

        {/* ─── STICKY CTA ─── */}
        <div className={`fixed bottom-0 left-0 right-0 z-40 border-t border-[#e5e7eb] bg-white/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between transition-all duration-300 ${showSticky ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="flex items-center gap-3">
            <CompanyLogoIcon slug={slug} size={28} />
            <span className="text-sm font-semibold text-[#111827]">{name}</span>
            <span className="text-sm text-[#9CA3AF]">·</span>
            <span className="text-sm font-bold text-[#111827]">{data.matchScore}% match</span>
          </div>
          <button className="rounded-lg bg-[#111827] px-5 py-2 text-sm font-medium text-white hover:bg-[#1F2937] active:scale-[0.98] transition-all">
            Generate Roadmap for {name}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─── OVERVIEW TAB ─── */
function OverviewTab({ data, setTab }: { data: typeof COMPANY_DATA["google"]; setTab: (t: Tab) => void }) {
  return (
    <div className="space-y-5">
      {/* Difficulty Indicators */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
        <h3 className="text-sm font-bold text-[#111827] mb-3">Difficulty Breakdown</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {data.difficultyMap.map((d) => (
            <div key={d.area} className="flex items-center gap-3 rounded-lg border border-[#F3F4F6] p-3">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
              <div>
                <div className="text-xs text-[#9CA3AF]">{d.area}</div>
                <div className="text-sm font-semibold text-[#111827]">{d.level}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Gaps */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#111827]">Your Top Gaps</h3>
          <button onClick={() => setTab("DSA")} className="text-xs text-[#6B7280] hover:text-[#111827] transition-colors">View all →</button>
        </div>
        <div className="space-y-3">
          {data.dsaTopics.filter(t => t.pct < 80).slice(0, 3).map((t) => (
            <div key={t.name} className="flex items-center justify-between rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
                <div>
                  <span className="text-sm font-medium text-[#111827]">{t.name}</span>
                  <span className="text-xs text-[#9CA3AF] ml-2">Solved {t.solved}/{t.required}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#DC2626]">Gap: {t.required - t.solved}</span>
                {t.impact > 0 && (
                  <span className="rounded-md bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#10B981]">+{t.impact} score</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Jump Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {([
          { label: "DSA Requirements", tab: "DSA" as Tab, desc: `${data.dsaTopics.length} topics to cover` },
          { label: "Interview Pipeline", tab: "Interview" as Tab, desc: `${data.timeline.length} rounds` },
          { label: "Resources", tab: "Resources" as Tab, desc: `${data.resources.filter(r => r.priority === 'HIGH').length} high priority` },
        ]).map((c) => (
          <button
            key={c.label}
            onClick={() => setTab(c.tab)}
            className="rounded-lg border border-[#e5e7eb] bg-white p-4 text-left hover:bg-[#f9fafb] hover:border-[#D1D5DB] transition-all group"
          >
            <div className="text-sm font-semibold text-[#111827] group-hover:text-[#10B981] transition-colors">{c.label}</div>
            <div className="text-xs text-[#9CA3AF] mt-0.5">{c.desc}</div>
            <ArrowRight className="h-4 w-4 text-[#D1D5DB] mt-2 group-hover:text-[#10B981] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── DSA TAB ─── */
function DSATab({ topics }: { topics: TopicGap[] }) {
  return (
    <div className="space-y-3">
      {topics.map((t) => {
        const gap = t.required - t.solved;
        const isComplete = t.pct >= 100;
        const isWarning = t.pct < 50;
        return (
          <div key={t.name} className="rounded-lg border border-[#e5e7eb] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#111827]">{t.name}</span>
                {isWarning && <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" />}
              </div>
              <div className="flex items-center gap-3">
                {!isComplete && gap > 0 && (
                  <span className="text-xs font-semibold text-[#DC2626]">Gap: {gap} ⚠</span>
                )}
                {t.impact > 0 && (
                  <span className="rounded-md bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#10B981]">+{t.impact} score</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${t.pct}%`,
                    backgroundColor: t.pct >= 80 ? '#10B981' : t.pct >= 50 ? '#F59E0B' : '#EF4444',
                  }}
                />
              </div>
              <span className="text-sm font-bold text-[#111827] w-10 text-right">{t.pct}%</span>
            </div>
            <div className="flex gap-4 text-xs text-[#9CA3AF]">
              <span>Required: <span className="font-semibold text-[#374151]">{t.required}</span></span>
              <span>Solved: <span className="font-semibold text-[#10B981]">{t.solved}</span></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── SYSTEM DESIGN TAB ─── */
function SystemDesignTab({ topics }: { topics: { name: string; pct: number }[] }) {
  return (
    <div className="space-y-3">
      {topics.map((t) => (
        <div key={t.name} className="rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#111827]">{t.name}</span>
            <span className="text-sm font-bold text-[#111827]">{t.pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${t.pct}%`,
                backgroundColor: t.pct >= 70 ? '#10B981' : t.pct >= 40 ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── PROJECTS TAB ─── */
function ProjectsTab({ projects }: { projects: string[] }) {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
      <h3 className="text-sm font-bold text-[#111827] mb-3">Expected Project Experience</h3>
      <div className="space-y-3">
        {projects.map((p, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-[#F3F4F6] p-3.5 hover:bg-[#f9fafb] transition-colors">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[10px] font-bold text-[#6B7280]">{i + 1}</div>
            <span className="text-sm text-[#374151]">{p}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── INTERVIEW TAB ─── */
function InterviewTab({ stages }: { stages: InterviewStage[] }) {
  return (
    <div className="space-y-5">
      {/* Visual Timeline */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
        <h3 className="text-sm font-bold text-[#111827] mb-5">Interview Pipeline</h3>
        <div className="flex items-center justify-between gap-0">
          {stages.map((s, i) => (
            <div key={s.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center text-center flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] text-white text-xs font-bold mb-2">
                  {i + 1}
                </div>
                <span className="text-xs font-semibold text-[#111827]">{s.label}</span>
                <span className="text-[10px] text-[#9CA3AF]">{s.duration}</span>
              </div>
              {i < stages.length - 1 && (
                <div className="flex-1 h-0.5 bg-[#E5E7EB] mx-1 relative">
                  <ArrowRight className="absolute -right-1.5 -top-[7px] h-4 w-4 text-[#D1D5DB]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((s, i) => (
          <div key={s.label} className="rounded-lg border border-[#e5e7eb] bg-white p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ECFDF5] text-xs font-bold text-[#10B981]">{i + 1}</div>
              <span className="text-sm font-semibold text-[#111827]">{s.label}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#9CA3AF]">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {s.duration}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── RESOURCES TAB ─── */
function ResourcesTab({ resources }: { resources: Resource[] }) {
  const priorityStyle = (p: string) => {
    if (p === "HIGH") return "bg-[#FEF2F2] text-[#DC2626]";
    if (p === "MEDIUM") return "bg-[#FFFBEB] text-[#D97706]";
    return "bg-[#F3F4F6] text-[#6B7280]";
  };

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-5">
      <h3 className="text-sm font-bold text-[#111827] mb-3">Recommended Resources</h3>
      <div className="space-y-2">
        {resources.map((r) => (
          <div key={r.name} className="flex items-center justify-between rounded-lg border border-[#F3F4F6] p-3.5 hover:bg-[#f9fafb] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-[#9CA3AF]" />
              <span className="text-sm font-medium text-[#111827]">{r.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${priorityStyle(r.priority)}`}>
                {r.priority}
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-[#D1D5DB]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
