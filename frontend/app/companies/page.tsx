// Company explorer — browse companies, manage targets, filter and search
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { CompanyLogoIcon } from "@/components/ui/CompanyLogos";
import { Search, Bell, ChevronDown, X, Plus, Loader2 } from "lucide-react";
import { useCompanies } from "@/lib/api";

/* ── Company UI type ────────────────────────────────────────────── */

interface Company {
  name: string;
  slug: string;
  category: string;
  salary: string;
  difficulty: "Hard" | "Medium" | "Easy";
  score: number;
}

/* ── Transform DB data → UI Company shape ─────────────────────── */

function mapDifficulty(raw: string | undefined): "Hard" | "Medium" | "Easy" {
  if (!raw) return "Medium";
  const d = raw.toLowerCase();
  if (d.includes("very hard") || d.includes("hard")) return "Hard";
  if (d.includes("easy")) return "Easy";
  return "Medium";
}

function formatSalary(hiring: Record<string, unknown> | null): string {
  if (!hiring) return "—";
  const pkg = hiring.package_range_lpa as { min?: number; max?: number } | undefined;
  if (!pkg) return "—";
  return `₹${pkg.min ?? 0} - ${pkg.max ?? 0} LPA`;
}

function transformCompany(raw: Record<string, unknown>): Company {
  const hiring = raw.hiring_data as Record<string, unknown> | null;
  return {
    name: raw.name as string,
    slug: raw.slug as string,
    category: (raw.type as string) || "Company",
    salary: formatSalary(hiring),
    difficulty: mapDifficulty(hiring?.hiring_difficulty as string | undefined),
    score: 0, // Placeholder until user has real match scores
  };
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function diffColor(d: string) {
  if (d === "Hard") return "#DC2626";
  if (d === "Medium") return "#D97706";
  return "#10B981";
}

function diffBg(d: string) {
  if (d === "Hard") return "#FEF2F2";
  if (d === "Medium") return "#FFFBEB";
  return "#ECFDF5";
}

function scoreBarColor(score: number) {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function CompaniesPage() {
  const router = useRouter();
  const { data: rawCompanies, isLoading, isError } = useCompanies();
  const [search, setSearch] = useState("");
  const [targetSlugs, setTargetSlugs] = useState<string[]>([
    "google", "meta", "amazon", "microsoft",
  ]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [companyTypeFilter, setCompanyTypeFilter] = useState("All Company Types");
  const [dsaFilter, setDsaFilter] = useState("All DSA Levels");
  const [packageFilter, setPackageFilter] = useState("All Package Ranges");

  /* Transform API data */
  const allCompanies: Company[] = useMemo(() => {
    if (!rawCompanies || !Array.isArray(rawCompanies)) return [];
    return (rawCompanies as Record<string, unknown>[]).map(transformCompany);
  }, [rawCompanies]);

  /* Derive targets from slugs */
  const targets = useMemo(
    () => allCompanies.filter((c) => targetSlugs.includes(c.slug)),
    [allCompanies, targetSlugs]
  );

  /* Non-targeted companies for the "All" grid */
  const nonTargeted = useMemo(
    () => allCompanies.filter((c) => !targetSlugs.includes(c.slug)),
    [allCompanies, targetSlugs]
  );

  /* Unique company types for the filter */
  const companyTypes = useMemo(
    () => ["All Company Types", ...new Set(allCompanies.map((c) => c.category))],
    [allCompanies]
  );

  const removeTarget = (slug: string) => {
    setTargetSlugs((prev) => prev.filter((s) => s !== slug));
  };

  const addTarget = (company: Company) => {
    if (!targetSlugs.includes(company.slug) && targetSlugs.length < 5) {
      setTargetSlugs((prev) => [...prev, company.slug]);
    }
  };

  /* Filter + search */
  const filteredCompanies = nonTargeted.filter((c: Company) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (dsaFilter === "Hard" && c.difficulty !== "Hard") return false;
    if (dsaFilter === "Medium" && c.difficulty !== "Medium") return false;
    if (dsaFilter === "Easy" && c.difficulty !== "Easy") return false;
    if (companyTypeFilter !== "All Company Types" && c.category !== companyTypeFilter) return false;
    return true;
  });

  const visibleCompanies = filteredCompanies.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCompanies.length;

  /* Loading state */
  if (isLoading) {
    return (
      <DashboardLayout title="Company Explorer" subtitle="Browse companies and see how ready you are">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
          <span className="ml-3 text-sm text-[#6B7280]">Loading companies...</span>
        </div>
      </DashboardLayout>
    );
  }

  /* Error state */
  if (isError) {
    return (
      <DashboardLayout title="Company Explorer" subtitle="Browse companies and see how ready you are">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-[#EF4444] font-medium mb-2">Failed to load companies</p>
          <p className="text-xs text-[#9CA3AF]">Make sure the backend is running and try again.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Company Explorer" subtitle="Browse companies and see how ready you are">
      {/* ── Search bar row ── */}
      <div className="flex items-center justify-between mb-5">
        <div />
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] transition-colors"
            />
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition-all">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-6 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6] px-4 py-3">
        <FilterDropdown value={companyTypeFilter} onChange={setCompanyTypeFilter} options={companyTypes} />
        <FilterDropdown value={dsaFilter} onChange={setDsaFilter} options={["All DSA Levels", "Hard", "Medium", "Easy"]} />
        <FilterDropdown value={packageFilter} onChange={setPackageFilter} options={["All Package Ranges"]} />
      </div>

      {/* ── Your Target Companies ── */}
      {targets.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-base font-bold text-[#111827]">Your Target Companies</h2>
            <button className="text-xs text-[#6B7280] hover:text-[#10B981] transition-colors">Edit targets</button>
          </div>
          <p className="text-xs text-[#9CA3AF] mb-3">Companies you&apos;re actively preparing for</p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {targets.map((t) => (
              <div
                key={t.slug}
                onClick={() => router.push(`/company/${t.slug}`)}
                className="relative rounded-xl border border-[#E5E7EB] bg-white p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#D1D5DB] group"
              >
                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeTarget(t.slug); }}
                  className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[#D1D5DB] opacity-0 group-hover:opacity-100 hover:text-[#6B7280] hover:bg-[#F3F4F6] transition-all"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* Logo */}
                <div className="mb-2.5">
                  <CompanyLogoIcon slug={t.slug} size={36} />
                </div>

                {/* Name */}
                <h3 className="text-sm font-semibold text-[#111827] mb-0.5">{t.name}</h3>

                {/* Salary + difficulty */}
                <div className="flex items-center gap-1.5 text-xs mb-2.5">
                  <span className="text-[#6B7280]">{t.salary}</span>
                  <span className="text-[#E5E7EB]">·</span>
                  <span
                    className="font-semibold text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: diffColor(t.difficulty), backgroundColor: diffBg(t.difficulty) }}
                  >
                    {t.difficulty}
                  </span>
                </div>

                {/* Match score */}
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#9CA3AF]">Match Score</span>
                  <span className="font-semibold text-[#111827]">{t.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F3F4F6]">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${t.score}%`, backgroundColor: scoreBarColor(t.score) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── All Companies ── */}
      <section>
        <div className="flex items-center justify-between mb-0.5">
          <h2 className="text-base font-bold text-[#111827]">All Companies</h2>
          <span className="text-xs text-[#9CA3AF]">Showing <span className="font-bold text-[#374151]">{filteredCompanies.length}</span> companies</span>
        </div>
        <p className="text-xs text-[#9CA3AF] mb-4">Explore and add companies to your targets</p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCompanies.map((c) => {
            const isTargeted = targets.some((t) => t.slug === c.slug);
            return (
              <div
                key={c.slug}
                onClick={() => router.push(`/company/${c.slug}`)}
                className="rounded-xl border border-[#E5E7EB] bg-white p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#D1D5DB] group"
              >
                {/* Header: logo + name/category */}
                <div className="flex items-center gap-3 mb-3">
                  <CompanyLogoIcon slug={c.slug} size={36} />
                  <div>
                    <h3 className="text-sm font-semibold text-[#111827] group-hover:text-[#10B981] transition-colors">{c.name}</h3>
                    <p className="text-[11px] text-[#9CA3AF]">{c.category}</p>
                  </div>
                </div>

                {/* Salary + difficulty */}
                <div className="flex items-center gap-1.5 text-xs mb-2.5">
                  <span className="text-[#6B7280]">{c.salary}</span>
                  <span className="text-[#E5E7EB]">·</span>
                  <span
                    className="font-semibold text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: diffColor(c.difficulty), backgroundColor: diffBg(c.difficulty) }}
                  >
                    {c.difficulty}
                  </span>
                </div>

                {/* Match score */}
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#9CA3AF]">Match Score</span>
                  <span className="font-semibold text-[#111827]">{c.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F3F4F6] mb-3">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${c.score}%`, backgroundColor: scoreBarColor(c.score) }}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 border-t border-[#F3F4F6] pt-2.5">
                  <Link
                    href={`/company/${c.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center rounded-lg bg-[#111827] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1F2937] active:scale-[0.98] transition-all"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={(e) => { e.stopPropagation(); addTarget(c); }}
                    disabled={isTargeted}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isTargeted
                        ? "bg-[#F9FAFB] text-[#D1D5DB] cursor-default border border-[#F3F4F6]"
                        : "bg-white text-[#374151] border border-[#E5E7EB] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] active:scale-[0.98]"
                    }`}
                  >
                    <Plus className="h-3 w-3" />
                    Target
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setVisibleCount((v) => v + 6)}
              className="rounded-lg border border-[#E5E7EB] px-5 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] active:scale-[0.98] transition-all"
            >
              Load More Companies
            </button>
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="mt-10 pt-5 border-t border-[#F3F4F6] flex items-center justify-between text-[11px] text-[#D1D5DB]">
        <span>© 2024 Mintkey Inc. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-[#9CA3AF] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#9CA3AF] transition-colors">Terms</a>
          <a href="#" className="hover:text-[#9CA3AF] transition-colors">Help</a>
        </div>
      </footer>
    </DashboardLayout>
  );
}

/* ── Filter Dropdown Component ───────────────────────────────────── */

function FilterDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-8 py-1.5 text-xs text-[#374151] outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] cursor-pointer hover:border-[#D1D5DB] transition-all"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#9CA3AF] pointer-events-none" />
    </div>
  );
}
