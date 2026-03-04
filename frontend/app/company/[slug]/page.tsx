// Company detail page — clean light mode
"use client";

import { useParams } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { Target, BookOpen, Users, Clock, ChevronRight } from "lucide-react";

export default function CompanyDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <DashboardLayout title={`${name} Blueprint`} subtitle="Company-specific requirements and your match.">
      <div className="max-w-4xl space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { Icon: Target, label: "Match Score", value: "52%", badgeColor: "bg-orange-light text-orange-dark" },
            { Icon: BookOpen, label: "DSA Required", value: "200+", badgeColor: "bg-blue-light text-blue-dark" },
            { Icon: Users, label: "CGPA Cutoff", value: "7.0", badgeColor: "bg-mint-bg text-mint-darker" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border-default bg-bg-card p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-hover">
                <s.Icon className="h-5 w-5 text-text-muted" strokeWidth={1.8} />
              </div>
              <div className="text-2xl font-bold text-text-primary">{s.value}</div>
              <div className="text-xs text-text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {["Java", "Python", "System Design", "DP", "Trees", "Graphs", "REST API", "SQL"].map((s) => (
              <span key={s} className="rounded-lg bg-mint-bg px-3 py-1.5 text-sm font-medium text-mint-darker">{s}</span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Interview Format</h2>
          <div className="space-y-3">
            {["Online Assessment", "Phone Screen", "Technical 1", "Technical 2", "System Design", "HR"].map((r, i) => (
              <div key={r} className="flex items-center gap-3 rounded-lg border border-border-light p-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-mint-bg text-xs font-bold text-mint-darker">{i + 1}</div>
                <span className="flex-1 text-sm text-text-primary">{r}</span>
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock className="h-3 w-3" /> ~45 min
                </div>
                <ChevronRight className="h-4 w-4 text-text-placeholder" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
