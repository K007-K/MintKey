// DSA Tracker — problem list with topic sidebar, filters, solved tracking
"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Search, ExternalLink, Hash, CheckCircle2, Zap, AlertCircle, Loader2 } from "lucide-react";
import { useDSAProgress } from "@/lib/useDSAProgress";

/* ── Types ─────────────────────────────────────────────── */
interface Problem {
  _id: string;           // unique key for React rendering
  lc_number: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  url: string;
  neetcode_video?: string;
  study_plans?: string[];
}

interface SheetData {
  source: string;
  total: number;
  topics: Record<string, Problem[]>;
}

interface SheetMeta {
  key: string;
  name: string;
  total: number;
}

/* ── Constants ─────────────────────────────────────────── */
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

/* ── Difficulty helpers ────────────────────────────────── */
function diffBadge(d: string) {
  switch (d) {
    case "Easy": return { bg: "#ECFDF5", color: "#059669", text: "Easy" };
    case "Medium": return { bg: "#FFFBEB", color: "#D97706", text: "Medium" };
    case "Hard": return { bg: "#FEF2F2", color: "#DC2626", text: "Hard" };
    default: return { bg: "#F3F4F6", color: "#6B7280", text: d };
  }
}

/* ── Teal Checkmark Circle (Fix #2) ────────────────────── */
function SolvedCheck({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center focus:outline-none transition-transform active:scale-90" style={{ width: 18, height: 18 }}>
      {checked ? (
        <svg width={18} height={18} viewBox="0 0 18 18">
          <circle cx={9} cy={9} r={9} fill="#14B8A6" />
          <path d="M5 9.5L7.5 12L13 6.5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      ) : (
        <svg width={18} height={18} viewBox="0 0 18 18">
          <circle cx={9} cy={9} r={8} fill="none" stroke="#D1D5DB" strokeWidth={1.5} />
        </svg>
      )}
    </button>
  );
}

/* ── Topic progress bar color ──────────────────────────── */
function topicBarColor(pct: number) {
  if (pct >= 70) return "#10B981";
  if (pct >= 40) return "#F59E0B";
  return "#3B82F6";
}

/* ── Page ──────────────────────────────────────────────── */
export default function DSAPage() {
  const { toggleSolved, isSolved, solved, hydrated } = useDSAProgress();
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [sheets, setSheets] = useState<SheetMeta[]>([]);
  const [activeSheet, setActiveSheet] = useState("neetcode_150");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("All Difficulties");
  const [unsolvedOnly, setUnsolvedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  /* Fetch available sheets */
  useEffect(() => {
    fetch(`${API}/api/v1/dsa/sheets`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setSheets(d.data); })
      .catch(() => {});
  }, []);

  /* Fetch problems for active sheet */
  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/v1/dsa/problems?sheet=${activeSheet}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSheetData(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeSheet]);

  /* Reset page when filters change */
  useEffect(() => { setPage(1); }, [activeTopic, search, diffFilter, unsolvedOnly, activeSheet]);

  /* Build flat problem list with unique _id per row */
  const allProblems = useMemo<Problem[]>(() => {
    if (!sheetData?.topics) return [];
    const list: Problem[] = [];
    const seen = new Set<string>();
    for (const [topicName, problems] of Object.entries(sheetData.topics)) {
      if (Array.isArray(problems)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (problems as any[]).forEach((p: any, idx: number) => {
          // Build a unique id: prefer lc_number, fallback to topic+index
          let id = p.lc_number ? String(p.lc_number) : `${topicName}-${idx}`;
          if (seen.has(id)) id = `${topicName}-${idx}-${id}`;
          seen.add(id);
          list.push({
            ...p,
            _id: id,
            lc_number: (p.lc_number as number) || 0,
            title: (p.title as string) || "Untitled",
            difficulty: (p.difficulty as "Easy" | "Medium" | "Hard") || "Medium",
            url: (p.url as string) || "",
          } as Problem);
        });
      }
    }
    return list;
  }, [sheetData]);

  /* Topic names and counts */
  const topicEntries = useMemo(() => {
    if (!sheetData?.topics) return [];
    return Object.entries(sheetData.topics)
      .filter(([, v]) => Array.isArray(v))
      .map(([name, problems]) => {
        const probs = problems as Problem[];
        const solvedCount = probs.filter((p) => isSolved(p.lc_number)).length;
        return { name, total: probs.length, solved: solvedCount };
      });
  }, [sheetData, isSolved, solved]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Filter problems */
  const filtered = useMemo(() => {
    let list = activeTopic && sheetData?.topics
      ? (sheetData.topics[activeTopic] as Problem[] || [])
      : allProblems;

    if (search) {
      const s = search.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(s) || String(p.lc_number).includes(s));
    }
    if (diffFilter !== "All Difficulties") {
      list = list.filter((p) => p.difficulty === diffFilter);
    }
    if (unsolvedOnly) {
      list = list.filter((p) => !isSolved(p.lc_number));
    }
    return list;
  }, [allProblems, activeTopic, sheetData, search, diffFilter, unsolvedOnly, isSolved, solved]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Pagination */
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pagedProblems = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  /* Stats */
  const easyCount = allProblems.filter((p) => p.difficulty === "Easy" && isSolved(p.lc_number)).length;
  const medCount = allProblems.filter((p) => p.difficulty === "Medium" && isSolved(p.lc_number)).length;
  const hardCount = allProblems.filter((p) => p.difficulty === "Hard" && isSolved(p.lc_number)).length;
  const totalSolved = solved.size;
  const completePct = allProblems.length > 0 ? Math.round((allProblems.filter((p) => isSolved(p.lc_number)).length / allProblems.length) * 100) : 0;

  if (!hydrated || loading) {
    return (
      <DashboardLayout title="DSA Tracker" subtitle="Track your problem-solving progress by topic.">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
          <span className="ml-3 text-sm text-[#6B7280]">Loading problems...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="DSA Tracker" subtitle="Track your problem-solving progress by topic.">
      <div className="max-w-[1100px] mx-auto space-y-5">

        {/* ── Stat Cards (Fix #1: icon in 36px tinted rounded square) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Solved", value: totalSolved, Icon: Hash, iconBg: "#F0F9FF", iconColor: "#0EA5E9" },
            { label: "Easy", value: easyCount, Icon: CheckCircle2, iconBg: "#ECFDF5", iconColor: "#10B981" },
            { label: "Medium", value: medCount, Icon: Zap, iconBg: "#FFFBEB", iconColor: "#F59E0B" },
            { label: "Hard", value: hardCount, Icon: AlertCircle, iconBg: "#FEF2F2", iconColor: "#EF4444" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#E5E7EB] bg-white p-5 flex items-start justify-between">
              <div>
                <p className="text-xs text-[#9CA3AF] mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-[#111827]">{s.value}</p>
              </div>
              <div className="flex items-center justify-center rounded-lg" style={{ width: 36, height: 36, backgroundColor: s.iconBg }}>
                <s.Icon className="h-[18px] w-[18px]" style={{ color: s.iconColor }} strokeWidth={2} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Sheet tabs ── */}
        <div className="flex items-center gap-6 border-b border-[#F3F4F6] pb-2">
          {(sheets.length > 0 ? sheets : [
            { key: "neetcode_150", name: "NeetCode 150", total: sheetData?.total || 0 },
            { key: "blind_75", name: "Blind 75", total: 0 },
            { key: "striver_a2z", name: "Striver A2Z", total: 0 },
          ]).map((s) => (
            <button
              key={s.key}
              onClick={() => { setActiveSheet(s.key); setActiveTopic(null); }}
              className={`flex items-center gap-2 pb-2 text-sm font-medium transition-all border-b-2 ${
                activeSheet === s.key
                  ? "border-[#10B981] text-[#10B981]"
                  : "border-transparent text-[#6B7280] hover:text-[#374151]"
              }`}
            >
              {s.name}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                activeSheet === s.key ? "bg-[#ECFDF5] text-[#10B981]" : "bg-[#F3F4F6] text-[#9CA3AF]"
              }`}>{s.total}</span>
            </button>
          ))}
        </div>

        {/* ── Main content: sidebar + table ── */}
        <div className="flex gap-5">

          {/* ── Topic sidebar ── */}
          <div className="w-[220px] flex-shrink-0 rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">Topics</h3>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {topicEntries.map((t) => {
                const pct = t.total > 0 ? Math.round((t.solved / t.total) * 100) : 0;
                const isActive = activeTopic === t.name;
                return (
                  <button
                    key={t.name}
                    onClick={() => setActiveTopic(isActive ? null : t.name)}
                    className={`w-full text-left p-2 rounded-lg transition-all ${
                      isActive ? "bg-[#F0FDF4] border-l-2 border-[#10B981]" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-medium truncate ${isActive ? "text-[#10B981]" : "text-[#374151]"}`}>{t.name}</span>
                      <span className="text-[11px] text-[#9CA3AF] ml-2 flex-shrink-0">{t.solved}/{t.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F3F4F6]">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: topicBarColor(pct) }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Problem table ── */}
          <div className="flex-1 rounded-xl border border-[#E5E7EB] bg-white">

            {/* Filters row */}
            <div className="flex items-center gap-3 p-4 border-b border-[#F3F4F6]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
                />
              </div>
              <select
                value={diffFilter}
                onChange={(e) => setDiffFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs text-[#374151] outline-none focus:border-[#10B981] cursor-pointer"
              >
                <option>All Difficulties</option>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
              <label className="flex items-center gap-2 text-xs text-[#6B7280] cursor-pointer select-none ml-2">
                <span>Unsolved only</span>
                <button
                  onClick={() => setUnsolvedOnly(!unsolvedOnly)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${unsolvedOnly ? "bg-[#10B981]" : "bg-[#D1D5DB]"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${unsolvedOnly ? "translate-x-4" : ""}`} />
                </button>
              </label>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[40px_50px_1fr_100px_100px_50px] items-center px-4 py-2.5 border-b border-[#F3F4F6] text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
              <div></div>
              <div>#</div>
              <div>Title</div>
              <div>Difficulty</div>
              <div>Status</div>
              <div className="text-center">LC Link</div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-[#F9FAFB]">
              {pagedProblems.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#9CA3AF]">No problems found</div>
              ) : (
                pagedProblems.map((p) => {
                  const badge = diffBadge(p.difficulty);
                  const checked = isSolved(p.lc_number);
                  return (
                    <div
                      key={p._id}
                      className={`grid grid-cols-[40px_50px_1fr_100px_100px_50px] items-center px-4 py-3 transition-colors ${
                        checked ? "bg-[#F0FDF4]/50" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <div>
                        <SolvedCheck checked={checked} onClick={() => toggleSolved(p.lc_number)} />
                      </div>
                      <div className="text-xs text-[#9CA3AF] font-mono">{p.lc_number}</div>
                      <div className="text-sm font-medium text-[#111827] truncate pr-3">{p.title}</div>
                      <div>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded"
                          style={{ backgroundColor: badge.bg, color: badge.color }}
                        >
                          {badge.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className={`h-1.5 w-1.5 rounded-full ${checked ? "bg-[#10B981]" : "bg-[#D1D5DB]"}`} />
                        <span className={checked ? "text-[#10B981] font-medium" : "text-[#9CA3AF]"}>
                          {checked ? "Solved" : "Unsolved"}
                        </span>
                      </div>
                      <div className="flex justify-center">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#9CA3AF] hover:text-[#10B981] transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F4F6]">
              <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                  className="h-7 rounded border border-[#E5E7EB] bg-white px-2 text-xs text-[#374151] outline-none cursor-pointer"
                >
                  {ROWS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 w-7 flex items-center justify-center rounded text-xs text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-30 transition-all"
                >‹</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pg: number;
                  if (totalPages <= 5) pg = i + 1;
                  else if (page <= 3) pg = i + 1;
                  else if (page >= totalPages - 2) pg = totalPages - 4 + i;
                  else pg = page - 2 + i;
                  return (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`h-7 w-7 flex items-center justify-center rounded text-xs font-medium transition-all ${
                        page === pg ? "bg-[#10B981] text-white" : "text-[#6B7280] hover:bg-[#F3F4F6]"
                      }`}
                    >{pg}</button>
                  );
                })}
                {totalPages > 5 && page < totalPages - 2 && (
                  <>
                    <span className="text-xs text-[#9CA3AF] px-1">…</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="h-7 w-7 flex items-center justify-center rounded text-xs text-[#6B7280] hover:bg-[#F3F4F6]"
                    >{totalPages}</button>
                  </>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-7 w-7 flex items-center justify-center rounded text-xs text-[#6B7280] hover:bg-[#F3F4F6] disabled:opacity-30 transition-all"
                >›</button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer stats ── */}
        <div className="text-center text-xs text-[#9CA3AF] pt-2">
          Showing <span className="font-bold text-[#374151]">{allProblems.length}</span> problems · <span className="font-bold text-[#10B981]">{allProblems.filter((p) => isSolved(p.lc_number)).length}</span> solved · <span className="font-bold text-[#10B981]">{completePct}%</span> complete
        </div>
      </div>
    </DashboardLayout>
  );
}
