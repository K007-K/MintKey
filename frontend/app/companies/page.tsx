// Company explorer — browse companies, manage targets, filter and search
"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Search, Bell, ChevronDown, X, Plus } from "lucide-react";

/* ── Company Data ────────────────────────────────────────────────── */

interface Company {
  name: string;
  slug: string;
  category: string;
  logo: string;
  logoBg: string;
  logoText: string;
  salary: string;
  difficulty: "Hard" | "Medium" | "Easy";
  score: number;
}

const ALL_COMPANIES: Company[] = [
  { name: "Amazon", slug: "amazon", category: "E-commerce & Cloud", logo: "a", logoBg: "#232F3E", logoText: "#FF9900", salary: "$140k - $280k", difficulty: "Medium", score: 76 },
  { name: "Microsoft", slug: "microsoft", category: "Software & Cloud", logo: "⊞", logoBg: "#00A4EF", logoText: "#ffffff", salary: "$150k - $290k", difficulty: "Medium", score: 81 },
  { name: "Apple", slug: "apple", category: "Hardware & Software", logo: "", logoBg: "#333333", logoText: "#ffffff", salary: "$170k - $330k", difficulty: "Hard", score: 88 },
  { name: "Netflix", slug: "netflix", category: "Streaming & Media", logo: "N", logoBg: "#E50914", logoText: "#ffffff", salary: "$200k - $400k", difficulty: "Hard", score: 72 },
  { name: "Uber", slug: "uber", category: "Ridesharing & Delivery", logo: "U", logoBg: "#000000", logoText: "#ffffff", salary: "$140k - $260k", difficulty: "Medium", score: 69 },
  { name: "Salesforce", slug: "salesforce", category: "CRM & Cloud", logo: "sf", logoBg: "#00A1E0", logoText: "#ffffff", salary: "$130k - $240k", difficulty: "Easy", score: 84 },
  { name: "Twitter", slug: "twitter", category: "Social Media", logo: "𝕏", logoBg: "#1DA1F2", logoText: "#ffffff", salary: "$160k - $300k", difficulty: "Medium", score: 73 },
  { name: "LinkedIn", slug: "linkedin", category: "Professional Network", logo: "in", logoBg: "#0A66C2", logoText: "#ffffff", salary: "$150k - $280k", difficulty: "Medium", score: 79 },
  { name: "Shopify", slug: "shopify", category: "E-commerce Platform", logo: "S", logoBg: "#96BF48", logoText: "#ffffff", salary: "$120k - $220k", difficulty: "Easy", score: 91 },
  { name: "Slack", slug: "slack", category: "Collaboration Tools", logo: "#", logoBg: "#611F69", logoText: "#ffffff", salary: "$140k - $250k", difficulty: "Easy", score: 86 },
  { name: "Spotify", slug: "spotify", category: "Music Streaming", logo: "♫", logoBg: "#1DB954", logoText: "#ffffff", salary: "$130k - $240k", difficulty: "Medium", score: 75 },
];

const INITIAL_TARGETS: Company[] = [
  { name: "Google", slug: "google", category: "Search & Cloud", logo: "G", logoBg: "#4285F4", logoText: "#ffffff", salary: "$180k - $350k", difficulty: "Hard", score: 92 },
  { name: "Meta", slug: "meta", category: "Social & VR", logo: "∞", logoBg: "#0668E1", logoText: "#ffffff", salary: "$170k - $320k", difficulty: "Hard", score: 85 },
  { name: "Airbnb", slug: "airbnb", category: "Travel & Hospitality", logo: "A", logoBg: "#FF5A5F", logoText: "#ffffff", salary: "$150k - $280k", difficulty: "Medium", score: 78 },
  { name: "Stripe", slug: "stripe", category: "Fintech & Payments", logo: "S", logoBg: "#635BFF", logoText: "#ffffff", salary: "$160k - $300k", difficulty: "Medium", score: 64 },
];

/* ── Helpers ──────────────────────────────────────────────────────── */

function diffColor(d: string) {
  if (d === "Hard") return "#B91C1C";
  if (d === "Medium") return "#B45309";
  return "#047857";
}

function diffBg(d: string) {
  if (d === "Hard") return "#FEE2E2";
  if (d === "Medium") return "#FEF3C7";
  return "#D1FAE5";
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
      {/* ── Search bar row ── */}
      <div className="flex items-center justify-between mb-6">
        <div />
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-60 rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857]"
            />
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors">
            <Bell className="h-4 w-4" />
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
            <h2 className="text-lg font-bold text-[#111827]">Your Target Companies</h2>
            <button className="text-sm text-[#6B7280] hover:text-[#047857] transition-colors">Edit targets</button>
          </div>
          <p className="text-sm text-[#6B7280] mb-4">Companies you&apos;re actively preparing for</p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {targets.map((t) => (
              <div
                key={t.slug}
                className="relative rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all hover:shadow-md"
              >
                {/* Remove button */}
                <button
                  onClick={() => removeTarget(t.slug)}
                  className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Logo */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold mb-3"
                  style={{ backgroundColor: t.logoBg, color: t.logoText }}
                >
                  {t.logo}
                </div>

                {/* Name */}
                <h3 className="text-sm font-semibold text-[#111827] mb-1">{t.name}</h3>

                {/* Salary + difficulty */}
                <div className="flex items-center gap-1.5 text-xs mb-3">
                  <span className="text-[#6B7280]">{t.salary}</span>
                  <span className="text-[#D1D5DB]">·</span>
                  <span className="font-semibold" style={{ color: diffColor(t.difficulty) }}>{t.difficulty}</span>
                </div>

                {/* Match score */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#6B7280]">Match Score</span>
                  <span className="font-semibold text-[#111827]">{t.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#E5E7EB]">
                  <div
                    className="h-1.5 rounded-full transition-all bg-[#1F2937]"
                    style={{ width: `${t.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── All Companies ── */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-[#111827]">All Companies</h2>
          <span className="text-sm text-[#6B7280]">Showing <span className="font-bold text-[#111827]">{filteredCompanies.length}</span> companies</span>
        </div>
        <p className="text-sm text-[#6B7280] mb-5">Explore and add companies to your targets</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCompanies.map((c) => {
            const isTargeted = targets.some((t) => t.slug === c.slug);
            return (
              <div
                key={c.slug}
                className="rounded-xl border border-[#E5E7EB] bg-white p-5 transition-all hover:shadow-md"
              >
                {/* Header: logo + name/category */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold shrink-0"
                    style={{ backgroundColor: c.logoBg, color: c.logoText }}
                  >
                    {c.logo}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#111827]">{c.name}</h3>
                    <p className="text-xs text-[#6B7280]">{c.category}</p>
                  </div>
                </div>

                {/* Salary + difficulty */}
                <div className="flex items-center gap-1.5 text-xs mb-3">
                  <span className="text-[#6B7280]">{c.salary}</span>
                  <span className="text-[#D1D5DB]">·</span>
                  <span className="font-semibold" style={{ color: diffColor(c.difficulty) }}>{c.difficulty}</span>
                </div>

                {/* Match score */}
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[#6B7280]">Match Score</span>
                  <span className="font-semibold text-[#111827]">{c.score}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#E5E7EB] mb-4">
                  <div
                    className="h-1.5 rounded-full transition-all bg-[#1F2937]"
                    style={{ width: `${c.score}%` }}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 border-t border-[#E5E7EB] pt-3">
                  <Link
                    href={`/company/${c.slug}`}
                    className="flex-1 flex items-center justify-center rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => addTarget(c)}
                    disabled={isTargeted}
                    className={`flex-1 flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      isTargeted
                        ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-default border border-[#E5E7EB]"
                        : "bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] hover:bg-[#D1FAE5] active:scale-[0.98]"
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
              className="rounded-lg border border-[#E5E7EB] px-6 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors"
            >
              Load More Companies
            </button>
          </div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer className="mt-12 pt-6 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#9CA3AF]">
        <span>© 2024 Mintkey Inc. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-[#6B7280] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#6B7280] transition-colors">Terms</a>
          <a href="#" className="hover:text-[#6B7280] transition-colors">Help</a>
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
        className="appearance-none rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-8 py-2 text-sm text-[#374151] outline-none focus:border-[#047857] focus:ring-1 focus:ring-[#047857] cursor-pointer hover:bg-[#F9FAFB] transition-colors"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9CA3AF] pointer-events-none" />
    </div>
  );
}
