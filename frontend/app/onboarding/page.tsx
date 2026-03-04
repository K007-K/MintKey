// Onboarding wizard — 4-step flow: GitHub → LeetCode → Resume → Target Companies
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COMPANIES = [
  "Google", "Amazon", "Microsoft", "Flipkart", "Razorpay",
  "Zepto", "CRED", "PhonePe", "Groww", "Swiggy",
  "Blinkit", "Meesho", "TCS", "Infosys", "Wipro",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    githubUsername: "",
    leetcodeUsername: "",
    resumeFile: null as File | null,
    targetCompanies: [] as string[],
    monthsAvailable: 6,
    hoursPerDay: 4,
  });

  const toggleCompany = (company: string) => {
    setData((prev) => ({
      ...prev,
      targetCompanies: prev.targetCompanies.includes(company)
        ? prev.targetCompanies.filter((c) => c !== company)
        : [...prev.targetCompanies, company].slice(0, 5),
    }));
  };

  const handleFinish = () => {
    // TODO: Call API to save onboarding data and trigger analysis
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  s === step
                    ? "bg-accent-indigo text-white shadow-lg shadow-accent-indigo/30"
                    : s < step
                    ? "bg-score-high/20 text-score-high"
                    : "bg-bg-elevated/50 text-text-muted"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
            ))}
          </div>
          <div className="h-1.5 rounded-full bg-bg-elevated/50">
            <div
              className="h-1.5 rounded-full bg-gradient-to-r from-accent-indigo to-accent-violet transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="rounded-2xl border border-border/30 bg-bg-surface/80 p-8 backdrop-blur-lg">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Connect GitHub</h2>
                <p className="mt-1 text-sm text-text-muted">
                  We analyze your repos, code quality, and tech stack.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-muted">
                  GitHub Username
                </label>
                <input
                  type="text"
                  value={data.githubUsername}
                  onChange={(e) => setData({ ...data, githubUsername: e.target.value })}
                  placeholder="e.g. K007-K"
                  className="w-full rounded-xl border border-border/50 bg-bg-base px-4 py-3 text-text-primary placeholder:text-text-muted/50 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo"
                />
              </div>
              <p className="text-xs text-text-muted/70">
                💡 We only read public data. No write access needed.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Connect LeetCode</h2>
                <p className="mt-1 text-sm text-text-muted">
                  We analyze your problem-solving patterns and DSA readiness.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-muted">
                  LeetCode Username
                </label>
                <input
                  type="text"
                  value={data.leetcodeUsername}
                  onChange={(e) => setData({ ...data, leetcodeUsername: e.target.value })}
                  placeholder="e.g. karthik_codes"
                  className="w-full rounded-xl border border-border/50 bg-bg-base px-4 py-3 text-text-primary placeholder:text-text-muted/50 focus:border-accent-indigo focus:outline-none focus:ring-1 focus:ring-accent-indigo"
                />
              </div>
              <p className="text-xs text-text-muted/70">
                📊 We&apos;ll check your topic breakdown, solve count, and contest rating.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Upload Resume</h2>
                <p className="mt-1 text-sm text-text-muted">
                  AI extracts skills, CGPA, experience — checks eligibility per company.
                </p>
              </div>
              <div
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-bg-base/50 p-8 text-center transition-all hover:border-accent-indigo/50"
              >
                <div className="mb-3 text-4xl">📄</div>
                <p className="text-sm font-medium text-text-primary">
                  {data.resumeFile ? data.resumeFile.name : "Drop your resume here"}
                </p>
                <p className="mt-1 text-xs text-text-muted">PDF only, max 5MB</p>
                <input
                  type="file"
                  accept=".pdf"
                  className="mt-4 text-sm text-text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-indigo/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-accent-indigo hover:file:bg-accent-indigo/20"
                  onChange={(e) => setData({ ...data, resumeFile: e.target.files?.[0] || null })}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Target Companies</h2>
                <p className="mt-1 text-sm text-text-muted">
                  Select up to 5 companies you want to prepare for.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {COMPANIES.map((company) => {
                  const selected = data.targetCompanies.includes(company);
                  return (
                    <button
                      key={company}
                      onClick={() => toggleCompany(company)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        selected
                          ? "bg-accent-indigo/20 text-accent-indigo border border-accent-indigo/40"
                          : "bg-bg-base/50 text-text-muted border border-border/30 hover:border-accent-indigo/30 hover:text-text-primary"
                      }`}
                    >
                      {company}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">
                    Months Available
                  </label>
                  <select
                    value={data.monthsAvailable}
                    onChange={(e) => setData({ ...data, monthsAvailable: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border/50 bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent-indigo focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 9, 12].map((m) => (
                      <option key={m} value={m}>{m} months</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">
                    Hours / Day
                  </label>
                  <select
                    value={data.hoursPerDay}
                    onChange={(e) => setData({ ...data, hoursPerDay: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border/50 bg-bg-base px-3 py-2 text-sm text-text-primary focus:border-accent-indigo focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8].map((h) => (
                      <option key={h} value={h}>{h} hours</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary ${
                step === 1 ? "invisible" : ""
              }`}
            >
              ← Back
            </button>
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="rounded-xl bg-gradient-to-r from-accent-indigo to-accent-violet px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-accent-indigo/25"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={data.targetCompanies.length === 0}
                className="rounded-xl bg-gradient-to-r from-accent-indigo to-accent-violet px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Analysis ⚡
              </button>
            )}
          </div>
        </div>

        {/* Skip */}
        <p className="mt-4 text-center text-xs text-text-muted/50">
          <button onClick={() => router.push("/dashboard")} className="hover:text-text-muted transition-colors">
            Skip onboarding →
          </button>
        </p>
      </div>
    </div>
  );
}
