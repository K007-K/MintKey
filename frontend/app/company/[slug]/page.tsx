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
                {tab === "DSA Requirements" && (
                  <span className="ml-2 text-[11px] text-[#6B7280] font-normal">High</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ─── TAB CONTENT ─── */}
        {activeTab === "Overview" && <OverviewContent data={data} slug={slug} setTab={setActiveTab} />}
        {activeTab === "DSA Requirements" && <DSARequirementsTab data={data} raw={rawCompany as Record<string, unknown>} />}
        {activeTab === "System Design" && <SystemDesignTab raw={rawCompany as Record<string, unknown>} name={name} />}
        {activeTab === "Projects" && <ProjectsTab raw={rawCompany as Record<string, unknown>} name={name} />}
        {activeTab === "Interview Format" && <InterviewFormatTab raw={rawCompany as Record<string, unknown>} name={name} />}
        {activeTab === "Resources" && <ResourcesTab raw={rawCompany as Record<string, unknown>} name={name} />}
        {activeTab === "Reviews" && <ReviewsTab raw={rawCompany as Record<string, unknown>} name={name} />}
        {activeTab === "Skill Gap Analysis" && <SkillGapTab raw={rawCompany as Record<string, unknown>} name={name} slug={slug} />}
        {activeTab === "Preparation Strategy" && <PreparationStrategyTab raw={rawCompany as Record<string, unknown>} name={name} slug={slug} />}
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
function DSARequirementsTab({ data, raw }: { data: CompanyPageData; raw: Record<string, unknown> }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsa = (raw.dsa_requirements || {}) as any;
  const minProblems = dsa.minimum_problems || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weights = (raw.scoring_weights || {}) as any;
  const dsaWeight = parseFloat(weights.dsa_score || "0.25");

  const difficulty = [
    { label: "Easy", required: minProblems.easy || 50, user: 0, color: "#10B981", borderColor: "#A7F3D0" },
    { label: "Medium", required: minProblems.medium || 100, user: 0, color: "#F59E0B", borderColor: "#FDE68A" },
    { label: "Hard", required: minProblems.hard || 30, user: 0, color: "#EF4444", borderColor: "#FECACA" },
    { label: "Total", required: minProblems.total || 200, user: 0, color: "#10B981", borderColor: "#6EE7B7" },
  ];

  // Build topics from API topic_targets
  const topicTargets = dsa.topic_targets || {};
  const topics = Object.entries(topicTargets)
    .map(([key, val]: [string, unknown]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = val as any;
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return { name: label, required: t.recommended || 20, user: 0 };
    })
    .sort((a, b) => b.required - a.required)
    .slice(0, 8);

  // Contest expectations from API
  const recRating = dsa.recommended_rating || "1800+";
  const contestImportance = dsa.contest_importance || (dsaWeight >= 0.35 ? "Important" : "Helpful");
  const cpRequired = dsa.cp_required ? "Required" : "Optional";

  // Readiness: 0% when no user data
  const totalRequired = minProblems.total || 200;
  const totalSolved = 0;
  const readinessPct = totalRequired > 0 ? Math.round((totalSolved / totalRequired) * 100) : 0;

  // Generate tips from company data
  const topTopic = topics[0]?.name || "DSA";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const behavioral = (raw.behavioral || {}) as any;
  const companyName = (raw.name as string) || "this company";
  const tips = [
    `Focus on ${topTopic} — ${companyName} emphasizes this in ${Math.round(dsaWeight * 100)}% of scoring.`,
    `Target ${minProblems.medium || 100}+ medium problems — this is the most tested difficulty level.`,
    behavioral.type === "Leadership Principles" ? `Prepare STAR stories for ${companyName}'s Leadership Principles.` : "Practice explaining your approach clearly — communication is always graded.",
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
      {/* LEFT — Main content */}
      <div className="space-y-6">
        {/* Section 1: Problem Difficulty Targets */}
        <div className="grid gap-4 grid-cols-2">
          {difficulty.map((d) => {
            const pct = d.required > 0 ? Math.round((d.user / d.required) * 100) : 0;
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
          {topics.length > 0 ? (
            <div className="space-y-4">
              {topics.map((t) => {
                const pct = t.required > 0 ? Math.round((t.user / t.required) * 100) : 0;
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
          ) : (
            <p className="text-sm text-[#9CA3AF]">Topic targets not available for this company yet.</p>
          )}
          <div className="mt-4 text-right">
            <button className="text-sm font-medium text-[#10B981] hover:underline">View All Topics →</button>
          </div>
        </div>

        {/* Section 3: Contest Expectations */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-[#9CA3AF] mb-1">Recommended Rating</p>
              <p className="text-lg font-bold text-[#111827]">{recRating}</p>
            </div>
            <div className="text-center border-x border-[#F3F4F6]">
              <p className="text-xs text-[#9CA3AF] mb-1">Weekly Contest</p>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#FFFBEB] text-[#D97706]">{contestImportance}</span>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#9CA3AF] mb-1">CP Experience</p>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#F3F4F6] text-[#6B7280]">{cpRequired}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Sidebar */}
      <div className="space-y-5">
        {/* DSA Readiness */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-center">
          <h3 className="text-base font-semibold text-[#111827] mb-4">Your DSA Readiness</h3>
          <div className="text-5xl font-bold text-[#9CA3AF] mb-1">{readinessPct}%</div>
          <p className="text-xs text-[#9CA3AF] mb-5">{totalSolved} of {totalRequired} target problems solved</p>
          <div className="space-y-3 text-left">
            {[
              { label: "Easy", user: 0, req: minProblems.easy || 50, color: "#10B981" },
              { label: "Medium", user: 0, req: minProblems.medium || 100, color: "#F59E0B" },
              { label: "Hard", user: 0, req: minProblems.hard || 30, color: "#EF4444" },
            ].map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#6B7280]">{d.label}</span>
                  <span className="text-[#9CA3AF]">{d.user}/{d.req}</span>
                </div>
                <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${d.req > 0 ? (d.user / d.req) * 100 : 0}%`, backgroundColor: d.color }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[#9CA3AF] italic">Run analysis to see your progress</p>
          <button className="mt-3 w-full rounded-lg border border-[#10B981] text-[#10B981] py-2.5 text-sm font-medium hover:bg-[#ECFDF5] transition-colors">
            Practice Problems →
          </button>
        </div>

        {/* Quick Tips — company-specific */}
        <div className="rounded-xl bg-[#ECFDF5] border-l-4 border-[#10B981] p-5">
          <h3 className="text-sm font-semibold text-[#111827] mb-3">Quick Tips</h3>
          <ul className="space-y-2.5 text-sm text-[#374151]">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> {tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 3 — SYSTEM DESIGN
   ════════════════════════════════════════════════════════ */
function SystemDesignTab({ raw, name }: { raw: Record<string, unknown>; name: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sysDesign = (raw.system_design || {}) as any;
  const mustKnow: string[] = sysDesign.must_know_designs || [];
  const sdDepth = sysDesign.depth || "Medium";
  const sdRequired = sysDesign.required_at_sde1 ? "Required" : "Optional";

  const iconMap = [Layers, Database, MessageSquare, Server, Hash, Shield, GitBranch, Globe];
  const defaultTopics = [
    { name: "Load Balancing", desc: "Distribute traffic across servers", importance: "High" },
    { name: "Caching", desc: "Reduce latency using in-memory stores", importance: "High" },
    { name: "Message Queues", desc: "Async communication between services", importance: "Medium" },
    { name: "Database Sharding", desc: "Horizontal partitioning for scale", importance: "High" },
    { name: "Consistent Hashing", desc: "Distribute data with minimal remapping", importance: "Medium" },
    { name: "Rate Limiting", desc: "Control traffic to protect services", importance: "Medium" },
    { name: "Microservices", desc: "Decompose systems into independent services", importance: "High" },
    { name: "Distributed Systems", desc: "Coordinate across multiple nodes", importance: "High" },
  ];
  const coreTopics = defaultTopics.map((t, i) => ({ ...t, icon: (() => { const Icon = iconMap[i]; return <Icon className="h-5 w-5 text-[#10B981]" />; })() }));

  const problems = mustKnow.length > 0
    ? mustKnow.map((q, i) => ({ name: `Design: ${q}`, difficulty: (i % 2 === 0 ? "Hard" : "Medium") as "Hard" | "Medium", tags: ["System Design"] }))
    : [
        { name: "Design URL Shortener", difficulty: "Medium" as const, tags: ["Hashing", "Caching", "DB Design"] },
        { name: "Design YouTube", difficulty: "Hard" as const, tags: ["CDN", "Storage", "Streaming"] },
        { name: "Design Chat System", difficulty: "Hard" as const, tags: ["WebSockets", "Queues", "Presence"] },
      ];

  return (
    <div className="space-y-8">
      {/* Section 1: Core Topics Grid */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h3 className="text-base font-semibold text-[#111827]">Core System Design Topics</h3>
          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#FFFBEB] text-[#D97706]">{sdRequired} · {sdDepth}</span>
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
   TAB 5 — INTERVIEW FORMAT
   ════════════════════════════════════════════════════════ */
function InterviewFormatTab({ raw, name }: { raw: Record<string, unknown>; name: string }) {
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
        {insiderTips.length > 0 && (
          <div className="rounded-xl bg-[#ECFDF5] border-l-4 border-[#10B981] p-5">
            <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[#10B981]" /> Insider Tips</h3>
            <ul className="space-y-2.5 text-sm text-[#374151]">
              {insiderTips.slice(0, 5).map((tip, i) => (
                <li key={i} className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> {tip}</li>
              ))}
            </ul>
          </div>
        )}
        {insiderTips.length === 0 && (
          <div className="rounded-xl bg-[#ECFDF5] border-l-4 border-[#10B981] p-5">
            <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-[#10B981]" /> Insider Tips</h3>
            <ul className="space-y-2.5 text-sm text-[#374151]">
              <li className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> Always start with brute force, then optimize</li>
              <li className="flex items-start gap-2"><span className="text-[#10B981] mt-0.5">•</span> Practice explaining your solution in plain English</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 6 — RESOURCES
   ════════════════════════════════════════════════════════ */
function ResourcesTab({ raw, name }: { raw: Record<string, unknown>; name: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resourcesData = (raw.resources || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsaResources: any[] = resourcesData.dsa || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sdResources: any[] = resourcesData.system_design || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const behavioralResources: any[] = resourcesData.behavioral || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const platforms: any[] = resourcesData.platforms || [];

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
              {r.url ? <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm font-medium text-[#10B981] group-hover:underline block">Open Resource →</a> : <span className="mt-3 text-sm font-medium text-[#9CA3AF] block">Coming soon</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Behavioral Resources */}
      {behavioralResources.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-[#111827] mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-[#10B981]" /> Behavioral Resources</h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {behavioralResources.map((r: {name: string; desc: string; url?: string; cost: string; rating: number}) => (
              <div key={r.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#A7F3D0] transition-colors group cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-[#9CA3AF]" />
                  <h4 className="text-sm font-bold text-[#111827]">{r.name}</h4>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">{r.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">{stars(r.rating || 3)}</div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.cost === "Free" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-[#FFFBEB] text-[#D97706]"}`}>{r.cost}</span>
                </div>
                {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm font-medium text-[#10B981] group-hover:underline block">Open Resource →</a>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Design Resources */}
      <div>
        <h3 className="text-base font-semibold text-[#111827] mb-4 flex items-center gap-2"><Layers className="h-4 w-4 text-[#10B981]" /> System Design Resources</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {sdResources.map((r: {name: string; desc: string; url?: string; cost: string; rating: number}) => (
            <div key={r.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#A7F3D0] transition-colors group cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-[#9CA3AF]" />
                <h4 className="text-sm font-bold text-[#111827]">{r.name}</h4>
              </div>
              <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">{r.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">{stars(r.rating || 3)}</div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.cost === "Free" ? "bg-[#ECFDF5] text-[#10B981]" : "bg-[#FFFBEB] text-[#D97706]"}`}>{r.cost}</span>
              </div>
              {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-3 text-sm font-medium text-[#10B981] group-hover:underline block">Open Resource →</a>}
            </div>
          ))}
        </div>
      </div>

      {/* Practice Platforms */}
      {platforms.length > 0 && (<div>
        <h3 className="text-base font-semibold text-[#111827] mb-4">Practice Platforms</h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {platforms.map((p: {name: string; desc: string; url?: string; cost: string; color?: string}) => (
            <div key={p.name} className="rounded-xl border border-[#E5E7EB] bg-white p-5 text-center hover:border-[#A7F3D0] transition-colors group cursor-pointer">
              <div className="w-8 h-8 rounded-lg mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: (p.color || "#10B981") + "20" }}>
                <Globe className="h-4 w-4" style={{ color: p.color || "#10B981" }} />
              </div>
              <h4 className="text-sm font-bold text-[#111827] mb-0.5">{p.name}</h4>
              <p className="text-xs text-[#9CA3AF] mb-2">{p.desc}</p>
              <span className="text-[10px] font-medium text-[#6B7280]">{p.cost}</span>
              {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="block mx-auto mt-2 text-sm font-medium text-[#10B981] group-hover:underline">Visit →</a> : <button className="block mx-auto mt-2 text-sm font-medium text-[#10B981] group-hover:underline">Visit →</button>}
            </div>
          ))}
        </div>
      </div>)}

      {/* Curated Prep Course Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#10B981] to-[#0D9488] p-8 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{name} Interview Prep Course</h3>
          <p className="text-sm text-white/80">Curated by ex-{name} interviewers. Covers all rounds.</p>
        </div>
        <button className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#10B981] hover:bg-[#F0FDF4] transition-colors">Start Learning</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 7 — REVIEWS
   ════════════════════════════════════════════════════════ */
function ReviewsTab({ raw, name }: { raw: Record<string, unknown>; name: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hiringData = (raw.hiring_data || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiReviews: any[] = hiringData.interview_reviews || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = hiringData.interview_stats || {} as any;

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
    : [
        { round: "Technical DSA", question: "LeetCode Medium-Hard", difficulty: "Hard" as const, outcome: "Offer" as const, quote: "Standard DSA round.", rating: 4, date: "Recent", role: "SDE I" },
      ];

  const totalReviews = stats.total_reviews || reviews.length;
  const offerCount = reviews.filter(r => r.outcome === "Offer").length;
  const offerPct = reviews.length > 0 ? Math.round((offerCount / reviews.length) * 100) : 0;
  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "—";

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
            <p className="text-xl font-bold text-[#111827]">{totalReviews}</p>
            <p className="text-xs text-[#9CA3AF]">Total Reviews</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#10B981]">{offerPct}%</p>
            <p className="text-xs text-[#9CA3AF]">Offer Rate</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#111827]">{avgRating}/5</p>
            <p className="text-xs text-[#9CA3AF]">Avg Difficulty</p>
          </div>
          <div>
            <p className="text-xl font-bold text-[#111827]">{reviews[0]?.role || "SDE"}</p>
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
function SkillGapTab({ raw, name, slug }: { raw: Record<string, unknown>; name: string; slug: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsa = (raw.dsa_requirements || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sysDesign = (raw.system_design || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectsData = (raw.projects || {}) as any;
  const minProblems = dsa.minimum_problems || {};
  const mustKnowDesigns = sysDesign.must_know_designs || [];
  const impressiveProjects = projectsData.impressive_projects || [];

  // Readiness: 0% until user runs analysis
  const readiness = [
    { area: "DSA", pct: 0, status: "Not Analyzed" },
    { area: "System Design", pct: 0, status: "Not Analyzed" },
    { area: "Projects", pct: 0, status: "Not Analyzed" },
    { area: "Interview Prep", pct: 0, status: "Not Analyzed" },
  ];

  // Build gap table dynamically from company requirements
  const topicTargets = dsa.topic_targets || {};
  const gapTable: { skill: string; required: string; yours: string; gap: string; severity: "critical" | "warning" | "ok" }[] = [];
  Object.entries(topicTargets)
    .sort(([, a]: [string, unknown], [, b]: [string, unknown]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((b as any).recommended || 0) - ((a as any).recommended || 0);
    })
    .slice(0, 5)
    .forEach(([key, val]: [string, unknown]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = val as any;
      const label = key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      const req = t.recommended || 20;
      gapTable.push({ skill: label, required: `${req} problems`, yours: "0 problems", gap: `-${req}`, severity: "critical" });
    });
  if (mustKnowDesigns.length > 0) {
    gapTable.push({ skill: "System Design", required: `${mustKnowDesigns.length} topics`, yours: "0 topics", gap: `-${mustKnowDesigns.length}`, severity: "critical" });
  }
  if (impressiveProjects.length > 0) {
    gapTable.push({ skill: "Projects", required: `${impressiveProjects.length} projects`, yours: "0 projects", gap: `-${impressiveProjects.length}`, severity: "critical" });
  }

  // Weak areas from top gaps
  const weakAreas = gapTable.slice(0, 3).map((g) => ({
    name: g.skill,
    gap: g.required,
    priority: "Critical" as const,
    cta: g.skill === "System Design" ? "Start System Design →" : g.skill === "Projects" ? "Browse Templates →" : `Practice ${g.skill} →`,
    border: "border-[#EF4444]",
  }));

  // Blockers from company requirements
  const blockers = [
    minProblems.total ? `DSA: 0 of ${minProblems.total} target problems solved` : null,
    mustKnowDesigns.length > 0 ? `System Design: 0 of ${mustKnowDesigns.length} topics covered` : null,
    impressiveProjects.length > 0 ? `Projects: 0 of ${impressiveProjects.length} required` : null,
  ].filter(Boolean) as string[];

  const statusColor = (s: string) => {
    if (s === "Good Progress" || s === "On Track") return "text-[#10B981]";
    if (s === "Needs Work") return "text-[#F59E0B]";
    return "text-[#9CA3AF]";
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
          <h3 className="text-base font-semibold text-[#111827] mb-5">Your Overall Readiness for {name}</h3>
          <div className="space-y-3">
            {readiness.map((r) => (
              <div key={r.area} className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#374151] w-[120px] shrink-0">{r.area}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(r.pct, 2)}%`, backgroundColor: barColor(r.pct) }} />
                </div>
                <span className="text-sm font-bold text-[#111827] w-10">{r.pct}%</span>
                <span className={`text-xs font-medium w-[100px] text-right ${statusColor(r.status)}`}>{r.status}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-5">
            <span className="text-sm text-[#6B7280]">Composite Score:</span>
            <span className="text-lg font-bold text-[#9CA3AF]">—</span>
            <Link href={`/roadmap/${slug}`} className="ml-auto rounded-lg bg-[#10B981] px-4 py-2 text-sm font-medium text-white hover:bg-[#059669] transition-colors">Generate Roadmap →</Link>
          </div>
          <p className="text-xs text-[#9CA3AF] italic mt-3">Run analysis to see your personalized readiness scores</p>
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
              <p className="text-xs text-[#9CA3AF] mb-1">Need: {w.gap}</p>
              <p className="text-xs text-[#9CA3AF] mb-3">Priority: <span className="text-[#EF4444] font-semibold">{w.priority}</span></p>
              <button className="text-sm font-medium text-[#10B981] hover:underline">{w.cta}</button>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Sidebar */}
      <div className="space-y-5">
        {/* Readiness Score */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-center">
          <div className="text-5xl font-bold text-[#9CA3AF] mb-1">—</div>
          <p className="text-sm text-[#6B7280] mb-1">Match Score</p>
          <p className="text-xs text-[#9CA3AF]">Run analysis to calculate your score</p>
        </div>

        {/* What's Holding You Back — from API */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
          <h3 className="text-sm font-semibold text-[#111827] mb-4">Requirements for {name}</h3>
          <ul className="space-y-3 text-sm text-[#6B7280]">
            {blockers.map((b, i) => (
              <li key={i} className="flex items-start gap-2"><AlertCircle className="h-4 w-4 text-[#EF4444] shrink-0 mt-0.5" /> {b}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TAB 9 — PREPARATION STRATEGY
   ════════════════════════════════════════════════════════ */
function PreparationStrategyTab({ raw, name, slug }: { raw: Record<string, unknown>; name: string; slug: string }) {
  const [activeStep, setActiveStep] = useState(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dsa = (raw.dsa_requirements || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sysDesign = (raw.system_design || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const behavioral = (raw.behavioral || {}) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectsData = (raw.projects || {}) as any;
  const minProblems = dsa.minimum_problems || {};
  const topicTargets = dsa.topic_targets || {};
  const mustKnowDesigns = sysDesign.must_know_designs || [];
  const impressiveProjects = projectsData.impressive_projects || [];

  // Generate steps from company data
  const sortedTopics = Object.entries(topicTargets)
    .map(([key, val]: [string, unknown]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = val as any;
      return { name: key.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), count: t.recommended || 20 };
    })
    .sort((a, b) => b.count - a.count);

  const steps: { num: number; title: string; desc: string; est: string; cta: string }[] = [];
  let stepNum = 1;
  // Step 1-2: Top 2 DSA topics
  if (sortedTopics[0]) {
    steps.push({ num: stepNum++, title: `Master ${sortedTopics[0].name}`, desc: `Solve ${sortedTopics[0].count}+ problems. This is ${name}'s most tested topic.`, est: "2-3 weeks", cta: "Start →" });
  }
  if (sortedTopics[1]) {
    steps.push({ num: stepNum++, title: `Strengthen ${sortedTopics[1].name}`, desc: `Target ${sortedTopics[1].count}+ problems in this area.`, est: "1-2 weeks", cta: "Start →" });
  }
  // Step 3: Projects
  if (impressiveProjects.length > 0) {
    const projTitle = typeof impressiveProjects[0] === "object" ? impressiveProjects[0].title : impressiveProjects[0];
    steps.push({ num: stepNum++, title: "Build a Standout Project", desc: `${name} values: ${projTitle}. Build ${impressiveProjects.length} production-quality project(s).`, est: "3-4 weeks", cta: "View Templates →" });
  }
  // Step 4: System Design
  if (mustKnowDesigns.length > 0) {
    steps.push({ num: stepNum++, title: "System Design Preparation", desc: `Cover: ${mustKnowDesigns.slice(0, 3).join(", ")}${mustKnowDesigns.length > 3 ? ` + ${mustKnowDesigns.length - 3} more` : ""}.`, est: "2 weeks", cta: "Resources →" });
  }
  // Step 5: Mock interviews & behavioral
  steps.push({ num: stepNum++, title: "Mock Interviews & Behavioral", desc: behavioral.type === "Leadership Principles" ? `Prepare STAR stories for ${name}'s Leadership Principles.` : `Practice ${behavioral.type || "behavioral"} questions. 2-3 mocks/week.`, est: "2 weeks", cta: "Schedule →" });

  // Weekly plan from topics
  const totalProblems = minProblems.total || 200;
  const weeklyPlan = [
    { week: "Week 1-2", task: sortedTopics[0] ? `Solve ${sortedTopics[0].count} ${sortedTopics[0].name} problems` : `Solve ${Math.round(totalProblems * 0.3)} Easy + Medium problems`, current: true },
    { week: "Week 3-4", task: sortedTopics[1] ? `Practice ${sortedTopics[1].name} (${sortedTopics[1].count} problems)` : `Practice Medium + Hard problems`, current: false },
    { week: "Week 5-6", task: impressiveProjects.length > 0 ? `Build project + polish README/docs` : `Solve remaining ${Math.round(totalProblems * 0.3)} problems + build 1 project`, current: false },
    { week: "Week 7", task: mustKnowDesigns.length > 0 ? `System Design: ${mustKnowDesigns.slice(0, 2).join(", ")}` : "Review weak topics + practice Hard problems", current: false },
    { week: "Week 8", task: `Mock interviews (2-3/week), ${behavioral.type || "behavioral"} prep, full review`, current: false },
  ];

  const projections = [
    { label: "Current Score", pct: 0, delta: null },
    { label: "After DSA (Week 4)", pct: 40, delta: "+40%" },
    { label: "After Projects (Week 6)", pct: 65, delta: "+25%" },
    { label: "After Mocks (Week 8)", pct: 85, delta: "+20%" },
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
          <h3 className="text-lg font-bold text-white">Ready to start your {name} preparation?</h3>
        </div>
        <p className="text-sm text-white/80 mb-5">Get a personalized day-by-day roadmap based on your profile</p>
        <Link href={`/roadmap/${slug}`} className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#10B981] hover:bg-[#F0FDF4] transition-colors">Generate Full Roadmap →</Link>
      </div>
    </div>
  );
}
