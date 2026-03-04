// Company detail / blueprint page — matching UXPilot reference layout exactly
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { CompanyLogoIcon } from "@/components/ui/CompanyLogos";
import {
  ChevronRight, Briefcase, MapPin, Clock, DollarSign,
  Code2, Blocks, Star, AlertCircle, BookOpen, ExternalLink, ArrowRight
} from "lucide-react";

/* ─── Types ─── */
interface ReadinessItem { name: string; pct: number; status: "Good" | "Needs Work" | "Not Started" }
interface InterviewStage { label: string; duration: string; desc: string; color: string }
interface QuestionItem { title: string; difficulty: "Hard" | "Med" | "Easy" }
interface ProjectCard { category: string; title: string; desc: string; tags: string[]; hours: number; gradient: string }

/* ─── Static data ─── */
const COMPANY_DATA: Record<string, {
  name: string; role: string; salary: string; location: string; experience: string;
  tags: { label: string; color: string; bg: string }[];
  matchScore: number;
  statCards: { label: string; value: string; desc: string; icon: string; borderColor: string }[];
  dsaTopicFreq: { topic: string; count: number }[];
  readiness: ReadinessItem[];
  timeline: InterviewStage[];
  questions: QuestionItem[];
  projects: ProjectCard[];
}> = {
  google: {
    name: "Google", role: "Software Development Engineer I (L3)",
    salary: "$180k – $240k / yr", location: "Mountain View, CA + Remote", experience: "0-2 Years Exp.",
    tags: [
      { label: "Hard", color: "#DC2626", bg: "#FEF2F2" },
      { label: "Tech Giant", color: "#7C3AED", bg: "#F5F3FF" },
    ],
    matchScore: 78,
    statCards: [
      { label: "Hiring Difficulty", value: "Very Hard", desc: "Top 1% of applicants selected. Strong emphasis on DSA.", icon: "difficulty", borderColor: "#FCA5A5" },
      { label: "DSA Importance", value: "Critical", desc: "3-4 rounds focused purely on algos & data structures.", icon: "code", borderColor: "#C4B5FD" },
      { label: "System Design", value: "Low/Med", desc: "For L3, focus is on clean code and basic OO design.", icon: "blocks", borderColor: "#93C5FD" },
      { label: "Googliness", value: "Required", desc: "Behavioral fit is a strict pass/fail criteria.", icon: "star", borderColor: "#FCD34D" },
    ],
    dsaTopicFreq: [
      { topic: "Graphs", count: 85 },
      { topic: "DP", count: 78 },
      { topic: "Trees", count: 72 },
      { topic: "Arrays", count: 65 },
      { topic: "Strings", count: 55 },
      { topic: "Heaps", count: 45 },
    ],
    readiness: [
      { name: "Graph Algorithms", pct: 80, status: "Good" },
      { name: "Dynamic Programming", pct: 35, status: "Needs Work" },
      { name: "System Design", pct: 0, status: "Not Started" },
      { name: "Trees & BST", pct: 90, status: "Good" },
      { name: "Sliding Window", pct: 40, status: "Needs Work" },
    ],
    timeline: [
      { label: "Recruiter Screen", duration: "30 min", desc: "Resume review and basic fit.", color: "#10B981" },
      { label: "Phone Screen / OA", duration: "45-60 min", desc: "1-2 Medium Leetcode problems.", color: "#3B82F6" },
      { label: "Onsite Loop (Virtual)", duration: "4-5 rounds", desc: "3 Coding, 1 System Design/OOD, 1 Behavioral.", color: "#9CA3AF" },
      { label: "Hiring Committee", duration: "Review", desc: "Review of packet • Offer decision.", color: "#9CA3AF" },
    ],
    questions: [
      { title: "Find the median of two sorted arrays of different sizes.", difficulty: "Hard" },
      { title: "Design a URL shortener service like bit.ly.", difficulty: "Med" },
      { title: "Given a binary tree, find the maximum path sum.", difficulty: "Med" },
    ],
    projects: [
      { category: "Full Stack", title: "Real-time Collaboration Tool", desc: "Build a Google Docs clone using WebSockets and OT/CRDT algorithms.", tags: ["React", "Node.js", "Socket.io"], hours: 20, gradient: "from-[#1e1b4b] to-[#312e81]" },
      { category: "Systems", title: "Distributed Key-Value Store", desc: "Implement a distributed KV store with sharding and replication logic.", tags: ["Go", "gRPC", "Docker"], hours: 35, gradient: "from-[#064e3b] to-[#065f46]" },
      { category: "Frontend", title: "E-commerce Analytics Dashboard", desc: "Create a high-performance dashboard handling large datasets.", tags: ["Next.js", "D3.js", "GraphQL"], hours: 25, gradient: "from-[#1e3a5f] to-[#1e40af]" },
    ],
  },
};

/* Tab set matching reference */
const TABS = ["Overview", "DSA Requirements", "System Design", "Projects", "Interview Format", "Resources", "Reviews"] as const;
type Tab = typeof TABS[number];

/* ─── Stat Card Icon ─── */
function StatIcon({ type }: { type: string }) {
  const cls = "h-5 w-5";
  switch (type) {
    case "difficulty": return <AlertCircle className={cls} style={{ color: "#EF4444" }} />;
    case "code": return <Code2 className={cls} style={{ color: "#8B5CF6" }} />;
    case "blocks": return <Blocks className={cls} style={{ color: "#3B82F6" }} />;
    case "star": return <Star className={cls} style={{ color: "#F59E0B" }} fill="#F59E0B" />;
    default: return null;
  }
}

/* ─── Page ─── */
export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const data = COMPANY_DATA[slug] || COMPANY_DATA.google;
  const name = data?.name || slug.charAt(0).toUpperCase() + slug.slice(1);

  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <DashboardLayout title={`${name} Blueprint`} subtitle="Company-specific preparation roadmap">
      <div className="space-y-5">
        {/* ─── Breadcrumb ─── */}
        <nav className="flex items-center gap-1.5 text-sm text-[#9CA3AF]">
          <button onClick={() => router.push("/dashboard")} className="hover:text-[#111827] transition-colors">Home</button>
          <ChevronRight className="h-3.5 w-3.5" />
          <button onClick={() => router.push("/companies")} className="hover:text-[#111827] transition-colors">Companies</button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#111827] font-medium">{name}</span>
        </nav>

        {/* ─── HERO SECTION ─── */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Left: Logo + Company Info */}
            <div className="flex items-start gap-4">
              <CompanyLogoIcon slug={slug} size={64} />
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl font-bold text-[#111827]">{name}</h1>
                  {data.tags.map((t) => (
                    <span key={t.label} className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ color: t.color, backgroundColor: t.bg }}>{t.label}</span>
                  ))}
                </div>
                <p className="text-sm text-[#6B7280] mb-3">{data.role}</p>
                <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#6B7280]">
                  <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />{data.salary}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{data.location}</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />{data.experience}</span>
                </div>
              </div>
            </div>

            {/* Right: Match Score Card + CTAs */}
            <div className="lg:min-w-[260px]">
              <div className="rounded-xl border border-[#e5e7eb] bg-[#F9FAFB] p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#374151]">Your Match Score</span>
                  <span className="text-xl font-bold" style={{ color: data.matchScore >= 70 ? '#10B981' : data.matchScore >= 50 ? '#F59E0B' : '#EF4444' }}>{data.matchScore}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#E5E7EB] overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${data.matchScore}%`, backgroundColor: data.matchScore >= 70 ? '#10B981' : data.matchScore >= 50 ? '#F59E0B' : '#EF4444' }} />
                </div>
                <p className="text-[11px] text-[#9CA3AF]">Based on your skills, experience, and DSA progress.</p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] active:scale-[0.98] transition-all">
                  Full Report
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#10B981] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#059669] active:scale-[0.98] transition-all">
                  <ArrowRight className="h-4 w-4" /> Roadmap
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TAB NAVIGATION ─── */}
        <div className="border-b border-[#e5e7eb]">
          <nav className="flex gap-5 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative whitespace-nowrap pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[#10B981] text-[#10B981]"
                    : "border-transparent text-[#9CA3AF] hover:text-[#6B7280]"
                }`}
              >
                {tab}
                {tab === "DSA Requirements" && (
                  <span className="ml-1.5 rounded-full bg-[#FEF2F2] px-1.5 py-0.5 text-[9px] font-bold text-[#DC2626]">High</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ─── TAB CONTENT ─── */}
        {activeTab === "Overview" && <OverviewContent data={data} slug={slug} setTab={setActiveTab} />}
        {activeTab === "DSA Requirements" && <DSARequirementsTab data={data} />}
        {activeTab === "System Design" && <SystemDesignTab />}
        {activeTab === "Projects" && <ProjectsTab projects={data.projects} />}
        {activeTab === "Interview Format" && <InterviewFormatTab stages={data.timeline} />}
        {activeTab === "Resources" && <ResourcesTab />}
        {activeTab === "Reviews" && <ReviewsTab />}
      </div>
    </DashboardLayout>
  );
}

/* ════════════════════════════════════════════════════════
   OVERVIEW TAB — Main content (matching reference layout)
   ════════════════════════════════════════════════════════ */

function OverviewContent({ data, slug, setTab }: { data: typeof COMPANY_DATA["google"]; slug: string; setTab: (t: Tab) => void }) {
  return (
    <div className="space-y-5">
      {/* ─── 4 Stat Cards Row ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-white p-5" style={{ borderColor: s.borderColor }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#9CA3AF]">{s.label}</span>
              <StatIcon type={s.icon} />
            </div>
            <div className="text-lg font-bold text-[#111827] mb-1">{s.value}</div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* ─── 2-Column Layout (2/3 left, 1/3 right) ─── */}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">
          {/* DSA Topic Frequency — Bar Chart */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[#111827]">DSA Topic Frequency</h3>
              <button onClick={() => setTab("DSA Requirements")} className="text-xs font-medium text-[#10B981] hover:underline">View All Data</button>
            </div>
            {/* Bar chart */}
            <div className="flex items-end justify-between gap-3 h-44">
              {data.dsaTopicFreq.map((d) => {
                const maxCount = Math.max(...data.dsaTopicFreq.map(t => t.count));
                const heightPct = (d.count / maxCount) * 100;
                return (
                  <div key={d.topic} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#6B7280]">{d.count}</span>
                    <div className="w-full rounded-t-md bg-[#10B981] transition-all duration-500" style={{ height: `${heightPct}%`, opacity: 0.6 + (heightPct / 300) }} />
                    <span className="text-[11px] text-[#6B7280] font-medium">{d.topic}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interview Process — Vertical Timeline */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[#111827]">Interview Process</h3>
              <span className="text-xs text-[#9CA3AF]">Avg. 4-6 weeks</span>
            </div>
            <div className="space-y-0">
              {data.timeline.map((s, i) => (
                <div key={s.label} className="flex gap-4">
                  {/* Timeline column */}
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: s.color, backgroundColor: s.color === "#10B981" || s.color === "#3B82F6" ? s.color : 'transparent' }} />
                    {i < data.timeline.length - 1 && (
                      <div className="w-0.5 flex-1 min-h-[40px] bg-[#E5E7EB]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-6">
                    <h4 className="text-sm font-semibold text-[#111827]">{s.label}</h4>
                    <p className="text-xs text-[#9CA3AF]">{s.duration} • {s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Sidebar) ── */}
        <div className="space-y-5">
          {/* Your Readiness */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <h3 className="text-base font-bold text-[#111827] mb-4">Your Readiness</h3>
            <div className="space-y-4">
              {data.readiness.map((r) => (
                <div key={r.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#374151]">{r.name}</span>
                    <span className={`text-[11px] font-semibold ${
                      r.status === "Good" ? "text-[#10B981]" : r.status === "Needs Work" ? "text-[#F59E0B]" : "text-[#9CA3AF]"
                    }`}>{r.status}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{
                      width: `${Math.max(r.pct, 2)}%`,
                      backgroundColor: r.status === "Good" ? '#10B981' : r.status === "Needs Work" ? '#F59E0B' : '#D1D5DB',
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full rounded-lg border border-[#E5E7EB] py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
              Take Mock Assessment
            </button>
          </div>

          {/* Prep Course Banner */}
          <div className="rounded-2xl bg-[#10B981] p-5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <CompanyLogoIcon slug={slug} size={120} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">{data.name} Prep Course</h3>
            <p className="text-xs text-white/80 mb-3">Curated by ex-{data.name} interviewers. Covers all {data.timeline.length} rounds.</p>
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#10B981] hover:bg-[#F0FDF4] transition-colors">
              Start Learning
            </button>
          </div>

          {/* Recent Questions */}
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
            <h3 className="text-base font-bold text-[#111827] mb-3">Recent Questions</h3>
            <div className="space-y-3">
              {data.questions.map((q, i) => (
                <div key={i} className="flex gap-2.5">
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    q.difficulty === "Hard" ? "bg-[#FEF2F2] text-[#DC2626]" :
                    q.difficulty === "Med" ? "bg-[#FFFBEB] text-[#D97706]" :
                    "bg-[#ECFDF5] text-[#10B981]"
                  }`}>{q.difficulty}</span>
                  <p className="text-sm text-[#374151] leading-snug">{q.title}</p>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs font-medium text-[#10B981] hover:underline">
              View all 124 questions →
            </button>
          </div>
        </div>
      </div>

      {/* ─── Recommended Projects (3 cards row) ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#111827]">Recommended Projects</h3>
          <button className="text-xs font-medium text-[#10B981] hover:underline">View all templates</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((p) => (
            <div key={p.title} className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden hover:shadow-md transition-shadow group">
              {/* Category gradient header */}
              <div className={`h-28 bg-gradient-to-br ${p.gradient} flex items-end p-4`}>
                <span className="text-white text-sm font-semibold">{p.category}</span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-[#111827] mb-1">{p.title}</h4>
                <p className="text-[11px] text-[#9CA3AF] mb-3 leading-relaxed">{p.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-md border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]">{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-[#9CA3AF]"><Clock className="h-3 w-3" /> {p.hours} hrs</span>
                  <button className="text-xs font-medium text-[#10B981] group-hover:underline">Start Project →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   DSA REQUIREMENTS TAB — Gap-first with your improvements
   ════════════════════════════════════════════════════════ */
function DSARequirementsTab({ data }: { data: typeof COMPANY_DATA["google"] }) {
  const topics = [
    { name: "Dynamic Programming", required: 40, solved: 8, pct: 20, impact: 8 },
    { name: "Graphs", required: 30, solved: 24, pct: 80, impact: 3 },
    { name: "Trees", required: 25, solved: 25, pct: 100, impact: 0 },
    { name: "Arrays & Hashing", required: 35, solved: 30, pct: 86, impact: 2 },
    { name: "Binary Search", required: 20, solved: 14, pct: 70, impact: 4 },
    { name: "Sliding Window", required: 15, solved: 6, pct: 40, impact: 5 },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        {topics.map((t) => {
          const gap = t.required - t.solved;
          const isComplete = t.pct >= 100;
          const isWarning = t.pct < 50;
          return (
            <div key={t.name} className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#111827]">{t.name}</span>
                  {isWarning && <AlertCircle className="h-3.5 w-3.5 text-[#DC2626]" />}
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
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${t.pct}%`,
                    backgroundColor: t.pct >= 80 ? '#10B981' : t.pct >= 50 ? '#F59E0B' : '#EF4444',
                  }} />
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

      {/* Sidebar summary */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <h3 className="text-base font-bold text-[#111827] mb-3">Priority Actions</h3>
          <div className="space-y-3">
            {topics.filter(t => t.pct < 80).sort((a, b) => b.impact - a.impact).slice(0, 3).map((t) => (
              <div key={t.name} className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3">
                <div className="text-sm font-medium text-[#111827]">{t.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#9CA3AF]">Solve {t.required - t.solved} more problems</span>
                  <span className="rounded-md bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#10B981]">+{t.impact} score</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#10B981] p-5">
          <h3 className="text-sm font-bold text-white mb-1">DSA Study Plan</h3>
          <p className="text-xs text-white/80 mb-3">Auto-generated plan based on your gaps</p>
          <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#10B981]">Generate Plan</button>
        </div>
      </div>
    </div>
  );
}

/* ─── SYSTEM DESIGN TAB ─── */
function SystemDesignTab() {
  const topics = [
    { name: "URL Shortener", difficulty: "Med", pct: 70 },
    { name: "Chat System", difficulty: "Hard", pct: 30 },
    { name: "Rate Limiter", difficulty: "Med", pct: 85 },
    { name: "Notification Service", difficulty: "Hard", pct: 20 },
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-3">
        {topics.map((t) => (
          <div key={t.name} className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#111827]">{t.name}</span>
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${t.difficulty === "Hard" ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#FFFBEB] text-[#D97706]"}`}>{t.difficulty}</span>
              </div>
              <span className="text-sm font-bold text-[#111827]">{t.pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.pct}%`, backgroundColor: t.pct >= 70 ? '#10B981' : t.pct >= 40 ? '#F59E0B' : '#EF4444' }} />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <h3 className="text-base font-bold text-[#111827] mb-3">Key Focus Areas</h3>
        <p className="text-xs text-[#9CA3AF] leading-relaxed">For L3, focus is on clean code and basic OO design. System Design is Low/Med priority but understanding fundamentals is expected.</p>
      </div>
    </div>
  );
}

/* ─── PROJECTS TAB ─── */
function ProjectsTab({ projects }: { projects: ProjectCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <div key={p.title} className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden hover:shadow-md transition-shadow group">
          <div className={`h-28 bg-gradient-to-br ${p.gradient} flex items-end p-4`}>
            <span className="text-white text-sm font-semibold">{p.category}</span>
          </div>
          <div className="p-4">
            <h4 className="text-sm font-bold text-[#111827] mb-1">{p.title}</h4>
            <p className="text-[11px] text-[#9CA3AF] mb-3 leading-relaxed">{p.desc}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {p.tags.map((t) => <span key={t} className="rounded-md border border-[#E5E7EB] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]">{t}</span>)}
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-[#9CA3AF]"><Clock className="h-3 w-3" /> {p.hours} hrs</span>
              <button className="text-xs font-medium text-[#10B981] group-hover:underline">Start Project →</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── INTERVIEW FORMAT TAB ─── */
function InterviewFormatTab({ stages }: { stages: InterviewStage[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#111827]">Interview Pipeline</h3>
          <span className="text-xs text-[#9CA3AF]">Avg. 4-6 weeks</span>
        </div>
        <div className="space-y-0">
          {stages.map((s, i) => (
            <div key={s.label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="h-3.5 w-3.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: s.color, backgroundColor: s.color === "#10B981" || s.color === "#3B82F6" ? s.color : 'transparent' }} />
                {i < stages.length - 1 && <div className="w-0.5 flex-1 min-h-[50px] bg-[#E5E7EB]" />}
              </div>
              <div className="pb-6">
                <h4 className="text-sm font-semibold text-[#111827]">{s.label}</h4>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{s.duration} • {s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
          <h3 className="text-base font-bold text-[#111827] mb-3">Tips</h3>
          <ul className="space-y-2 text-sm text-[#6B7280]">
            <li className="flex items-start gap-2"><span className="text-[#10B981] font-bold">•</span> Clarify constraints before coding</li>
            <li className="flex items-start gap-2"><span className="text-[#10B981] font-bold">•</span> Think aloud during technical rounds</li>
            <li className="flex items-start gap-2"><span className="text-[#10B981] font-bold">•</span> Practice STAR format for behavioral</li>
            <li className="flex items-start gap-2"><span className="text-[#10B981] font-bold">•</span> Ask insightful questions at the end</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─── RESOURCES TAB ─── */
function ResourcesTab() {
  const resources = [
    { name: "NeetCode 150", priority: "HIGH" as const, desc: "Curated DSA problem list" },
    { name: "Grokking System Design", priority: "HIGH" as const, desc: "System design interview prep" },
    { name: "Aditya Verma DP Playlist", priority: "HIGH" as const, desc: "Dynamic programming patterns" },
    { name: "System Design Primer", priority: "MEDIUM" as const, desc: "GitHub repository for SD" },
    { name: "LeetCode Google Tag", priority: "MEDIUM" as const, desc: "Company-tagged problems" },
    { name: "Google Interview Tips Blog", priority: "LOW" as const, desc: "First-hand interview experiences" },
  ];
  const priorityStyle = (p: string) => {
    if (p === "HIGH") return "bg-[#FEF2F2] text-[#DC2626]";
    if (p === "MEDIUM") return "bg-[#FFFBEB] text-[#D97706]";
    return "bg-[#F3F4F6] text-[#6B7280]";
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
        <h3 className="text-base font-bold text-[#111827] mb-3">Recommended Resources</h3>
        <div className="space-y-2">
          {resources.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-lg border border-[#F3F4F6] p-3.5 hover:bg-[#f9fafb] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-[#9CA3AF]" />
                <div>
                  <span className="text-sm font-medium text-[#111827]">{r.name}</span>
                  <p className="text-[11px] text-[#9CA3AF]">{r.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${priorityStyle(r.priority)}`}>{r.priority}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#D1D5DB]" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-[#10B981] p-5">
        <h3 className="text-sm font-bold text-white mb-1">Custom Study Plan</h3>
        <p className="text-xs text-white/80 mb-3">AI-generated plan tailored to your gaps and timeline</p>
        <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#10B981]">Generate Plan</button>
      </div>
    </div>
  );
}

/* ─── REVIEWS TAB ─── */
function ReviewsTab() {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
      <h3 className="text-base font-bold text-[#111827] mb-3">Interview Reviews</h3>
      <div className="space-y-4">
        {[
          { author: "Anonymous", role: "SDE-1 Candidate", date: "2 months ago", text: "4 rounds of coding + 1 behavioral. Heavy focus on graphs and DP. System design was basic OOD.", rating: 4 },
          { author: "Anonymous", role: "New Grad", date: "3 months ago", text: "OA was straightforward — 2 Medium problems. Onsite was intense but fair. Culture fit round felt genuine.", rating: 5 },
        ].map((r, i) => (
          <div key={i} className="rounded-lg border border-[#F3F4F6] p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-semibold text-[#111827]">{r.author}</span>
                <span className="text-xs text-[#9CA3AF] ml-2">{r.role} • {r.date}</span>
              </div>
              <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-3.5 w-3.5" fill={j < r.rating ? "#F59E0B" : "#E5E7EB"} stroke="none" />)}</div>
            </div>
            <p className="text-sm text-[#6B7280] leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
