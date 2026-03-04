// Onboarding wizard — 4-step flow, clean light mode
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MintKeyLogoMark } from "@/components/ui/MintKeyLogo";
import { Github, Code2, FileText, Building2, ArrowRight, Check, Upload } from "lucide-react";

const COMPANIES = [
  "Google", "Amazon", "Microsoft", "Flipkart", "Razorpay",
  "Zepto", "CRED", "PhonePe", "Groww", "Swiggy",
  "Blinkit", "Meesho", "TCS", "Infosys", "Wipro",
];

const STEPS = [
  { label: "GitHub", Icon: Github },
  { label: "LeetCode", Icon: Code2 },
  { label: "Resume", Icon: FileText },
  { label: "Companies", Icon: Building2 },
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

  const toggleCompany = (c: string) => {
    setData((prev) => ({
      ...prev,
      targetCompanies: prev.targetCompanies.includes(c)
        ? prev.targetCompanies.filter((x) => x !== c)
        : [...prev.targetCompanies, c].slice(0, 5),
    }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <MintKeyLogoMark className="justify-center mb-4" />
        </div>

        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                i + 1 === step ? "bg-mint-dark text-white shadow-md" : i + 1 < step ? "bg-green-light text-green-dark" : "bg-bg-hover text-text-muted"
              }`}>
                {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < 3 && <div className={`h-px w-8 ${i + 1 < step ? "bg-green" : "bg-border-default"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Connect GitHub</h2>
                <p className="mt-1 text-sm text-text-muted">We analyze your repos, code quality, and tech stack.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">GitHub Username</label>
                <input
                  value={data.githubUsername}
                  onChange={(e) => setData({ ...data, githubUsername: e.target.value })}
                  placeholder="e.g. K007-K"
                  className="w-full rounded-lg border border-border-default px-4 py-2.5 text-sm text-text-primary placeholder:text-text-placeholder focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>
              <p className="text-xs text-text-muted">🔒 We only read public data. No write access.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Connect LeetCode</h2>
                <p className="mt-1 text-sm text-text-muted">We analyze your DSA patterns and readiness.</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">LeetCode Username</label>
                <input
                  value={data.leetcodeUsername}
                  onChange={(e) => setData({ ...data, leetcodeUsername: e.target.value })}
                  placeholder="e.g. karthik_codes"
                  className="w-full rounded-lg border border-border-default px-4 py-2.5 text-sm text-text-primary placeholder:text-text-placeholder focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Upload Resume</h2>
                <p className="mt-1 text-sm text-text-muted">AI extracts skills, CGPA, and experience.</p>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-default bg-bg-page p-8">
                <Upload className="h-8 w-8 text-text-placeholder mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-text-primary">
                  {data.resumeFile ? data.resumeFile.name : "Drop your resume here"}
                </p>
                <p className="mt-1 text-xs text-text-muted">PDF only, max 5MB</p>
                <input
                  type="file" accept=".pdf"
                  className="mt-3 text-xs text-text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-mint-bg file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-mint-darker"
                  onChange={(e) => setData({ ...data, resumeFile: e.target.files?.[0] || null })}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Target Companies</h2>
                <p className="mt-1 text-sm text-text-muted">Select up to 5 companies to prepare for.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {COMPANIES.map((c) => {
                  const sel = data.targetCompanies.includes(c);
                  return (
                    <button key={c} onClick={() => toggleCompany(c)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                        sel ? "bg-mint-bg text-mint-darker border border-mint/40" : "bg-bg-page text-text-secondary border border-border-default hover:border-mint/30"
                      }`}
                    >{c}</button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">Months</label>
                  <select value={data.monthsAvailable} onChange={(e) => setData({ ...data, monthsAvailable: +e.target.value })}
                    className="w-full rounded-lg border border-border-default px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-mint">
                    {[1, 2, 3, 4, 5, 6, 9, 12].map((m) => <option key={m} value={m}>{m} months</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">Hours/Day</label>
                  <select value={data.hoursPerDay} onChange={(e) => setData({ ...data, hoursPerDay: +e.target.value })}
                    className="w-full rounded-lg border border-border-default px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-mint">
                    {[1, 2, 3, 4, 5, 6, 8].map((h) => <option key={h} value={h}>{h} hours</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <button onClick={() => setStep(Math.max(1, step - 1))}
              className={`text-sm font-medium text-text-muted hover:text-text-primary transition-colors ${step === 1 ? "invisible" : ""}`}>
              ← Back
            </button>
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 rounded-lg bg-mint-dark px-5 py-2 text-sm font-semibold text-white hover:bg-mint-darker transition-colors">
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button onClick={() => router.push("/dashboard")}
                disabled={data.targetCompanies.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-mint-dark px-5 py-2 text-sm font-semibold text-white hover:bg-mint-darker disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Start Analysis <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
