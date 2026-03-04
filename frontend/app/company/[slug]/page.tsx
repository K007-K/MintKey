// Company detail page — shows full blueprint, match breakdown, DSA requirements
"use client";

import { useParams } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{name} Blueprint</h1>
          <p className="mt-1 text-text-muted">Company-specific requirements and your match analysis.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Match Score", value: "52%", color: "text-score-mid" },
            { label: "DSA Required", value: "200+", color: "text-accent-indigo" },
            { label: "CGPA Cutoff", value: "7.0", color: "text-text-primary" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/30 bg-bg-surface/50 p-5 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="mt-1 text-sm text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border/30 bg-bg-surface/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {["Java", "Python", "System Design", "DP", "Trees", "Graphs", "REST API", "SQL"].map((s) => (
              <span key={s} className="rounded-lg bg-accent-indigo/10 px-3 py-1.5 text-sm text-accent-indigo">{s}</span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border/30 bg-bg-surface/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Interview Format</h2>
          <div className="space-y-3">
            {["Online Assessment", "Phone Screen", "Technical Round 1", "Technical Round 2", "System Design", "HR"].map((r, i) => (
              <div key={r} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-indigo/10 text-xs font-bold text-accent-indigo">{i + 1}</div>
                <span className="text-sm text-text-primary">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
