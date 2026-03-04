// Company explorer — browse companies, manage targets, filter and search
"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Search, Maximize2, ChevronDown, X, Plus } from "lucide-react";

/* ── Company Data ────────────────────────────────────────────────── */

interface Company {
  name: string;
  slug: string;
  category: string;
  logo: string;
  logoColor: string;
  salary: string;
  difficulty: "Hard" | "Medium" | "Easy";
  score: number;
}

const ALL_COMPANIES: Company[] = [
  { name: "Amazon", slug: "amazon", category: "E-commerce & Cloud", logo: "a", logoColor: "#232F3E", salary: "$140k - $280k", difficulty: "Medium", score: 76 },
  { name: "Microsoft", slug: "microsoft", category: "Software & Cloud", logo: "⊞", logoColor: "#00A4EF", salary: "$150k - $290k", difficulty: "Medium", score: 81 },
  { name: "Apple", slug: "apple", category: "Hardware & Software", logo: "", logoColor: "#555555", salary: "$170k - $330k", difficulty: "Hard", score: 88 },
  { name: "Netflix", slug: "netflix", category: "Streaming & Media", logo: "N", logoColor: "#E50914", salary: "$200k - $400k", difficulty: "Hard", score: 72 },
  { name: "Uber", slug: "uber", category: "Ridesharing & Delivery", logo: "U", logoColor: "#000000", salary: "$140k - $260k", difficulty: "Medium", score: 69 },
  { name: "Salesforce", slug: "salesforce", category: "CRM & Cloud", logo: "sf", logoColor: "#00A1E0", salary: "$130k - $240k", difficulty: "Easy", score: 84 },
  { name: "Twitter", slug: "twitter", category: "Social Media", logo: "𝕏", logoColor: "#1DA1F2", salary: "$160k - $300k", difficulty: "Medium", score: 73 },
  { name: "LinkedIn", slug: "linkedin", category: "Professional Network", logo: "in", logoColor: "#0A66C2", salary: "$150k - $280k", difficulty: "Medium", score: 79 },
  { name: "Shopify", slug: "shopify", category: "E-commerce Platform", logo: "S", logoColor: "#96BF48", salary: "$120k - $220k", difficulty: "Easy", score: 91 },
  { name: "Slack", slug: "slack", category: "Collaboration Tools", logo: "#", logoColor: "#611F69", salary: "$140k - $250k", difficulty: "Easy", score: 86 },
  { name: "Spotify", slug: "spotify", category: "Music Streaming", logo: "♫", logoColor: "#1DB954", salary: "$130k - $240k", difficulty: "Medium", score: 75 },
];

const INITIAL_TARGETS: Company[] = [
  { name: "Google", slug: "google", category: "Search & Cloud", logo: "G", logoColor: "#4285F4", salary: "$180k - $350k", difficulty: "Hard", score: 92 },
  { name: "Meta", slug: "meta", category: "Social & VR", logo: "∞", logoColor: "#0668E1", salary: "$170k - $320k", difficulty: "Hard", score: 85 },
  { name: "Airbnb", slug: "airbnb", category: "Travel & Hospitality", logo: "A", logoColor: "#FF5A5F", salary: "$150k - $280k", difficulty: "Medium", score: 78 },
  { name: "Stripe", slug: "stripe", category: "Fintech & Payments", logo: "S", logoColor: "#635BFF", salary: "$160k - $300k", difficulty: "Medium", score: 64 },
];

/* ── Helpers ──────────────────────────────────────────────────────── */

function diffBadgeClasses(d: string) {
  if (d === "Hard") return "text-red-dark";
  if (d === "Medium") return "text-orange-dark";
  return "text-green-dark";
}

function scoreBarColor(s: number) {
  if (s >= 80) return "#14b8a6";
  if (s >= 60) return "#14b8a6";
  return "#f97316";
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [targets, setTargets] = useState<Company[]>(INITIAL_TARGETS);
  const [visibleCount, setVisibleCount] = useState(9);
  const [companyTypeFilter, setCompanyTypeFilter] = useState("All Company Types");
  const [dsaFilter, setDsaFilter] = useState("All DSA Levels");
  const [packageFilter, setPackageFilter] = useState("All Package Ranges");

  const removeTarget = (slug: string) => {
    setTargets((prev) => prev.filter((t) => t.slug !== slug));
  };

  const addTarget = (company: Company) => {
    if (!targets.find((t) => t.slug === company.slug)) {
      setTargets((prev) => [...prev, company]);
    }
  };

  /* Filter + search */
  const filteredCompanies = ALL_COMPANIES.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (dsaFilter === "Hard" && c.difficulty !== "Hard") return false;
    if (dsaFilter === "Medium" && c.difficulty !== "Medium") return false;
    if (dsaFilter === "Easy" && c.difficulty !== "Easy") return false;
    return true;
  });

  const visibleCompanies = filteredCompanies.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCompanies.length;

  return (
    <DashboardLayout title="Company Explorer" subtitle="Browse companies and see how ready you are">
      {/* ── Search bar (right-aligned, top) ── */}
      <div className="flex items-center justify-between mb-6">
        <div /> {/* spacer for left alignment */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 rounded-lg border border-border-default bg-bg-card pl-9 pr-3 text-sm text-text-primary placeholder:text-text-placeholder outline-none focus:border-mint-dark focus:ring-1 focus:ring-mint-dark"
            />
          </div>
          <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-8">
        <FilterDropdown value={companyTypeFilter} onChange={setCompanyTypeFilter} options={["All Company Types"]} />
        <FilterDropdown value={dsaFilter} onChange={setDsaFilter} options={["All DSA Levels", "Hard", "Medium", "Easy"]} />
        <FilterDropdown value={packageFilter} onChange={setPackageFilter} options={["All Package Ranges"]} />
      </div>

      {/* ── Your Target Companies ── */}
      {targets.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-text-primary">Your Target Companies</h2>
            <button className="text-sm text-text-muted hover:text-mint-dark transition-colors">Edit targets</button>
          </div>
          <p className="text-sm text-text-muted mb-4">Companies you&apos;re actively preparing for</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {targets.map((t) => (
              <div
                key={t.slug}
                className="relative rounded-xl border border-border-default bg-bg-card p-5 transition-all hover:shadow-md"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeTarget(t.slug)}
                  className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full text-text-placeholder hover:text-text-secondary hover:bg-bg-hover transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Logo */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white mb-3"
                  style={{ backgroundColor: t.logoColor }}
                >
                  {t.logo}
                </div>

                {/* Name */}
                <h3 className="text-sm font-semibold text-text-primary mb-1">{t.name}</h3>

                {/* Salary + difficulty */}
                <div className="flex items-center gap-1.5 text-xs mb-3">
                  <span className="text-text-secondary">{t.salary}</span>
                  <span className="text-text-placeholder">·</span>
                  <span className={`font-semibold ${diffBadgeClasses(t.difficulty)}`}>{t.difficulty}</span>
                </div>

                {/* Match score */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-muted">Match Score</span>
                  <span className="font-semibold text-text-primary">{t.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-hover">
                  <div
                    className="h-1.5 rounded-full transition-all"
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">All Companies</h2>
          <span className="text-sm text-text-muted">Showing {filteredCompanies.length} companies</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCompanies.map((c) => {
            const isTargeted = targets.some((t) => t.slug === c.slug);
            return (
              <div
                key={c.slug}
                className="rounded-xl border border-border-default bg-bg-card p-5 transition-all hover:shadow-md"
              >
                {/* Header: logo + name/category */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: c.logoColor }}
                  >
                    {c.logo}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{c.name}</h3>
                    <p className="text-xs text-text-muted">{c.category}</p>
                  </div>
                </div>

                {/* Salary + difficulty */}
                <div className="flex items-center gap-1.5 text-xs mb-3">
                  <span className="text-text-secondary">{c.salary}</span>
                  <span className="text-text-placeholder">·</span>
                  <span className={`font-semibold ${diffBadgeClasses(c.difficulty)}`}>{c.difficulty}</span>
                </div>

                {/* Match score */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-text-muted">Match Score</span>
                  <span className="font-semibold text-text-primary">{c.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-hover mb-4">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${c.score}%`, backgroundColor: scoreBarColor(c.score) }}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 border-t border-border-light pt-3">
                  <Link
                    href={`/company/${c.slug}`}
                    className="flex-1 flex items-center justify-center rounded-lg border border-border-default px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => addTarget(c)}
                    disabled={isTargeted}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      isTargeted
                        ? "bg-bg-hover text-text-muted cursor-default"
                        : "bg-mint-dark text-white hover:bg-mint-darker active:scale-[0.98]"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Target
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount((v) => v + 6)}
              className="rounded-lg border border-border-default px-6 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors"
            >
              Load More Companies
            </button>
          </div>
        )}
      </section>
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
        className="appearance-none rounded-lg border border-border-default bg-bg-card pl-3 pr-8 py-2 text-sm text-text-secondary outline-none focus:border-mint-dark focus:ring-1 focus:ring-mint-dark cursor-pointer hover:bg-bg-hover transition-colors"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
    </div>
  );
}
