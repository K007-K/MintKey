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
  Home, Sparkles, Target, Zap, Shield, TrendingUp, MessageSquare,
  Users, Rocket, ChevronDown, BarChart3, Globe, Hash,
  Database, Server, Cpu, Network, Layers, GitBranch,
  CheckCircle2, XCircle, Lightbulb, Trophy, Calendar, FileText
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

/* Tab set — all 9 tabs */
const TABS = ["Overview", "DSA Requirements", "System Design", "Projects", "Interview Format", "Resources", "Reviews", "Skill Gap Analysis", "Preparation Strategy"] as const;
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
        <div className="border-b border-[#E5E7EB] overflow-x-auto scrollbar-hide">
          <nav className="flex gap-6 -mb-px min-w-max">
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
        {activeTab === "Interview Format" && <InterviewFormatTab />}
        {activeTab === "Resources" && <ResourcesTab />}
        {activeTab === "Reviews" && <ReviewsTab />}
        {activeTab === "Skill Gap Analysis" && <SkillGapTab />}
        {activeTab === "Preparation Strategy" && <PreparationStrategyTab />}
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
   TAB 2 — DSA REQUIREMENTS
   ════════════════════════════════════════════════════════ */
function DSARequirementsTab({ data }: { data: typeof COMPANY_DATA["google"] }) {
  const difficulty = [
    { label: "Easy", required: 100, user: 72, color: "#10B981", borderColor: "#A7F3D0" },
    { label: "Medium", required: 200, user: 145, color: "#F59E0B", borderColor: "#FDE68A" },
    { label: "Hard", required: 80, user: 28, color: "#EF4444", borderColor: "#FECACA" },
    { label: "Total", required: 400, user: 245, color: "#10B981", borderColor: "#6EE7B7" },
  ];
  const topics = [
    { name: "Dynamic Programming", required: 40, user: 28 },
    { name: "Graphs", required: 30, user: 22 },
    { name: "Trees", required: 30, user: 25 },
    { name: "Backtracking", required: 25, user: 10 },
    { name: "Sliding Window", required: 20, user: 18 },
    { name: "Heap / Priority Queue", required: 20, user: 8 },
    { name: "Binary Search", required: 15, user: 12 },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
      {/* LEFT — Main content */}
      <div className="space-y-6">
        {/* Section 1: Problem Difficulty Targets */}
        <div className="grid gap-4 grid-cols-2">
          {difficulty.map((d) => {
            const pct = Math.round((d.user / d.required) * 100);
            return (
              <div key={d.label} className="rounded-xl border bg-white p-5" style={{ borderColor: "#e5e7eb", borderLeftWidth: 4, borderLeftColor: d.borderColor }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">{d.label}</span>
                </div>
                <div className="text-2xl font-bold text-[#111827] mb-0.5">{d.required}+</div>
                <p className="text-xs text-[#9CA3AF] mb-3">problems required</p>
                <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden mb-2">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: d.color }} />
                </div>
                <p className="text-xs text-[#6B7280]">You: <span className="font-semibold" style={{ color: pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444" }}>{d.user}</span> / {d.required}</p>
              </div>
            );
          })}
        </div>

        {/* Section 2: Topic Distribution */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">DSA Topic Breakdown</h3>
          <div className="space-y-4">
            {topics.map((t) => {
              const pct = Math.round((t.user / t.required) * 100);
              const met = t.user >= t.required;
              return (
                <div key={t.name} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-[#374151] w-[180px] shrink-0">{t.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: met ? "#10B981" : "#F59E0B" }} />
                  </div>
                  <span className="text-xs text-[#9CA3AF] w-[130px] shrink-0 text-right">{t.required} problems required</span>
                  <span className={`text-xs font-medium w-[60px] shrink-0 text-right ${met ? "text-[#10B981]" : pct >= 60 ? "text-[#F59E0B]" : "text-[#EF4444]"}`}>You: {t.user}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-right">
            <button className="text-sm font-medium text-[#10B981] hover:underline">View All Topics →</button>
          </div>
        </div>

        {/* Section 3: Contest Expectations */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-[#9CA3AF] mb-1">Recommended Rating</p>
              <p className="text-lg font-bold text-[#111827]">1800+</p>
            </div>
            <div className="text-center border-x border-[#F3F4F6]">
              <p className="text-xs text-[#9CA3AF] mb-1">Weekly Contest</p>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#FFFBEB] text-[#D97706]">Helpful</span>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#9CA3AF] mb-1">CP Experience</p>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">Optional</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Sidebar */}
      <div className="space-y-5">
        {/* DSA Readiness */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-center">
          <h3 className="text-base font-semibold text-[#111827] mb-4">Your DSA Readiness</h3>
          <div className="text-5xl font-bold text-[#10B981] mb-1">67%</div>
          <p className="text-xs text-[#9CA3AF] mb-5">245 of 400 target problems solved</p>
          <div className="space-y-3 text-left">
            {[
              { label: "Easy", user: 72, req: 100, color: "#10B981" },
              { label: "Medium", user: 145, req: 200, color: "#F59E0B" },
              { label: "Hard", user: 28, req: 80, color: "#EF4444" },
            ].map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#6B7280]">{d.label}</span>
                  <span className="text-[#9CA3AF]">{d.user}/{d.req}</span>
                </div>
                <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(d.user / d.req) * 100}%`, backgroundColor: d.color }} />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-5 w-full rounded-lg border border-[#10B981] text-[#10B981] py-2.5 text-sm font-medium hover:bg-[#ECFDF5] transition-colors">
            Practice Problems →
          </button>
        </div>

        {/* Quick Tips */}
        <div className="rounded-xl bg-[#ECFDF5] border-l-4 border-[#10B981] p-5">
          <h3 className="text-sm font-semibold text-[#111827] mb-3">Quick Tips</h3>
          <ul className="space-y-2.5 text-sm text-[#374151]">
            <li className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> Focus on DP patterns (Knapsack, LCS, Matrix Chain) — Google asks DP in 60% of rounds</li>
            <li className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> Practice explaining your approach before coding — communication is graded</li>
            <li className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> Aim for O(n log n) or better — brute force alone won't pass Google rounds</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 3 — SYSTEM DESIGN
   ════════════════════════════════════════════════════════ */
function SystemDesignTab() {
  const coreTopics = [
    { icon: <Layers className="h-5 w-5 text-[#10B981]" />, name: "Load Balancing", desc: "Distribute traffic across servers to ensure high availability", importance: "High" },
    { icon: <Database className="h-5 w-5 text-[#10B981]" />, name: "Caching", desc: "Reduce latency using in-memory data stores", importance: "High" },
    { icon: <MessageSquare className="h-5 w-5 text-[#10B981]" />, name: "Message Queues", desc: "Async communication between services", importance: "Medium" },
    { icon: <Server className="h-5 w-5 text-[#10B981]" />, name: "Database Sharding", desc: "Horizontal partitioning for scale", importance: "High" },
    { icon: <Hash className="h-5 w-5 text-[#10B981]" />, name: "Consistent Hashing", desc: "Distribute data with minimal remapping", importance: "Medium" },
    { icon: <Shield className="h-5 w-5 text-[#10B981]" />, name: "Rate Limiting", desc: "Control traffic to protect services", importance: "Medium" },
    { icon: <GitBranch className="h-5 w-5 text-[#10B981]" />, name: "Microservices", desc: "Decompose systems into independent services", importance: "High" },
    { icon: <Globe className="h-5 w-5 text-[#10B981]" />, name: "Distributed Systems", desc: "Coordinate across multiple nodes", importance: "High" },
  ];

  const problems = [
    { name: "Design URL Shortener", difficulty: "Medium" as const, tags: ["Hashing", "Caching", "DB Design"] },
    { name: "Design YouTube", difficulty: "Hard" as const, tags: ["CDN", "Storage", "Streaming"] },
    { name: "Design Chat System", difficulty: "Hard" as const, tags: ["WebSockets", "Queues", "Presence"] },
    { name: "Design Notification Service", difficulty: "Medium" as const, tags: ["Queues", "Fan-out", "Push"] },
    { name: "Design Rate Limiter", difficulty: "Medium" as const, tags: ["Sliding Window", "Redis", "API"] },
  ];

  return (
    <div className="space-y-8">
      {/* Section 1: Core Topics Grid */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-base font-semibold text-[#111827]">Core System Design Topics</h3>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#FFFBEB] text-[#D97706]">Medium Importance</span>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {coreTopics.map((t) => (
            <div key={t.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#A7F3D0] transition-colors group cursor-pointer">
              <div className="rounded-lg bg-[#ECFDF5] p-2 w-fit mb-3">{t.icon}</div>
              <h4 className="text-sm font-bold text-[#111827] mb-1">{t.name}</h4>
              <p className="text-xs text-[#9CA3AF] leading-relaxed mb-3">{t.desc}</p>
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.importance === "High" ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#FFFBEB] text-[#D97706]"}`}>{t.importance}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#D1D5DB] group-hover:text-[#10B981] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Example Interview Problems */}
      <div>
        <h3 className="text-base font-semibold text-[#111827] mb-5">Common Interview Questions</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {problems.map((p) => (
            <div key={p.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#A7F3D0] transition-colors group cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#9CA3AF]" />
                  <span className="text-sm font-bold text-[#111827]">{p.name}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${p.difficulty === "Hard" ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#FFFBEB] text-[#D97706]"}`}>{p.difficulty}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]">{tag}</span>
                ))}
              </div>
              <button className="text-sm font-medium text-[#10B981] group-hover:underline">Study →</button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Preparation Resources Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#10B981] to-[#0D9488] p-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Ready to practice System Design?</h3>
          <p className="text-sm text-white/80">Access curated system design problems and mock interview sessions</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#10B981] hover:bg-[#F0FDF4] transition-colors">Practice Now</button>
          <button className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">Mock Interview</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 4 — PROJECTS
   ════════════════════════════════════════════════════════ */
function ProjectsTab({ projects }: { projects: ProjectCard[] }) {
  const allProjects = [
    { category: "Full Stack", title: "Real-time Collaboration Tool", desc: "Build a Google Docs clone using WebSockets and OT/CRDT algorithms.", tags: ["React", "Node.js", "Socket.io"], hours: 20, complexity: "High" as const, image: "/projects/fullstack.png" },
    { category: "Systems", title: "Distributed Key-Value Store", desc: "Implement a distributed KV store with sharding and replication logic.", tags: ["Go", "gRPC", "Docker"], hours: 35, complexity: "Very High" as const, image: "/projects/systems.png" },
    { category: "Full Stack", title: "E-commerce Analytics Dashboard", desc: "Create a high-performance dashboard handling large datasets.", tags: ["Next.js", "D3.js", "GraphQL"], hours: 25, complexity: "Medium" as const, image: "/projects/frontend.png" },
    { category: "Backend", title: "API Rate Limiter Service", desc: "Build a configurable rate limiter supporting multiple strategies.", tags: ["Node.js", "Redis", "Docker"], hours: 15, complexity: "Medium" as const },
    { category: "Data Engineering", title: "Data Processing Pipeline", desc: "Design an ETL pipeline for real-time data processing at scale.", tags: ["Python", "Kafka", "Spark"], hours: 30, complexity: "High" as const },
  ];

  const techStack = [
    { group: "Backend", items: ["Node.js", "Java", "Go", "Python"] },
    { group: "Database", items: ["PostgreSQL", "MongoDB", "Bigtable"] },
    { group: "Caching", items: ["Redis", "Memcached"] },
    { group: "Messaging", items: ["Kafka", "Pub/Sub", "RabbitMQ"] },
    { group: "Cloud", items: ["GCP", "AWS"] },
    { group: "Infrastructure", items: ["Docker", "Kubernetes", "Terraform"] },
  ];

  const complexityColor = (c: string) => {
    if (c === "Very High") return "bg-[#FEF2F2] text-[#DC2626]";
    if (c === "High") return "bg-[#FFF7ED] text-[#EA580C]";
    return "bg-[#FFFBEB] text-[#D97706]";
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Project Cards */}
      <div>
        <div className="mb-1">
          <h3 className="text-base font-semibold text-[#111827]">Project Recommendations for Google</h3>
          <p className="text-sm text-[#9CA3AF]">Projects that have impressed Google interviewers</p>
        </div>
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 mt-5">
          {allProjects.map((p) => (
            <div key={p.title} className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden hover:shadow-lg transition-shadow group">
              {/* Thumbnail */}
              <div className="relative h-[140px] overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                {p.image ? (
                  <Image src={p.image} alt={p.category} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cpu className="h-10 w-10 text-gray-600" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <span className="text-white text-sm font-semibold">{p.category}</span>
                </div>
              </div>
              {/* Body */}
              <div className="p-5">
                <h4 className="text-sm font-bold text-[#111827] mb-1.5">{p.title}</h4>
                <p className="text-[12px] text-[#9CA3AF] mb-4 leading-relaxed">{p.desc}</p>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${complexityColor(p.complexity)}`}>{p.complexity}</span>
                  <span className="text-xs text-[#9CA3AF]">Est: {p.hours} hrs</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.tags.map((t) => <span key={t} className="rounded-md border border-[#E5E7EB] px-2.5 py-1 text-[11px] font-medium text-[#6B7280]">{t}</span>)}
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-[#F3F4F6]">
                  <button className="text-sm font-medium text-[#10B981] group-hover:underline">Start Project →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Recommended Tech Stack */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
        <h3 className="text-base font-semibold text-[#111827] mb-5">Google-Preferred Tech Stack</h3>
        <div className="space-y-4">
          {techStack.map((g) => (
            <div key={g.group} className="flex items-center gap-4">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider w-[110px] shrink-0">{g.group}</span>
              <div className="flex flex-wrap gap-2">
                {g.items.map((item) => (
                  <span key={item} className="border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm font-medium text-[#374151] bg-white hover:border-[#A7F3D0] hover:text-[#10B981] transition-colors cursor-pointer">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 5 — INTERVIEW FORMAT
   ════════════════════════════════════════════════════════ */
function InterviewFormatTab() {
  const stages = [
    { label: "Recruiter Screen", duration: "30 min", desc: "Resume review and basic fit.", difficulty: "Easy" as const, filled: true },
    { label: "Online Assessment", duration: "90 min", desc: "2-3 LeetCode problems, typically Medium-Hard.", difficulty: "Hard" as const, filled: true },
    { label: "Technical Interview 1 (DSA)", duration: "45-60 min", desc: "Graph/Tree/DP problems. Must explain clearly.", difficulty: "Hard" as const, filled: true },
    { label: "Technical Interview 2 (DSA)", duration: "45-60 min", desc: "More algorithmic problems + code quality.", difficulty: "Hard" as const, filled: true },
    { label: "System Design Interview", duration: "60 min", desc: "Design a large-scale system from scratch.", difficulty: "Medium" as const, filled: false },
    { label: "Hiring Manager Round", duration: "45 min", desc: "Behavioral + team fit + career goals.", difficulty: "Easy" as const, filled: false },
    { label: "HR Round", duration: "30 min", desc: "Offer negotiation, logistics.", difficulty: "Easy" as const, filled: false },
  ];

  const diffBadge = (d: string) => {
    if (d === "Hard") return "bg-[#FEF2F2] text-[#DC2626]";
    if (d === "Medium") return "bg-[#FFFBEB] text-[#D97706]";
    return "bg-[#ECFDF5] text-[#10B981]";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
      {/* LEFT */}
      <div className="space-y-6">
        {/* Timeline */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#111827]">Interview Process</h3>
            <span className="text-sm text-[#9CA3AF]">Avg. 4-6 weeks</span>
          </div>
          <div className="space-y-0">
            {stages.map((s, i) => (
              <div key={s.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="h-3.5 w-3.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: s.filled ? "#10B981" : "transparent", border: `2.5px solid ${s.filled ? "#10B981" : "#D1D5DB"}` }} />
                  {i < stages.length - 1 && <div className="w-px flex-1 min-h-[45px] border-l-2 border-dashed border-[#E5E7EB]" />}
                </div>
                <div className="pb-5 flex-1 flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">{s.label}</h4>
                    <p className="text-[13px] text-[#9CA3AF] mt-0.5">{s.duration} · {s.desc}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ml-3 ${diffBadge(s.difficulty)}`}>{s.difficulty}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Round Difficulty Breakdown */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: "Online Assess", level: "HARD", color: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]" },
            { label: "Tech Rounds", level: "HARD", color: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]" },
            { label: "System Design", level: "MEDIUM", color: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]" },
            { label: "Behavioral", level: "EASY", color: "bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]" },
          ].map((r) => (
            <div key={r.label} className={`rounded-xl border p-4 text-center ${r.color}`}>
              <p className="text-xs font-medium opacity-70 mb-1">{r.label}</p>
              <p className="text-sm font-bold">{r.level}</p>
            </div>
          ))}
        </div>

        {/* Do / Don't */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] p-5">
            <h4 className="text-sm font-bold text-[#10B981] mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Do</h4>
            <ul className="space-y-2 text-sm text-[#374151]">
              <li className="flex items-start gap-2"><span className="text-[#10B981]">✓</span> Explain your thought process out loud</li>
              <li className="flex items-start gap-2"><span className="text-[#10B981]">✓</span> Write clean, optimized code</li>
              <li className="flex items-start gap-2"><span className="text-[#10B981]">✓</span> Ask clarifying questions first</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5">
            <h4 className="text-sm font-bold text-[#EF4444] mb-3 flex items-center gap-2"><XCircle className="h-4 w-4" /> Don&apos;t</h4>
            <ul className="space-y-2 text-sm text-[#374151]">
              <li className="flex items-start gap-2"><span className="text-[#EF4444]">✗</span> Jump to code without thinking</li>
              <li className="flex items-start gap-2"><span className="text-[#EF4444]">✗</span> Use brute force without acknowledging</li>
              <li className="flex items-start gap-2"><span className="text-[#EF4444]">✗</span> Skip edge cases</li>
            </ul>
          </div>
        </div>
      </div>

      {/* RIGHT — Sidebar */}
      <div className="space-y-5">
        {/* Interview Stats */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-4">Interview Stats</h3>
          <div className="space-y-4">
            {[
              { label: "Success Rate", value: "~5%", color: "text-[#EF4444]" },
              { label: "Avg. Rounds", value: "5-6", color: "text-[#111827]" },
              { label: "Timeline", value: "4-6 weeks", color: "text-[#111827]" },
              { label: "Offer Rate", value: "~2%", color: "text-[#EF4444]" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">{s.label}</span>
                <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insider Tips */}
        <div className="rounded-xl bg-[#ECFDF5] border-l-4 border-[#10B981] p-5">
          <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[#10B981]" /> Insider Tips</h3>
          <ul className="space-y-2.5 text-sm text-[#374151]">
            <li className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> Google values code readability as much as correctness</li>
            <li className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> Always start with brute force, then optimize</li>
            <li className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> Practice explaining your solution in plain English</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 6 — RESOURCES
   ════════════════════════════════════════════════════════ */
function ResourcesTab() {
  const dsaResources = [
    { name: "NeetCode 150", desc: "Best structured 150 problems for FAANG", cost: "Free", rating: 5 },
    { name: "Striver A2Z DSA Sheet", desc: "450+ problems from basics to advanced", cost: "Free", rating: 5 },
    { name: "LeetCode Company Questions", desc: "Filter by Google-tagged problems", cost: "Premium", rating: 4 },
  ];
  const sdResources = [
    { name: "System Design Primer", desc: "Comprehensive GitHub repository for SD fundamentals", cost: "Free", rating: 5 },
    { name: "Grokking System Design", desc: "Educative's structured course with diagrams", cost: "Paid", rating: 4 },
    { name: "High Scalability Blog", desc: "Real architectures from top companies", cost: "Free", rating: 4 },
  ];
  const platforms = [
    { name: "LeetCode", desc: "DSA Practice", cost: "Free + Premium", color: "#F59E0B" },
    { name: "Codeforces", desc: "Competitive Programming", cost: "Free", color: "#3B82F6" },
    { name: "InterviewBit", desc: "Structured Interview Prep", cost: "Free + Paid", color: "#10B981" },
    { name: "Pramp", desc: "Peer Mock Interviews", cost: "Free", color: "#8B5CF6" },
  ];

  const stars = (n: number) => Array.from({ length: 5 }).map((_, i) => (
    <Star key={i} className="h-3 w-3" fill={i < n ? "#F59E0B" : "#E5E7EB"} stroke="none" />
  ));

  return (
    <div className="space-y-8">
      {/* DSA Resources */}
      <div>
        <h3 className="text-base font-semibold text-[#111827] mb-4 flex items-center gap-2"><Code2 className="h-4 w-4 text-[#10B981]" /> DSA Preparation</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {dsaResources.map((r) => (
            <div key={r.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#A7F3D0] transition-colors group cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-[#9CA3AF]" />
                <h4 className="text-sm font-bold text-[#111827]">{r.name}</h4>
              </div>
              <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">{r.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">{stars(r.rating)}</div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.cost === "Free" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-[#FFFBEB] text-[#D97706]"}`}>{r.cost}</span>
              </div>
              <button className="mt-3 text-sm font-medium text-[#10B981] group-hover:underline">Open Resource →</button>
            </div>
          ))}
        </div>
      </div>

      {/* System Design Resources */}
      <div>
        <h3 className="text-base font-semibold text-[#111827] mb-4 flex items-center gap-2"><Layers className="h-4 w-4 text-[#10B981]" /> System Design Resources</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {sdResources.map((r) => (
            <div key={r.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#A7F3D0] transition-colors group cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-[#9CA3AF]" />
                <h4 className="text-sm font-bold text-[#111827]">{r.name}</h4>
              </div>
              <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">{r.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">{stars(r.rating)}</div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.cost === "Free" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-[#FFFBEB] text-[#D97706]"}`}>{r.cost}</span>
              </div>
              <button className="mt-3 text-sm font-medium text-[#10B981] group-hover:underline">Open Resource →</button>
            </div>
          ))}
        </div>
      </div>

      {/* Practice Platforms */}
      <div>
        <h3 className="text-base font-semibold text-[#111827] mb-4">Practice Platforms</h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {platforms.map((p) => (
            <div key={p.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5 text-center hover:border-[#A7F3D0] transition-colors group cursor-pointer">
              <div className="w-8 h-8 rounded-lg mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: p.color + "20" }}>
                <Globe className="h-4 w-4" style={{ color: p.color }} />
              </div>
              <h4 className="text-sm font-bold text-[#111827] mb-0.5">{p.name}</h4>
              <p className="text-xs text-[#9CA3AF] mb-2">{p.desc}</p>
              <span className="text-[10px] font-medium text-[#6B7280]">{p.cost}</span>
              <button className="block mx-auto mt-2 text-sm font-medium text-[#10B981] group-hover:underline">Visit →</button>
            </div>
          ))}
        </div>
      </div>

      {/* Curated Prep Course Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#10B981] to-[#0D9488] p-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Google Interview Prep Course</h3>
          <p className="text-sm text-white/80">Curated by ex-Google interviewers. Covers all 5 rounds.</p>
        </div>
        <button className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#10B981] hover:bg-[#F0FDF4] transition-colors">Start Learning</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 7 — REVIEWS
   ════════════════════════════════════════════════════════ */
function ReviewsTab() {
  const reviews = [
    { round: "Round 1: Technical DSA", question: "Longest Increasing Subsequence", difficulty: "Hard" as const, outcome: "Offer" as const, quote: "Optimize from O(n²) to O(n log n). Patience sorting approach expected.", rating: 4, date: "2 weeks ago", role: "SDE I" },
    { round: "Round 2: Graph Problem", question: "Number of Islands (variation)", difficulty: "Medium" as const, outcome: "Offer" as const, quote: "DFS-based, but they wanted BFS solution and discussed time/space complexity.", rating: 4, date: "1 month ago", role: "SDE I" },
    { round: "Round 3: System Design", question: "Design Google Docs", difficulty: "Hard" as const, outcome: "Rejected" as const, quote: "Focus on OT/CRDT for conflict resolution. They valued breadth over depth.", rating: 5, date: "2 months ago", role: "SDE II" },
    { round: "Round 4: Behavioral", question: "Tell me about a conflict at work", difficulty: "Easy" as const, outcome: "Offer" as const, quote: "STAR format expected. They value low-ego, high-collaboration stories.", rating: 3, date: "3 months ago", role: "SDE I" },
  ];

  const diffBadge = (d: string) => {
    if (d === "Hard") return "bg-[#FEF2F2] text-[#DC2626]";
    if (d === "Medium") return "bg-[#FFFBEB] text-[#D97706]";
    return "bg-[#ECFDF5] text-[#10B981]";
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {["All", "By Round", "By Outcome", "By Difficulty"].map((f) => (
          <button key={f} className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm text-[#6B7280] hover:border-[#A7F3D0] transition-colors flex items-center gap-1">
            {f} <ChevronDown className="h-3 w-3" />
          </button>
        ))}
        <div className="ml-auto">
          <button className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm text-[#6B7280] flex items-center gap-1">
            Sort: Most Recent <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Review Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {reviews.map((r, i) => (
          <div key={i} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-[#111827]">{r.round}</span>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${diffBadge(r.difficulty)}`}>{r.difficulty}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.outcome === "Offer" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                  {r.outcome === "Offer" ? "✅" : "❌"} {r.outcome}
                </span>
              </div>
            </div>
            <div className="border-t border-[#F3F4F6] pt-3 mb-3">
              <p className="text-sm font-medium text-[#374151] mb-1">Q: {r.question}</p>
              <p className="text-sm text-[#6B7280] italic leading-relaxed">&quot;{r.quote}&quot;</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-3 w-3" fill={j < r.rating ? "#F59E0B" : "#E5E7EB"} stroke="none" />
                ))}
                <span className="text-xs text-[#9CA3AF] ml-1">Difficulty: {r.difficulty}</span>
              </div>
              <span className="text-xs text-[#9CA3AF]">{r.date} · {r.role} position</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats Row */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-[#111827]">124</p>
            <p className="text-xs text-[#9CA3AF]">Total Reviews</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#10B981]">67%</p>
            <p className="text-xs text-[#9CA3AF]">Offer Rate</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#111827]">4.2/5</p>
            <p className="text-xs text-[#9CA3AF]">Avg Difficulty</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#111827]">SDE I</p>
            <p className="text-xs text-[#9CA3AF]">Most Common</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 8 — SKILL GAP ANALYSIS
   ════════════════════════════════════════════════════════ */
function SkillGapTab() {
  const readiness = [
    { area: "DSA", pct: 75, status: "Good Progress" },
    { area: "System Design", pct: 60, status: "Needs Work" },
    { area: "Projects", pct: 45, status: "Critical Gap" },
    { area: "Interview Prep", pct: 70, status: "On Track" },
  ];

  const gapTable = [
    { skill: "Dynamic Prog.", required: "40 problems", yours: "28 problems", gap: "-12 problems", severity: "warning" as const },
    { skill: "Graphs", required: "30 problems", yours: "22 problems", gap: "-8 problems", severity: "warning" as const },
    { skill: "System Design", required: "10 topics", yours: "3 topics", gap: "-7 topics", severity: "critical" as const },
    { skill: "Trees", required: "30 problems", yours: "25 problems", gap: "-5 problems", severity: "ok" as const },
    { skill: "Backtracking", required: "25 problems", yours: "10 problems", gap: "-15 problems", severity: "critical" as const },
    { skill: "Projects", required: "3 production", yours: "1 project", gap: "-2 projects", severity: "critical" as const },
    { skill: "Contest Rating", required: "1800+", yours: "1450", gap: "-350 pts", severity: "warning" as const },
  ];

  const weakAreas = [
    { name: "Dynamic Programming", gap: "12 problems", priority: "High", cta: "Practice DP Problems →", border: "border-[#F59E0B]" },
    { name: "System Design", gap: "7 topics", priority: "Critical", cta: "Start System Design →", border: "border-[#EF4444]" },
    { name: "Projects", gap: "2 production projects", priority: "High", cta: "Browse Templates →", border: "border-[#F59E0B]" },
  ];

  const statusColor = (s: string) => {
    if (s === "Good Progress" || s === "On Track") return "text-[#10B981]";
    if (s === "Needs Work") return "text-[#F59E0B]";
    return "text-[#EF4444]";
  };

  const barColor = (pct: number) => pct > 70 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444";

  const severityBadge = (s: string) => {
    if (s === "critical") return "bg-[#FEF2F2] text-[#DC2626]";
    if (s === "warning") return "bg-[#FFFBEB] text-[#D97706]";
    return "bg-[#ECFDF5] text-[#10B981]";
  };

  const severityIcon = (s: string) => s === "critical" ? "🔴" : s === "warning" ? "⚠️" : "✅";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
      {/* LEFT */}
      <div className="space-y-6">
        {/* Readiness Banner */}
        <div className="rounded-xl bg-gradient-to-r from-[#F9FAFB] to-[#ECFDF5] border border-[#A7F3D0] p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">Your Overall Readiness for Google: SDE I</h3>
          <div className="space-y-3">
            {readiness.map((r) => (
              <div key={r.area} className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#374151] w-[120px] shrink-0">{r.area}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.pct}%`, backgroundColor: barColor(r.pct) }} />
                </div>
                <span className="text-sm font-bold text-[#111827] w-10">{r.pct}%</span>
                <span className={`text-xs font-medium w-[100px] text-right ${statusColor(r.status)}`}>{r.status}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-5">
            <span className="text-sm text-[#6B7280]">Composite Score:</span>
            <span className="text-lg font-bold text-[#111827]">67%</span>
            <button className="ml-auto rounded-lg bg-[#10B981] px-4 py-2 text-sm font-medium text-white hover:bg-[#059669] transition-colors">Generate Roadmap →</button>
          </div>
        </div>

        {/* Gap Table */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="p-5 pb-0">
            <h3 className="text-base font-semibold text-[#111827] mb-4">Detailed Skill Gap Analysis</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-[#F9FAFB] text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
                <th className="text-left px-5 py-3">Skill</th>
                <th className="text-left px-5 py-3">Required</th>
                <th className="text-left px-5 py-3">Your Level</th>
                <th className="text-left px-5 py-3">Gap</th>
              </tr>
            </thead>
            <tbody>
              {gapTable.map((r) => (
                <tr key={r.skill} className="border-t border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-[#111827]">{r.skill}</td>
                  <td className="px-5 py-3 text-sm text-[#6B7280]">{r.required}</td>
                  <td className="px-5 py-3 text-sm text-[#6B7280]">{r.yours}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${severityBadge(r.severity)}`}>{severityIcon(r.severity)} {r.gap}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Weak Areas */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {weakAreas.map((w) => (
            <div key={w.name} className={`rounded-xl border-l-4 ${w.border} border border-[#E5E7EB] bg-white p-5`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-[#111827]">{w.name}</span>
              </div>
              <p className="text-xs text-[#9CA3AF] mb-1">Gap: {w.gap}</p>
              <p className="text-xs text-[#9CA3AF] mb-3">Priority: <span className={w.priority === "Critical" ? "text-[#EF4444] font-semibold" : "text-[#F59E0B] font-semibold"}>{w.priority}</span></p>
              <button className="text-sm font-medium text-[#10B981] hover:underline">{w.cta}</button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Sidebar */}
      <div className="space-y-5">
        {/* Readiness Score */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-center">
          <div className="text-5xl font-bold text-[#10B981] mb-1">67%</div>
          <p className="text-sm text-[#6B7280] mb-1">Match Score</p>
          <p className="text-xs text-[#9CA3AF]">Top 32% of applicants at this stage</p>
        </div>

        {/* What's Holding You Back */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">What&apos;s Holding You Back</h3>
          <ul className="space-y-3 text-sm text-[#6B7280]">
            <li className="flex items-start gap-2"><AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" /> Projects: Only 1 of 3 required</li>
            <li className="flex items-start gap-2"><AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" /> System Design: Not started</li>
            <li className="flex items-start gap-2"><AlertCircle className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" /> DSA: 28 of 40 DP problems</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 9 — PREPARATION STRATEGY
   ════════════════════════════════════════════════════════ */
function PreparationStrategyTab() {
  const [activeStep, setActiveStep] = useState(1);
  const steps = [
    { num: 1, title: "Master Dynamic Programming", desc: "Focus on 12 remaining DP problems. Target patterns: Knapsack, LCS, Matrix Chain.", est: "2-3 weeks", cta: "Start →" },
    { num: 2, title: "Improve Graph Algorithms", desc: "Practice BFS/DFS variations, Dijkstra, Union-Find.", est: "1-2 weeks", cta: "Start →" },
    { num: 3, title: "Build a Distributed Backend Project", desc: "Choose: Key-Value Store or Real-time Collaboration Tool.", est: "3-4 weeks", cta: "View Templates →" },
    { num: 4, title: "Start System Design Preparation", desc: "Begin with Load Balancing, then Caching fundamentals.", est: "2 weeks", cta: "Resources →" },
    { num: 5, title: "Practice Mock Interviews", desc: "2-3 mock interviews/week in final stretch.", est: "2 weeks", cta: "Schedule →" },
  ];

  const weeklyPlan = [
    { week: "Week 1-2", task: "Solve 20 DP problems (focus: Knapsack, LCS, Coin Change)", current: true },
    { week: "Week 3-4", task: "Practice Graph algorithms (BFS/DFS, Dijkstra, Topo sort)", current: false },
    { week: "Week 5-6", task: "Build distributed backend project + write README", current: false },
    { week: "Week 7", task: "Start System Design: URL shortener, Chat System", current: false },
    { week: "Week 8", task: "Mock interviews (2-3/week), behavioral prep, review", current: false },
  ];

  const projections = [
    { label: "Current Score", pct: 67, delta: null },
    { label: "After DSA (Week 4)", pct: 78, delta: "+11%" },
    { label: "After Projects (Week 6)", pct: 85, delta: "+7%" },
    { label: "After Mocks (Week 8)", pct: 90, delta: "+5%" },
  ];

  return (
    <div className="space-y-8">
      {/* Section 1: Preparation Roadmap */}
      <div>
        <h3 className="text-base font-semibold text-[#111827] mb-5">Your Personalized Preparation Roadmap</h3>
        <div className="space-y-0">
          {steps.map((s, i) => (
            <div key={s.num} className="flex gap-4" onClick={() => setActiveStep(s.num)}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 cursor-pointer ${s.num === activeStep ? "bg-[#10B981] text-white" : s.num < activeStep ? "bg-[#A7F3D0] text-[#065F46]" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                  {s.num}
                </div>
                {i < steps.length - 1 && <div className="w-px flex-1 min-h-[20px] border-l-2 border-dashed border-[#E5E7EB] ml-0" />}
              </div>
              <div className="flex-1 pb-4">
                <div className={`rounded-xl border bg-white p-5 transition-colors cursor-pointer ${s.num === activeStep ? "border-[#10B981] shadow-sm" : "border-[#E5E7EB] hover:border-[#A7F3D0]"}`}>
                  <h4 className="text-sm font-bold text-[#111827] mb-1">{s.title}</h4>
                  <p className="text-xs text-[#9CA3AF] mb-2 leading-relaxed">{s.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7280]">Estimated: {s.est}</span>
                    <button className="text-sm font-medium text-[#10B981] hover:underline">{s.cta}</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Weekly Plan */}
      <div className="rounded-xl border border-[#E5E7EB] overflow-hidden">
        <div className="p-5 pb-0">
          <h3 className="text-base font-semibold text-[#111827] mb-4">8-Week Sprint Plan</h3>
        </div>
        <table className="w-full">
          <tbody>
            {weeklyPlan.map((w) => (
              <tr key={w.week} className={`border-t border-[#E5E7EB] ${w.current ? "bg-[#ECFDF5] border-l-4 border-l-[#10B981]" : ""}`}>
                <td className="bg-[#F9FAFB] font-medium text-sm w-32 px-4 py-3 text-[#374151]">{w.week}</td>
                <td className="text-sm text-[#6B7280] px-4 py-3">{w.task}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 3: Score Projection */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
        <h3 className="text-base font-semibold text-[#111827] mb-5">Projected Match Score Growth</h3>
        <div className="space-y-4">
          {projections.map((p) => (
            <div key={p.label} className="flex items-center gap-4">
              <span className="text-sm text-[#374151] w-[200px] shrink-0">{p.label}</span>
              <div className="flex-1 h-3 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.pct}%`, backgroundColor: "#10B981" }} />
              </div>
              <span className="text-sm font-bold text-[#111827] w-10">{p.pct}%</span>
              {p.delta && <span className="text-xs font-medium text-[#10B981] bg-[#ECFDF5] rounded px-1.5 py-0.5">{p.delta}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#10B981] to-[#0D9488] p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Rocket className="h-5 w-5 text-white" />
          <h3 className="text-lg font-bold text-white">Ready to start your Google preparation?</h3>
        </div>
        <p className="text-sm text-white/80 mb-5">Get a personalized day-by-day roadmap based on your profile</p>
        <button className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#10B981] hover:bg-[#F0FDF4] transition-colors">Generate Full Roadmap →</button>
      </div>
    </div>
  );
}
