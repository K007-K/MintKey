// Company explorer — clean light mode design
"use client";

import Link from "next/link";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Building2, ArrowUpRight } from "lucide-react";

const COMPANIES = [
  { name: "Google", slug: "google", pkg: "₹35 LPA", difficulty: "Very Hard", score: 42, color: "#4285F4", letter: "G" },
  { name: "Amazon", slug: "amazon", pkg: "₹30 LPA", difficulty: "Hard", score: 55, color: "#FF9900", letter: "A" },
  { name: "Microsoft", slug: "microsoft", pkg: "₹28 LPA", difficulty: "Hard", score: 50, color: "#00A4EF", letter: "M" },
  { name: "Flipkart", slug: "flipkart", pkg: "₹25 LPA", difficulty: "Hard", score: 48, color: "#F8D21D", letter: "F" },
  { name: "Razorpay", slug: "razorpay", pkg: "₹22 LPA", difficulty: "Medium", score: 61, color: "#0E6EB8", letter: "R" },
  { name: "Zepto", slug: "zepto", pkg: "₹25 LPA", difficulty: "Medium", score: 58, color: "#6C2EB9", letter: "Z" },
  { name: "CRED", slug: "cred", pkg: "₹30 LPA", difficulty: "Hard", score: 45, color: "#1A1A2E", letter: "C" },
  { name: "PhonePe", slug: "phonpe", pkg: "₹22 LPA", difficulty: "Hard", score: 52, color: "#5F259F", letter: "P" },
  { name: "Groww", slug: "groww", pkg: "₹20 LPA", difficulty: "Medium", score: 60, color: "#00D09C", letter: "G" },
  { name: "Swiggy", slug: "swiggy", pkg: "₹22 LPA", difficulty: "Hard", score: 47, color: "#FC8019", letter: "S" },
  { name: "Blinkit", slug: "blinkit", pkg: "₹18 LPA", difficulty: "Medium", score: 55, color: "#F9C80E", letter: "B" },
  { name: "Meesho", slug: "meesho", pkg: "₹20 LPA", difficulty: "Medium", score: 57, color: "#E01B84", letter: "M" },
  { name: "TCS", slug: "tcs", pkg: "₹7 LPA", difficulty: "Easy", score: 82, color: "#0072C6", letter: "T" },
  { name: "Infosys", slug: "infosys", pkg: "₹6 LPA", difficulty: "Easy", score: 85, color: "#007CC3", letter: "I" },
  { name: "Wipro", slug: "wipro", pkg: "₹5 LPA", difficulty: "Easy", score: 88, color: "#44227A", letter: "W" },
];

function diffBadge(d: string) {
  if (d === "Very Hard") return "bg-red-light text-red-dark";
  if (d === "Hard") return "bg-orange-light text-orange-dark";
  if (d === "Medium") return "bg-blue-light text-blue-dark";
  return "bg-green-light text-green-dark";
}

function scoreColor(s: number) {
  if (s >= 80) return "#22c55e";
  if (s >= 50) return "#f97316";
  return "#ef4444";
}

export default function CompaniesPage() {
  return (
    <DashboardLayout title="Companies" subtitle="Browse all tracked companies and your match scores.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMPANIES.map((c) => (
          <Link
            key={c.slug}
            href={`/company/${c.slug}`}
            className="group rounded-xl border border-border-default bg-bg-card p-5 transition-all hover:border-mint/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ backgroundColor: c.color }}>
                {c.letter}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-text-primary">{c.name}</h3>
                <span className="text-xs text-text-muted">{c.pkg}</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-text-placeholder group-hover:text-mint-dark transition-colors" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${diffBadge(c.difficulty)}`}>
                {c.difficulty}
              </span>
              <span className="text-sm font-bold" style={{ color: scoreColor(c.score) }}>{c.score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-hover">
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${c.score}%`, backgroundColor: scoreColor(c.score) }} />
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
