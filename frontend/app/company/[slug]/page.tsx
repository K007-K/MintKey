// Company detail / blueprint page — pixel-perfect match to UXPilot reference
"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { CompanyLogoIcon } from "@/components/ui/CompanyLogos";
import { useCompany, useMatchScores } from "@/lib/api";
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

/* ─── Build page data from API response ─── */
type CompanyPageData = {
  name: string; role: string; salary: string; location: string; experience: string;
  tags: { label: string; color: string; bg: string }[];
  matchScore: number;
  statCards: { label: string; value: string; desc: string; icon: string; borderColor: string }[];
  dsaTopicFreq: { topic: string; count: number }[];
  readiness: ReadinessItem[];
  timeline: InterviewStage[];
  questions: QuestionItem[];
  projects: ProjectCard[];
};

function diffTag(difficulty: string): { label: string; color: string; bg: string } {
  const d = difficulty?.toLowerCase() || "medium";
  if (d.includes("very hard") || d.includes("hard")) return { label: "Hard", color: "#DC2626", bg: "#FEF2F2" };
  if (d.includes("easy")) return { label: "Easy", color: "#10B981", bg: "#ECFDF5" };
  return { label: "Medium", color: "#D97706", bg: "#FFFBEB" };
}

function buildCompanyPageData(raw: Record<string, unknown>): CompanyPageData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hiring = (raw.hiring_data || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsa = (raw.dsa_requirements || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const interviewFmt = (raw.interview_format || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const techStack = (raw.tech_stack || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const behavioral = (raw.behavioral || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sysDesign = (raw.system_design || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = (raw.projects || {}) as any;

  const pkg = hiring.package_range_lpa || {};
  const salary = pkg.min && pkg.max ? `₹${pkg.min} - ${pkg.max} LPA` : "—";
  const roles = hiring.roles || [];
  const role = roles[0] || "Software Development Engineer";
  const locations = (hiring.locations || []).join(", ") || "India";
  const difficulty = hiring.hiring_difficulty || "Medium";
  const companyType = (raw.type as string) || "Company";

  // Tags
  const tags = [
    diffTag(difficulty),
    { label: companyType, color: "#7C3AED", bg: "#F5F3FF" },
  ];

  // DSA importance level
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weights = (raw.scoring_weights || {}) as any;
  const dsaWeight = parseFloat(weights.dsa_score || "0.25");
  const dsaImportance = dsaWeight >= 0.4 ? "Critical" : dsaWeight >= 0.3 ? "High" : dsaWeight >= 0.2 ? "Medium" : "Low";

  // System design level
  const sdRequired = sysDesign.required_at_sde1 ? "Required" : "Low/Med";
  const sdDepth = sysDesign.depth || "Not required at entry level";

  // Stat cards
  const statCards = [
    { label: "Hiring Difficulty", value: difficulty, desc: `${hiring.interview_rounds || "?"} rounds. ${hiring.college_preference || ""}`.trim(), icon: "difficulty", borderColor: "#FCA5A5" },
    { label: "DSA Importance", value: dsaImportance, desc: `Weight: ${Math.round(dsaWeight * 100)}%. ${dsa.minimum_problems?.total || "?"} min problems.`, icon: "code", borderColor: "#C4B5FD" },
    { label: "System Design", value: sdRequired, desc: sdDepth, icon: "blocks", borderColor: "#93C5FD" },
    { label: "Behavioral", value: behavioral.type || "Culture Fit", desc: (behavioral.key_attributes || []).slice(0, 3).join(", "), icon: "star", borderColor: "#FCD34D" },
  ];

  // DSA topic frequency from dsa_requirements.topic_targets
  const topicTargets = dsa.topic_targets || {};
  const dsaTopicFreq = Object.entries(topicTargets)
    .map(([key, val]: [string, unknown]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = val as any;
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return { topic: label, count: t.frequency_pct || t.recommended || 50 };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Readiness — placeholder (real data comes from user analysis)
  const readiness: ReadinessItem[] = dsaTopicFreq.slice(0, 3).map((t) => ({
    name: t.topic,
    pct: 0,
    status: "Not Started" as const,
  }));

  // Interview timeline from interview_format.rounds
  const roundColors = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#D1D5DB"];
  const timeline: InterviewStage[] = (interviewFmt.rounds || []).map((r: Record<string, unknown>, i: number) => ({
    label: r.type as string || `Round ${i + 1}`,
    duration: r.duration_min ? `${r.duration_min} min` : "—",
    desc: (r.description as string) || "",
    color: roundColors[i % roundColors.length],
  }));

  // Questions — placeholder (generated from must_know_designs)
  const mustKnow = sysDesign.must_know_designs || [];
  const questions: QuestionItem[] = mustKnow.slice(0, 4).map((q: string, i: number) => ({
    title: `Design: ${q}`,
    difficulty: (i === 0 ? "Hard" : "Med") as "Hard" | "Med" | "Easy",
  }));

  // Projects — from DB (now objects with title, desc, tags, etc.)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawProjects = projects.impressive_projects || [];
  const projectList: ProjectCard[] = rawProjects
    .slice(0, 3)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any, i: number) => {
      const isObj = typeof p === "object" && p !== null;
      const title = isObj ? p.title : String(p);
      return {
        category: isObj ? (p.category || ["Full Stack", "Systems", "Frontend"][i % 3]) : ["Full Stack", "Systems", "Frontend"][i % 3],
        title,
        desc: isObj ? p.desc : `Build a production-quality ${title.toLowerCase()} to demonstrate your skills.`,
        tags: isObj ? (p.tags || (techStack.preferred_languages || []).slice(0, 3)) : (techStack.preferred_languages || []).slice(0, 3),
        hours: isObj ? (p.hours || 20 + i * 10) : 20 + i * 10,
        image: `/projects/${["fullstack", "systems", "frontend"][i % 3]}.png`,
      };
    });

  return {
    name: raw.name as string,
    role,
    salary,
    location: locations,
    experience: "0-2 Years Exp.",
    tags,
    matchScore: 0, // Populated when user has scored
    statCards,
    dsaTopicFreq,
    readiness,
    timeline,
    questions,
    projects: projectList,
  };
}

/* Tab set — consolidated 4 tabs */
const TABS = ["Overview", "Technical Requirements", "Projects & Stack", "Interview Guide"] as const;
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
  const { data: rawCompany, isLoading, isError } = useCompany(slug);
  const { data: rawScores } = useMatchScores();

  const data = useMemo(() => {
    if (!rawCompany) return null;
    const pageData = buildCompanyPageData(rawCompany as Record<string, unknown>);
    // Merge real match score if available
    if (rawScores && Array.isArray(rawScores)) {
      const match = (rawScores as { company_slug: string; overall_score: number }[])
        .find((s) => s.company_slug === slug);
      if (match) pageData.matchScore = Math.round(match.overall_score);
    }
    return pageData;
  }, [rawCompany, rawScores, slug]);

  const name = data?.name || slug.charAt(0).toUpperCase() + slug.slice(1);

  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  if (isLoading) {
    return (
      <DashboardLayout title="Loading..." subtitle="">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E5E7EB] border-t-[#10B981]" />
          <span className="ml-3 text-sm text-[#6B7280]">Loading company data...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !data) {
    return (
      <DashboardLayout title="Company Not Found" subtitle="">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-[#EF4444] font-medium mb-2">Company &ldquo;{slug}&rdquo; not found</p>
          <button onClick={() => router.push('/companies')} className="text-xs text-[#10B981] hover:underline">← Back to companies</button>
        </div>
      </DashboardLayout>
    );
  }

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
                <Link href={`/match/${slug}`} className="flex-1 rounded-lg border border-[#E5E7EB] px-5 py-3 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] active:scale-[0.98] transition-all text-center">
                  Full Report
                </Link>
                <Link href={`/roadmap/${slug}`} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#10B981] px-5 py-3 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.98] transition-all">
                  <Sparkles className="h-4 w-4" /> Roadmap
                </Link>
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
                {tab === "Technical Requirements" && (
                  <span className="ml-2 text-[11px] text-[#6B7280] font-normal">High</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ─── TAB CONTENT ─── */}
        {activeTab === "Overview" && <OverviewContent data={data} slug={slug} setTab={setActiveTab} />}
        {activeTab === "Technical Requirements" && <TechnicalRequirementsTab data={data} raw={rawCompany as Record<string, unknown>} name={name} />}
        {activeTab === "Projects & Stack" && <ProjectsTab raw={rawCompany as Record<string, unknown>} name={name} />}
        {activeTab === "Interview Guide" && <InterviewGuideTab raw={rawCompany as Record<string, unknown>} name={name} />}
      </div>
    </DashboardLayout>
  );
}

/* ════════════════════════════════════════════════════════
   OVERVIEW TAB — Exact match to reference 2-column layout
   ════════════════════════════════════════════════════════ */
function OverviewContent({ data, slug, setTab }: { data: CompanyPageData; slug: string; setTab: (t: Tab) => void }) {
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
              <button onClick={() => setTab("Technical Requirements")} className="text-sm font-medium text-[#10B981] hover:underline">View All Data</button>
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
   TAB 2 — TECHNICAL REQUIREMENTS (merged DSA + System Design)
   ════════════════════════════════════════════════════════ */
function TechnicalRequirementsTab({ data, raw, name }: { data: CompanyPageData; raw: Record<string, unknown>; name: string }) {
  // === DSA Data ===
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsa = (raw.dsa_requirements || {}) as any;
  const minProblems = dsa.minimum_problems || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weights = (raw.scoring_weights || {}) as any;
  const dsaWeight = parseFloat(weights.dsa_score || "0.25");
  const topicTargets = dsa.topic_targets || {};
  const difficultyMix = dsa.difficulty_mix || {};
  const barSummary = dsa.bar || "Strong algorithmic problem-solving required.";

  const sortedTopics = Object.entries(topicTargets)
    .map(([key, val]: [string, unknown]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = val as any;
      return { name: key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), count: t.recommended || 20, difficulty: t.difficulty || "Medium" };
    })
    .sort((a, b) => b.count - a.count);

  // === System Design Data ===
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sysDesign = (raw.system_design || {}) as any;
  const coreTopics: string[] = sysDesign.core_topics || ["Distributed Systems", "Database Design", "Caching", "Load Balancing", "API Design"];
  const mustKnowDesigns: string[] = sysDesign.must_know_designs || ["URL Shortener", "Chat System", "News Feed", "Rate Limiter"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const interviewProblems = (sysDesign.interview_problems || []).map((p: any) => ({
    name: typeof p === "string" ? p : p.name || p.title || "Untitled",
    difficulty: typeof p === "string" ? "Medium" : p.difficulty || "Medium",
    tags: typeof p === "string" ? ["System Design"] : p.tags || ["System Design"],
  }));

  const diffBadge = (d: string) => {
    if (d === "Hard") return "bg-[#FEF2F2] text-[#DC2626]";
    if (d === "Medium") return "bg-[#FFFBEB] text-[#D97706]";
    return "bg-[#ECFDF5] text-[#10B981]";
  };

  return (
    <div className="space-y-10">
      {/* ═══ SECTION A: DSA REQUIREMENTS ═══ */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-1">
          <Code2 className="h-5 w-5 text-[#10B981]" />
          <h2 className="text-lg font-bold text-[#111827]">DSA Requirements</h2>
          <span className="ml-auto rounded-full bg-[#ECFDF5] px-3 py-0.5 text-xs font-semibold text-[#10B981]">Weight: {Math.round(dsaWeight * 100)}%</span>
        </div>

        {/* Bar Level */}
        <div className="rounded-xl bg-[#FEF2F2] border-l-4 border-[#EF4444] p-4">
          <p className="text-sm font-medium text-[#DC2626] flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {barSummary}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { label: "Total Target", value: minProblems.total || "—", badge: "Problems" },
            { label: "Easy", value: minProblems.easy || "—", badge: `${difficultyMix.easy || "—"}` },
            { label: "Medium", value: minProblems.medium || "—", badge: `${difficultyMix.medium || "—"}` },
            { label: "Hard", value: minProblems.hard || "—", badge: `${difficultyMix.hard || "—"}` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-center">
              <p className="text-xs text-[#9CA3AF] mb-1">{s.label}</p>
              <p className="text-xl font-bold text-[#111827]">{s.value}</p>
              <p className="text-[10px] text-[#6B7280]">{s.badge}</p>
            </div>
          ))}
        </div>

        {/* Topic-wise Breakdown */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">Topic-wise Problem Targets</h3>
          <div className="space-y-3">
            {sortedTopics.map((t) => (
              <div key={t.name} className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#374151] w-[150px] shrink-0">{t.name}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div className="h-full rounded-full bg-[#10B981] transition-all duration-700" style={{ width: `${(t.count / (sortedTopics[0]?.count || 30)) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-[#111827] w-8 text-right">{t.count}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${diffBadge(t.difficulty)}`}>{t.difficulty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DSA Topic Frequency Chart */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-5">DSA Topic Frequency in Interviews</h3>
          <BarChart data={data.dsaTopicFreq} />
        </div>
      </div>

      {/* ═══ Divider ═══ */}
      <div className="border-t border-[#E5E7EB]" />

      {/* ═══ SECTION B: SYSTEM DESIGN ═══ */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-1">
          <Layers className="h-5 w-5 text-[#10B981]" />
          <h2 className="text-lg font-bold text-[#111827]">System Design Requirements</h2>
        </div>

        {/* Core Topics Grid */}
        <div>
          <h3 className="text-base font-semibold text-[#111827] mb-4">Core Concepts to Master</h3>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {coreTopics.map((topic) => (
              <div key={topic} className="rounded-xl border border-[#E5E7EB] bg-white p-4 hover:border-[#A7F3D0] transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] flex items-center justify-center text-[#10B981] group-hover:bg-[#10B981] group-hover:text-white transition-colors">
                    <Layers className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-[#374151]">{topic}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Must-Know System Designs */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-4">Must-Know System Designs for {name}</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {mustKnowDesigns.map((design, idx) => (
              <div key={design} className="flex items-center gap-3 rounded-lg border border-[#F3F4F6] bg-[#F9FAFB] px-4 py-3 hover:border-[#A7F3D0] transition-colors">
                <span className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                <span className="text-sm font-medium text-[#374151]">{design}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interview Problems */}
        {interviewProblems.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-[#111827] mb-4">Common System Design Interview Problems</h3>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {interviewProblems.map((p: {name: string; difficulty: string; tags: string[]}) => (
                <div key={p.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#A7F3D0] transition-colors group cursor-pointer">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-[#111827]">{p.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${diffBadge(p.difficulty)}`}>{p.difficulty}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-medium text-[#6B7280]">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 3 — PROJECTS & STACK
   ════════════════════════════════════════════════════════ */
function ProjectsTab({ raw, name }: { raw: Record<string, unknown>; name: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectsData = (raw.projects || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const techStackData = (raw.tech_stack || {}) as any;
  const mustHave: string[] = projectsData.must_have || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allProjects = (projectsData.impressive_projects || []).map((p: any) => ({
    category: p.category || "Full Stack",
    title: p.title || p,
    desc: p.desc || `Build a production-quality project.`,
    tags: p.tags || (techStackData.preferred_languages || []).slice(0, 3),
    hours: p.hours || 20,
    complexity: p.complexity || "Medium",
    image: undefined,
  }));

  // Build tech stack from API data
  const techStack: { group: string; items: string[] }[] = [];
  if (techStackData.preferred_languages?.length) techStack.push({ group: "Languages", items: techStackData.preferred_languages });
  if (techStackData.frameworks?.length) techStack.push({ group: "Frameworks", items: techStackData.frameworks });
  if (techStackData.databases?.length) techStack.push({ group: "Databases", items: techStackData.databases });
  if (techStackData.cloud_platforms?.length) techStack.push({ group: "Cloud", items: techStackData.cloud_platforms });
  if (techStackData.tools?.length) techStack.push({ group: "Tools", items: techStackData.tools });
  if (techStack.length === 0) techStack.push({ group: "Languages", items: ["Java", "Python", "Go"] });

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
          <h3 className="text-base font-semibold text-[#111827]">Project Recommendations for {name}</h3>
          <p className="text-sm text-[#9CA3AF]">Projects that have impressed {name} interviewers</p>
        </div>
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 mt-5">
          {allProjects.map((p: {category: string; title: string; desc: string; tags: string[]; hours: number; complexity: string; image?: string}) => (
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
        <h3 className="text-base font-semibold text-[#111827] mb-5">{name}-Preferred Tech Stack</h3>
        <div className="space-y-4">
          {techStack.map((g) => (
            <div key={g.group} className="flex items-center gap-4">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider w-[110px] shrink-0">{g.group}</span>
              <div className="flex flex-wrap gap-2">
                {g.items.map((item: string) => (
                  <span key={item} className="border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm font-medium text-[#374151] bg-white hover:border-[#A7F3D0] hover:text-[#10B981] transition-colors cursor-pointer">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Must-Have Tips */}
      {mustHave.length > 0 && (
        <div className="rounded-xl bg-[#ECFDF5] border-l-4 border-[#10B981] p-5">
          <h3 className="text-sm font-semibold text-[#111827] mb-3">Must-Have for {name}</h3>
          <ul className="space-y-2 text-sm text-[#374151]">
            {mustHave.map((tip, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 4 — INTERVIEW GUIDE (merged Interview Format + Do/Don't + Tips)
   ════════════════════════════════════════════════════════ */
function InterviewGuideTab({ raw, name }: { raw: Record<string, unknown>; name: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const interviewFmt = (raw.interview_format || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hiringData = (raw.hiring_data || {}) as any;
  const dosData: string[] = hiringData.dos_donts?.do || ["Explain your thought process out loud", "Write clean, optimized code", "Ask clarifying questions first"];
  const dontsData: string[] = hiringData.dos_donts?.dont || ["Jump to code without thinking", "Use brute force without acknowledging", "Skip edge cases"];
  const insiderTips: string[] = hiringData.insider_tips || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = hiringData.interview_stats || {} as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rounds = (interviewFmt.rounds || []) as any[];
  const stages = rounds.length > 0
    ? rounds.map((r: Record<string, unknown>, i: number) => ({
        label: (r.type as string) || `Round ${i + 1}`,
        duration: r.duration_min ? `${r.duration_min} min` : "—",
        desc: (r.description as string) || "",
        difficulty: (r.difficulty as string) || "Medium",
        filled: i < Math.ceil(rounds.length / 2),
      }))
    : [
        { label: "Online Assessment", duration: "90 min", desc: "Coding problems", difficulty: "Hard", filled: true },
        { label: "Technical Interview", duration: "45-60 min", desc: "DSA + problem solving", difficulty: "Hard", filled: true },
        { label: "Hiring Manager", duration: "45 min", desc: "Behavioral + fit", difficulty: "Easy", filled: false },
      ];

  const diffBadge = (d: string) => {
    if (d === "Hard") return "bg-[#FEF2F2] text-[#DC2626]";
    if (d === "Medium") return "bg-[#FFFBEB] text-[#D97706]";
    return "bg-[#ECFDF5] text-[#10B981]";
  };

  // Reviews data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiReviews: any[] = hiringData.interview_reviews || [];
  const reviews = apiReviews.length > 0
    ? apiReviews.map((r: {round: string; question: string; difficulty: string; outcome: string; quote: string; rating: number; date: string; role: string}) => ({
        round: r.round,
        question: r.question,
        difficulty: r.difficulty as "Hard" | "Medium" | "Easy",
        outcome: r.outcome as "Offer" | "Rejected",
        quote: r.quote,
        rating: r.rating || 3,
        date: r.date || "Recent",
        role: r.role || "SDE",
      }))
    : [];

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
              {dosData.slice(0, 5).map((d, i) => (
                <li key={i} className="flex items-start gap-2"><span className="text-[#10B981]">✓</span> {d}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-5">
            <h4 className="text-sm font-bold text-[#EF4444] mb-3 flex items-center gap-2"><XCircle className="h-4 w-4" /> Don&apos;t</h4>
            <ul className="space-y-2 text-sm text-[#374151]">
              {dontsData.slice(0, 5).map((d, i) => (
                <li key={i} className="flex items-start gap-2"><span className="text-[#EF4444]">✗</span> {d}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Interview Reviews (inline if any exist) */}
        {reviews.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-[#111827] mb-4">Interview Experiences</h3>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {reviews.slice(0, 4).map((r, i) => (
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
                  <div className="border-t border-[#F3F4F6] pt-3">
                    <p className="text-sm font-medium text-[#374151] mb-1">Q: {r.question}</p>
                    <p className="text-sm text-[#6B7280] italic leading-relaxed">&quot;{r.quote}&quot;</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-3 w-3" fill={j < r.rating ? "#F59E0B" : "#E5E7EB"} stroke="none" />
                      ))}
                    </div>
                    <span className="text-xs text-[#9CA3AF]">{r.date} · {r.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — Sidebar */}
      <div className="space-y-5">
        {/* Interview Stats */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h3 className="text-base font-semibold text-[#111827] mb-4">Interview Stats</h3>
          <div className="space-y-4">
            {[
              { label: "Success Rate", value: stats.success_rate || "—", color: "text-[#EF4444]" },
              { label: "Avg. Rounds", value: stats.avg_rounds || hiringData.interview_rounds || "—", color: "text-[#111827]" },
              { label: "Timeline", value: stats.timeline_weeks ? `${stats.timeline_weeks} weeks` : "—", color: "text-[#111827]" },
              { label: "Offer Rate", value: stats.offer_rate || "—", color: "text-[#EF4444]" },
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
            {(insiderTips.length > 0 ? insiderTips : ["Always start with brute force, then optimize", "Practice explaining your solution in plain English"]).slice(0, 5).map((tip, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> {tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

