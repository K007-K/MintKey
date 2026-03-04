// AI Coach page — clean light mode
"use client";

import DashboardLayout from "@/components/ui/DashboardLayout";
import { Sparkles, Send } from "lucide-react";

export default function CoachPage() {
  return (
    <DashboardLayout title="AI Career Coach" subtitle="Get personalized coaching and daily action plans.">
      <div className="max-w-3xl space-y-6">
        {/* Coach message */}
        <div className="rounded-xl border border-mint/30 bg-mint-bg p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint-dark text-white shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-text-primary">Mintkey Coach</h3>
                <span className="rounded-full bg-mint-light px-2 py-0.5 text-[10px] font-semibold text-mint-darker">AI</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Good morning, Karthik! Your React skills are strong at 85%, but you&apos;re missing key DSA topics.
                Dynamic Programming is at just 30% — focus on solving 5 medium DP problems today.
                That alone could boost your Google readiness by 8%.
              </p>
              <div className="mt-4 rounded-lg bg-bg-card border border-border-default p-4">
                <h4 className="text-xs font-semibold text-text-primary mb-2">Today&apos;s Actions:</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-mint-dark" /> Solve &quot;Coin Change&quot; (Medium DP)</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-mint-dark" /> Solve &quot;Longest Increasing Subsequence&quot;</li>
                  <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-mint-dark" /> Review your GitHub PR on mintkey-core</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Chat input */}
        <div className="rounded-xl border border-border-default bg-bg-card p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask your coach anything..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none"
            />
            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-mint-dark text-white hover:bg-mint-darker transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
