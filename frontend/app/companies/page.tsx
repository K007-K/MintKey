// Company explorer — browse all 15+ tracked companies
"use client";

import Link from "next/link";
import DashboardLayout from "@/components/ui/DashboardLayout";

const COMPANIES = [
  { name: "Google", slug: "google", pkg: "35 LPA", difficulty: "Very Hard", score: 42 },
  { name: "Amazon", slug: "amazon", pkg: "30 LPA", difficulty: "Hard", score: 55 },
  { name: "Microsoft", slug: "microsoft", pkg: "28 LPA", difficulty: "Hard", score: 50 },
  { name: "Flipkart", slug: "flipkart", pkg: "25 LPA", difficulty: "Hard", score: 48 },
  { name: "Razorpay", slug: "razorpay", pkg: "22 LPA", difficulty: "Medium", score: 61 },
  { name: "Zepto", slug: "zepto", pkg: "25 LPA", difficulty: "Medium", score: 58 },
  { name: "CRED", slug: "cred", pkg: "30 LPA", difficulty: "Hard", score: 45 },
  { name: "PhonePe", slug: "phonpe", pkg: "22 LPA", difficulty: "Hard", score: 52 },
  { name: "Groww", slug: "groww", pkg: "20 LPA", difficulty: "Medium", score: 60 },
  { name: "Swiggy", slug: "swiggy", pkg: "22 LPA", difficulty: "Hard", score: 47 },
  { name: "Blinkit", slug: "blinkit", pkg: "18 LPA", difficulty: "Medium", score: 55 },
  { name: "Meesho", slug: "meesho", pkg: "20 LPA", difficulty: "Medium", score: 57 },
  { name: "TCS", slug: "tcs", pkg: "7 LPA", difficulty: "Easy", score: 82 },
  { name: "Infosys", slug: "infosys", pkg: "6 LPA", difficulty: "Easy", score: 85 },
  { name: "Wipro", slug: "wipro", pkg: "5 LPA", difficulty: "Easy", score: 88 },
];

function difficultyColor(d: string) {
  if (d === "Very Hard") return "text-score-low";
  if (d === "Hard") return "text-score-mid";
  return "text-score-high";
}

export default function CompaniesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Company Explorer</h1>
          <p className="mt-1 text-text-muted">Browse companies and see your match scores.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANIES.map((c) => (
            <Link
              key={c.slug}
              href={`/company/${c.slug}`}
              className="group rounded-2xl border border-border/30 bg-bg-surface/50 p-5 transition-all hover:border-accent-indigo/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent-indigo/5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-text-primary">{c.name}</h3>
                <span className={`text-xs font-semibold ${difficultyColor(c.difficulty)}`}>{c.difficulty}</span>
              </div>
              <div className="text-sm text-text-muted mb-3">Avg: {c.pkg}</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-bg-elevated/50">
                  <div
                    className={`h-2 rounded-full ${c.score >= 80 ? "bg-score-high" : c.score >= 50 ? "bg-score-mid" : "bg-score-low"}`}
                    style={{ width: `${c.score}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-text-primary">{c.score}%</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
