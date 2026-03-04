// Company detail / blueprint page — pixel-perfect match to UXPilot reference
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { CompanyLogoIcon } from "@/components/ui/CompanyLogos";
import {
  ChevronRight, Briefcase, MapPin, Clock, DollarSign,
  Code2, Blocks, Star, AlertCircle, BookOpen, ExternalLink, ArrowRight,
  Home, Sparkles
} from "lucide-react";

/* ─── Types ─── */
interface ReadinessItem { name: string; pct: number; status: "Good" | "Needs Work" | "Not Started" }
interface InterviewStage { label: string; duration: string; desc: string; color: string }
interface QuestionItem { title: string; difficulty: "Hard" | "Med" | "Easy" }
interface ProjectCard { category: string; title: string; desc: string; tags: string[]; hours: number; image: string }

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
    salary: "$180k - $240k / yr", location: "Mountain View, CA + Remote", experience: "0-2 Years Exp.",
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
    ],
    timeline: [
      { label: "Recruiter Screen", duration: "30 min", desc: "Resume review and basic fit.", color: "#10B981" },
      { label: "Phone Screen / OA", duration: "45-60 min", desc: "1-2 Medium Leetcode problems.", color: "#3B82F6" },
      { label: "Onsite Loop (Virtual)", duration: "4-5 rounds", desc: "3 Coding, 1 System Design/OOD, 1 Behavioral.", color: "#D1D5DB" },
      { label: "Hiring Committee", duration: "Review", desc: "Review of packet • Offer decision.", color: "#D1D5DB" },
    ],
    questions: [
      { title: "Find the median of two sorted arrays of different sizes.", difficulty: "Hard" },
      { title: "Design a URL shortener service like bit.ly.", difficulty: "Med" },
      { title: "Given a binary tree, find the maximum path sum.", difficulty: "Med" },
    ],
    projects: [
      { category: "Full Stack", title: "Real-time Collaboration Tool", desc: "Build a Google Docs clone using WebSockets and OT/CRDT algorithms.", tags: ["React", "Node.js", "Socket.io"], hours: 20, image: "/projects/fullstack.png" },
      { category: "Systems", title: "Distributed Key-Value Store", desc: "Implement a distributed KV store with sharding and replication logic.", tags: ["Go", "gRPC", "Docker"], hours: 35, image: "/projects/systems.png" },
      { category: "Frontend", title: "E-commerce Analytics Dashboard", desc: "Create a high-performance dashboard handling large datasets.", tags: ["Next.js", "D3.js", "GraphQL"], hours: 25, image: "/projects/frontend.png" },
    ],
  },
};

/* Tab set matching reference exactly */
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

/* ─── Y-Axis Bar Chart (matching reference exactly) ─── */
function BarChart({ data }: { data: { topic: string; count: number }[] }) {
  const yAxisLabels = [80, 60, 40, 20, 0];
  const maxVal = 85; // scale to data max
  const chartH = 200; // chart area height in px

  return (
    <div className="flex">
      {/* Y-axis labels */}
      <div className="flex flex-col justify-between pr-3" style={{ height: chartH }}>
        {yAxisLabels.map((v) => (
          <span key={v} className="text-[11px] text-[#9CA3AF] leading-none text-right w-6">{v}</span>
        ))}
      </div>

      {/* Bars + X-axis */}
      <div className="flex-1">
        {/* Bar area with border-left and border-bottom */}
        <div
          className="flex items-end gap-4 border-l border-b border-[#E5E7EB] pl-4 pr-2"
          style={{ height: chartH }}
        >
          {data.map((d) => {
            const barH = Math.round((d.count / maxVal) * (chartH - 10));
            const opacity = 0.45 + (d.count / maxVal) * 0.55;
            return (
              <div key={d.topic} className="flex-1 flex justify-center">
                <div
                  className="w-full max-w-[44px] rounded-t-md"
                  style={{
                    height: barH,
                    backgroundColor: "#10B981",
                    opacity,
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex gap-4 pl-4 pr-2 mt-2">
          {data.map((d) => (
            <div key={d.topic} className="flex-1 text-center">
              <span className="text-[11px] text-[#6B7280] font-medium">{d.topic}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
      <div className="space-y-6">
        {/* ─── Breadcrumb (matching reference: 🏠 Home > Companies > Google) ─── */}
        <nav className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          <Home className="h-4 w-4" />
          <button onClick={() => router.push("/dashboard")} className="hover:text-[#111827] transition-colors">Home</button>
          <ChevronRight className="h-3.5 w-3.5" />
          <button onClick={() => router.push("/companies")} className="hover:text-[#111827] transition-colors">Companies</button>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#111827] font-semibold">{name}</span>
        </nav>

        {/* ─── HERO SECTION (exact match to reference) ─── */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            {/* Left side: Logo + Info */}
            <div className="flex items-start gap-5">
              {/* Large logo in gray background (matching reference ~72px) */}
              <div className="w-[72px] h-[72px] rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                <CompanyLogoIcon slug={slug} size={48} />
              </div>
              <div>
                {/* Company name + tags (inline, matching reference) */}
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-[28px] font-bold text-[#111827] leading-tight">{name}</h1>
                  {data.tags.map((t) => (
                    <span key={t.label} className="rounded-full px-3 py-0.5 text-[11px] font-semibold" style={{ color: t.color, backgroundColor: t.bg }}>{t.label}</span>
                  ))}
                </div>
                {/* Role */}
                <p className="text-sm text-[#6B7280] mt-1.5">{data.role}</p>
                {/* Metadata row with icons (matching reference spacing) */}
                <div className="flex flex-wrap items-center gap-5 text-[13px] text-[#6B7280] mt-3">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-[#9CA3AF]" />{data.salary}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#9CA3AF]" />{data.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-[#9CA3AF]" />{data.experience}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Match Score Card + CTAs (matching reference exactly) */}
            <div className="lg:min-w-[280px] flex-shrink-0">
              {/* Score card with border */}
              <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-5 mb-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-medium text-[#374151]">Your Match Score</span>
                  <span className="text-2xl font-bold text-[#10B981]">{data.matchScore}%</span>
                </div>
                {/* Thick progress bar (matching reference) */}
                <div className="h-3 rounded-full bg-[#E5E7EB] overflow-hidden mb-2.5">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${data.matchScore}%`, backgroundColor: '#10B981' }} />
                </div>
                <p className="text-[11px] text-[#9CA3AF]">Based on your skills, experience, and DSA progress.</p>
              </div>
              {/* CTA buttons (matching reference: outlined + filled) */}
              <div className="flex gap-3">
                <button className="flex-1 rounded-lg border border-[#E5E7EB] px-5 py-3 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] active:scale-[0.98] transition-all">
                  Full Report
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#10B981] px-5 py-3 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.98] transition-all">
                  <Sparkles className="h-4 w-4" /> Roadmap
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TAB NAVIGATION (matching reference: underline style, "High" badge) ─── */}
        <div className="border-b border-[#E5E7EB]">
          <nav className="flex gap-6 -mb-px overflow-x-auto">
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
                  <span className="ml-2 text-[11px] text-[#6B7280] font-normal">High</span>
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
   OVERVIEW TAB — Exact match to reference 2-column layout
   ════════════════════════════════════════════════════════ */
function OverviewContent({ data, slug, setTab }: { data: typeof COMPANY_DATA["google"]; slug: string; setTab: (t: Tab) => void }) {
  return (
    <div className="space-y-6">
      {/* ─── 4 Stat Cards Row (matching reference: colored border, icon top-right) ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.statCards.map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-5" style={{ borderColor: s.borderColor }}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-[#9CA3AF] tracking-wide">{s.label}</span>
              <StatIcon type={s.icon} />
            </div>
            <div className="text-xl font-bold text-[#111827] mb-1.5">{s.value}</div>
            <p className="text-[12px] text-[#9CA3AF] leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* ─── 2-Column Layout (matching reference: ~65% left, ~35% right) ─── */}
      <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">
          {/* DSA Topic Frequency — Bar Chart with Y-axis (matching reference) */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-[#111827]">DSA Topic Frequency</h3>
              <button onClick={() => setTab("DSA Requirements")} className="text-sm font-medium text-[#10B981] hover:underline">View All Data</button>
            </div>
            <BarChart data={data.dsaTopicFreq} />
          </div>

          {/* Interview Process — Vertical timeline (matching reference exactly) */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-[#111827]">Interview Process</h3>
              <span className="text-sm text-[#9CA3AF]">Avg. 4-6 weeks</span>
            </div>
            <div className="space-y-0">
              {data.timeline.map((s, i) => {
                const isFilled = s.color === "#10B981" || s.color === "#3B82F6";
                return (
                  <div key={s.label} className="flex gap-4">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0 mt-0.5"
                        style={{
                          backgroundColor: isFilled ? s.color : "transparent",
                          border: `2.5px solid ${s.color}`,
                        }}
                      />
                      {i < data.timeline.length - 1 && (
                        <div className="w-px flex-1 min-h-[44px] bg-[#E5E7EB]" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-5">
                      <h4 className="text-sm font-bold text-[#111827] leading-tight">{s.label}</h4>
                      <p className="text-[13px] text-[#9CA3AF] mt-0.5">{s.duration} • {s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (matching reference: readiness → banner → questions) ── */}
        <div className="space-y-5">
          {/* Your Readiness (matching reference: 3 items + button) */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <h3 className="text-base font-bold text-[#111827] mb-5">Your Readiness</h3>
            <div className="space-y-4">
              {data.readiness.map((r) => (
                <div key={r.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#374151]">{r.name}</span>
                    <span className={`text-sm font-medium ${
                      r.status === "Good" ? "text-[#10B981]" : r.status === "Needs Work" ? "text-[#F59E0B]" : "text-[#9CA3AF]"
                    }`}>{r.status}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{
                      width: `${Math.max(r.pct, 2)}%`,
                      backgroundColor: r.status === "Good" ? '#10B981' : r.status === "Needs Work" ? '#F59E0B' : '#D1D5DB',
                    }} />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-5 w-full rounded-lg border border-[#E5E7EB] py-3 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors">
              Take Mock Assessment
            </button>
          </div>

          {/* Prep Course Banner (matching reference: gradient + large watermark logo) */}
          <div className="rounded-xl bg-[#10B981] p-6 relative overflow-hidden min-h-[140px]">
            {/* Watermark logo */}
            <div className="absolute -right-6 -bottom-6 opacity-[0.12]">
              <CompanyLogoIcon slug={slug} size={140} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{data.name} Prep Course</h3>
            <p className="text-[13px] text-white/80 mb-4 max-w-[200px]">Curated by ex-{data.name} interviewers. Covers all 5 rounds.</p>
            <button className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#10B981] hover:bg-[#F0FDF4] transition-colors">
              Start Learning
            </button>
          </div>

          {/* Recent Questions (matching reference: Hard/Med badges + list) */}
          <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
            <h3 className="text-base font-bold text-[#111827] mb-4">Recent Questions</h3>
            <div className="space-y-4">
              {data.questions.map((q, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-bold mt-0.5 ${
                    q.difficulty === "Hard" ? "bg-[#FEF2F2] text-[#DC2626]" :
                    q.difficulty === "Med" ? "bg-[#FFFBEB] text-[#D97706]" :
                    "bg-[#ECFDF5] text-[#10B981]"
                  }`}>{q.difficulty}</span>
                  <p className="text-sm text-[#374151] leading-snug">{q.title}</p>
                </div>
              ))}
            </div>
            <button className="mt-4 text-sm font-medium text-[#10B981] hover:underline">
              View all 124 questions →
            </button>
          </div>
        </div>
      </div>

      {/* ─── Recommended Projects (matching reference: image headers + card body) ─── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-[#111827]">Recommended Projects</h3>
          <button className="text-sm font-medium text-[#10B981] hover:underline">View all templates</button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.projects.map((p) => (
            <div key={p.title} className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden hover:shadow-lg transition-shadow group">
              {/* Image header (matching reference: actual images, not gradients) */}
              <div className="relative h-[140px] overflow-hidden">
                <Image
                  src={p.image}
                  alt={p.category}
                  fill
                  className="object-cover"
                />
                {/* Category overlay label */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-white text-sm font-semibold">{p.category}</span>
                </div>
              </div>
              {/* Card body */}
              <div className="p-5">
                <h4 className="text-sm font-bold text-[#111827] mb-1.5">{p.title}</h4>
                <p className="text-[12px] text-[#9CA3AF] mb-4 leading-relaxed">{p.desc}</p>
                {/* Tech tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-md border border-[#E5E7EB] px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">{t}</span>
                  ))}
                </div>
                {/* Footer: hours + link */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6]">
                  <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
                    <Clock className="h-3.5 w-3.5" /> {p.hours} hrs
                  </span>
                  <button className="text-sm font-medium text-[#10B981] group-hover:underline">Start Project →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Footer (matching reference) ─── */}
      <div className="border-t border-[#E5E7EB] pt-6 pb-4 flex items-center justify-between">
        <p className="text-sm text-[#9CA3AF]">© 2024 Mintkey Inc. All rights reserved.</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   DSA REQUIREMENTS TAB
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
    <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
      <div className="space-y-3">
        {topics.map((t) => {
          const gap = t.required - t.solved;
          return (
            <div key={t.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#111827]">{t.name}</span>
                  {t.pct < 50 && <AlertCircle className="h-3.5 w-3.5 text-[#DC2626]" />}
                </div>
                <div className="flex items-center gap-3">
                  {gap > 0 && <span className="text-xs font-semibold text-[#DC2626]">Gap: {gap} ⚠</span>}
                  {t.impact > 0 && <span className="rounded-md bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#10B981]">+{t.impact} score</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{
                    width: `${t.pct}%`,
                    backgroundColor: t.pct >= 80 ? '#10B981' : t.pct >= 50 ? '#F59E0B' : '#EF4444',
                  }} />
                </div>
                <span className="text-sm font-bold text-[#111827] w-12 text-right">{t.pct}%</span>
              </div>
              <div className="flex gap-4 text-xs text-[#9CA3AF]">
                <span>Required: <span className="font-semibold text-[#374151]">{t.required}</span></span>
                <span>Solved: <span className="font-semibold text-[#10B981]">{t.solved}</span></span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-5">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h3 className="text-base font-bold text-[#111827] mb-4">Priority Actions</h3>
          <div className="space-y-3">
            {topics.filter(t => t.pct < 80).sort((a, b) => b.impact - a.impact).slice(0, 3).map((t) => (
              <div key={t.name} className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3.5">
                <div className="text-sm font-medium text-[#111827]">{t.name}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-[#9CA3AF]">Solve {t.required - t.solved} more problems</span>
                  <span className="rounded-md bg-[#ECFDF5] px-2 py-0.5 text-[10px] font-bold text-[#10B981]">+{t.impact} score</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-[#10B981] p-6">
          <h3 className="text-sm font-bold text-white mb-1">DSA Study Plan</h3>
          <p className="text-xs text-white/80 mb-4">Auto-generated plan based on your gaps</p>
          <button className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#10B981]">Generate Plan</button>
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
    <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
      <div className="space-y-3">
        {topics.map((t) => (
          <div key={t.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#111827]">{t.name}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${t.difficulty === "Hard" ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#FFFBEB] text-[#D97706]"}`}>{t.difficulty}</span>
              </div>
              <span className="text-sm font-bold text-[#111827]">{t.pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#F3F4F6] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.pct}%`, backgroundColor: t.pct >= 70 ? '#10B981' : t.pct >= 40 ? '#F59E0B' : '#EF4444' }} />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
        <h3 className="text-base font-bold text-[#111827] mb-3">Key Focus Areas</h3>
        <p className="text-sm text-[#9CA3AF] leading-relaxed">For L3, focus is on clean code and basic OO design. System Design is Low/Med priority but understanding fundamentals is expected.</p>
      </div>
    </div>
  );
}

/* ─── PROJECTS TAB ─── */
function ProjectsTab({ projects }: { projects: ProjectCard[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <div key={p.title} className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden hover:shadow-lg transition-shadow group">
          <div className="relative h-[140px] overflow-hidden">
            <Image src={p.image} alt={p.category} fill className="object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <span className="text-white text-sm font-semibold">{p.category}</span>
            </div>
          </div>
          <div className="p-5">
            <h4 className="text-sm font-bold text-[#111827] mb-1.5">{p.title}</h4>
            <p className="text-[12px] text-[#9CA3AF] mb-4 leading-relaxed">{p.desc}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {p.tags.map((t) => <span key={t} className="rounded-md border border-[#E5E7EB] px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">{t}</span>)}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#F3F4F6]">
              <span className="flex items-center gap-1.5 text-xs text-[#9CA3AF]"><Clock className="h-3.5 w-3.5" /> {p.hours} hrs</span>
              <button className="text-sm font-medium text-[#10B981] group-hover:underline">Start Project →</button>
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
    <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-[#111827]">Interview Pipeline</h3>
          <span className="text-sm text-[#9CA3AF]">Avg. 4-6 weeks</span>
        </div>
        <div className="space-y-0">
          {stages.map((s, i) => {
            const isFilled = s.color === "#10B981" || s.color === "#3B82F6";
            return (
              <div key={s.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3.5 w-3.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: isFilled ? s.color : 'transparent', border: `2.5px solid ${s.color}` }} />
                  {i < stages.length - 1 && <div className="w-px flex-1 min-h-[50px] bg-[#E5E7EB]" />}
                </div>
                <div className="pb-6">
                  <h4 className="text-sm font-bold text-[#111827]">{s.label}</h4>
                  <p className="text-[13px] text-[#9CA3AF] mt-0.5">{s.duration} • {s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
        <h3 className="text-base font-bold text-[#111827] mb-4">Tips</h3>
        <ul className="space-y-3 text-sm text-[#6B7280]">
          <li className="flex items-start gap-2"><span className="text-[#10B981] font-bold">•</span> Clarify constraints before coding</li>
          <li className="flex items-start gap-2"><span className="text-[#10B981] font-bold">•</span> Think aloud during technical rounds</li>
          <li className="flex items-start gap-2"><span className="text-[#10B981] font-bold">•</span> Practice STAR format for behavioral</li>
          <li className="flex items-start gap-2"><span className="text-[#10B981] font-bold">•</span> Ask insightful questions at the end</li>
        </ul>
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
  return (
    <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
        <h3 className="text-base font-bold text-[#111827] mb-4">Recommended Resources</h3>
        <div className="space-y-2">
          {resources.map((r) => (
            <div key={r.name} className="flex items-center justify-between rounded-lg border border-[#F3F4F6] p-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-[#9CA3AF]" />
                <div>
                  <span className="text-sm font-medium text-[#111827]">{r.name}</span>
                  <p className="text-[11px] text-[#9CA3AF]">{r.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  r.priority === "HIGH" ? "bg-[#FEF2F2] text-[#DC2626]" :
                  r.priority === "MEDIUM" ? "bg-[#FFFBEB] text-[#D97706]" :
                  "bg-[#F3F4F6] text-[#6B7280]"
                }`}>{r.priority}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#D1D5DB]" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-[#10B981] p-6">
        <h3 className="text-sm font-bold text-white mb-1">Custom Study Plan</h3>
        <p className="text-xs text-white/80 mb-4">AI-generated plan tailored to your gaps and timeline</p>
        <button className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#10B981]">Generate Plan</button>
      </div>
    </div>
  );
}

/* ─── REVIEWS TAB ─── */
function ReviewsTab() {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
      <h3 className="text-base font-bold text-[#111827] mb-4">Interview Reviews</h3>
      <div className="space-y-4">
        {[
          { author: "Anonymous", role: "SDE-1 Candidate", date: "2 months ago", text: "4 rounds of coding + 1 behavioral. Heavy focus on graphs and DP. System design was basic OOD.", rating: 4 },
          { author: "Anonymous", role: "New Grad", date: "3 months ago", text: "OA was straightforward — 2 Medium problems. Onsite was intense but fair. Culture fit round felt genuine.", rating: 5 },
        ].map((r, i) => (
          <div key={i} className="rounded-lg border border-[#F3F4F6] p-5">
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
