// Onboarding wizard — collect platform usernames + academic info, save to backend
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MintKeyLogoMark } from "@/components/ui/MintKeyLogo";
import {
  Github,
  Code2,
  Trophy,
  Flame,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
} from "lucide-react";

// ─── Platform Configuration ─────────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: "github",
    name: "GitHub",
    icon: Github,
    color: "bg-gray-900 text-white",
    activeColor: "border-gray-900 bg-gray-50",
    description: "Projects, repos, languages, and code quality",
    syncMode: "auto" as const,
    placeholder: "e.g. K007-K",
    profileUrl: (u: string) => `https://github.com/${u}`,
  },
  {
    id: "leetcode",
    name: "LeetCode",
    icon: Code2,
    color: "bg-amber-500 text-white",
    activeColor: "border-amber-500 bg-amber-50",
    description: "DSA problems, topic mastery, and contest rating",
    syncMode: "auto" as const,
    placeholder: "e.g. karthik_lc",
    profileUrl: (u: string) => `https://leetcode.com/u/${u}`,
  },
  {
    id: "hackerrank",
    name: "HackerRank",
    icon: Trophy,
    color: "bg-emerald-600 text-white",
    activeColor: "border-emerald-600 bg-emerald-50",
    description: "Certifications and skill badges",
    syncMode: "manual" as const,
    placeholder: "e.g. karthik_hr",
    profileUrl: (u: string) => `https://www.hackerrank.com/profile/${u}`,
  },
  {
    id: "codechef",
    name: "CodeChef",
    icon: Flame,
    color: "bg-orange-600 text-white",
    activeColor: "border-orange-600 bg-orange-50",
    description: "Rating, stars, and contest history",
    syncMode: "manual" as const,
    placeholder: "e.g. karthik_cc",
    profileUrl: (u: string) => `https://www.codechef.com/users/${u}`,
  },
];

const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Data Science",
  "Artificial Intelligence",
  "Other",
];

const COLLEGE_TIERS = [
  { value: 1, label: "Tier 1", desc: "IIT, NIT, BITS, IIIT" },
  { value: 2, label: "Tier 2", desc: "Good private universities" },
  { value: 3, label: "Tier 3", desc: "State universities, other" },
];

// ─── Component ──────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ─── Persisted state (survives page refresh) ───────────────────────────────
  const STORAGE_KEY = "mintkey_onboarding";

  const getStored = () => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const stored = getStored();

  const [step, setStep] = useState<number>(stored?.step || 1);

  const [platforms, setPlatforms] = useState({
    github: stored?.platforms?.github || "",
    leetcode: stored?.platforms?.leetcode || "",
    hackerrank: stored?.platforms?.hackerrank || "",
    codechef: stored?.platforms?.codechef || "",
  });

  const [academic, setAcademic] = useState({
    cgpa: stored?.academic?.cgpa || "",
    branch: stored?.academic?.branch || "",
    college_tier: stored?.academic?.college_tier || "",
    graduation_year: stored?.academic?.graduation_year || "",
    internship_count: stored?.academic?.internship_count || "0",
  });

  // Pre-fill GitHub from OAuth session (only if not already stored)
  useEffect(() => {
    if (session?.user?.githubUsername && !platforms.github) {
      setPlatforms((prev) => ({ ...prev, github: session.user.githubUsername || "" }));
    }
  }, [session?.user?.githubUsername]);

  // Persist to localStorage on every change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, platforms, academic }));
    }
  }, [step, platforms, academic]);

  // Clear persisted data (called on submit/skip)
  const clearStored = () => {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  };

  const handlePlatformChange = (id: string, value: string) => {
    setPlatforms((prev) => ({ ...prev, [id]: value }));
  };

  const filledPlatforms = Object.values(platforms).filter((v) => v.trim() !== "").length;

  const handleSkip = async () => {
    // Mark as onboarded even when skipping so user isn't stuck
    try {
      const token = session?.backendToken;
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_onboarded: true }),
        });
      }
    } catch (_) {
      // Silently fail — user can update later
    }
    // Hard redirect to force session refresh
    clearStored();
    window.location.href = "/dashboard";
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const token = session?.backendToken || (typeof window !== 'undefined' ? localStorage.getItem("mintkey_token") : null);
      if (!token) {
        // Try a hard redirect to dashboard — maybe session will work on next load
        window.location.href = "/dashboard";
        return;
      }

      const body: Record<string, unknown> = {
        is_onboarded: true,
      };

      // Platform usernames
      if (platforms.github) body.github_username = platforms.github;
      if (platforms.leetcode) body.leetcode_username = platforms.leetcode;
      if (platforms.hackerrank) body.hackerrank_username = platforms.hackerrank;
      if (platforms.codechef) body.codechef_username = platforms.codechef;

      // Academic info
      if (academic.cgpa) body.cgpa = parseFloat(academic.cgpa);
      if (academic.branch) body.branch = academic.branch;
      if (academic.college_tier) body.college_tier = parseInt(academic.college_tier);
      if (academic.graduation_year) body.graduation_year = parseInt(academic.graduation_year);
      if (academic.internship_count) body.internship_count = parseInt(academic.internship_count);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to save profile");
      }

      // Hard redirect — forces NextAuth session refresh so authorized callback
      // sees the updated is_onboarded=true instead of stale JWT value
      clearStored();
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 text-center">
          <MintKeyLogoMark className="justify-center mb-4" />
        </div>

        {/* Step indicators */}
        <div className="mb-8 flex items-center justify-center gap-3">
          {[
            { label: "Platforms", num: 1 },
            { label: "Academic", num: 2 },
          ].map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <div
                className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-all ${
                  s.num === step
                    ? "bg-mint-dark text-white shadow-md"
                    : s.num < step
                    ? "bg-green-light text-green-dark"
                    : "bg-bg-hover text-text-muted"
                }`}
              >
                {s.num < step ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="w-4 text-center">{s.num}</span>
                )}
                <span>{s.label}</span>
              </div>
              {i < 1 && (
                <div
                  className={`h-px w-10 ${
                    s.num < step ? "bg-green" : "bg-border-default"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border-default bg-bg-card p-6">
          {/* ─── Step 1: Connect Platforms ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  Connect your coding platforms
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Link your accounts for skill analysis. GitHub or LeetCode recommended.
                </p>
              </div>

              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const value = platforms[platform.id as keyof typeof platforms];
                const hasValue = value.trim() !== "";

                return (
                  <div
                    key={platform.id}
                    className={`rounded-xl border-2 p-4 transition-all duration-200 ${
                      hasValue ? platform.activeColor : "border-border-default bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${platform.color}`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-text-primary text-sm">
                            {platform.name}
                          </h3>
                          {platform.syncMode === "auto" ? (
                            <span className="rounded-full bg-green-light px-2 py-0.5 text-[10px] font-semibold text-green-dark">
                              Auto-Sync
                            </span>
                          ) : (
                            <span className="rounded-full bg-bg-hover px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                              Profile Link
                            </span>
                          )}
                          {hasValue && (
                            <Check className="ml-auto h-4 w-4 text-green" />
                          )}
                        </div>
                        <p className="text-xs text-text-muted mb-2">
                          {platform.description}
                        </p>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              handlePlatformChange(platform.id, e.target.value)
                            }
                            placeholder={platform.placeholder}
                            className="flex-1 rounded-lg border border-border-default px-3 py-2 text-sm text-text-primary placeholder:text-text-placeholder focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                          />
                          {hasValue && (
                            <a
                              href={platform.profileUrl(value)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-default text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
                              title={`View ${platform.name} profile`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleSkip}
                  className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors underline underline-offset-2"
                >
                  Skip for now →
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 rounded-lg bg-mint-dark px-5 py-2 text-sm font-semibold text-white hover:bg-mint-darker transition-colors"
                >
                  Continue <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Academic Info ─────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-mint-dark" />
                  Academic background
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Helps calculate eligibility for companies with academic cutoffs.
                </p>
              </div>

              {/* CGPA */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Current CGPA{" "}
                  <span className="text-text-placeholder">(out of 10)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={academic.cgpa}
                  onChange={(e) =>
                    setAcademic({ ...academic, cgpa: e.target.value })
                  }
                  placeholder="8.5"
                  className="w-full rounded-lg border border-border-default px-3 py-2.5 text-sm text-text-primary placeholder:text-text-placeholder focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                />
              </div>

              {/* Branch */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-muted">
                  Branch / Department
                </label>
                <select
                  value={academic.branch}
                  onChange={(e) =>
                    setAcademic({ ...academic, branch: e.target.value })
                  }
                  className="w-full rounded-lg border border-border-default px-3 py-2.5 text-sm text-text-primary focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                >
                  <option value="">Select branch</option>
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* College Tier */}
              <div>
                <label className="mb-2 block text-xs font-medium text-text-muted">
                  College Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COLLEGE_TIERS.map((tier) => (
                    <button
                      key={tier.value}
                      onClick={() =>
                        setAcademic({
                          ...academic,
                          college_tier: String(tier.value),
                        })
                      }
                      className={`rounded-lg border-2 p-2.5 text-center transition-all duration-200 ${
                        academic.college_tier === String(tier.value)
                          ? "border-mint bg-mint-bg"
                          : "border-border-default hover:border-border-hover"
                      }`}
                    >
                      <div className="text-sm font-semibold text-text-primary">
                        {tier.label}
                      </div>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        {tier.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Graduation Year + Internships */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Graduation Year
                  </label>
                  <select
                    value={academic.graduation_year}
                    onChange={(e) =>
                      setAcademic({
                        ...academic,
                        graduation_year: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-border-default px-3 py-2.5 text-sm text-text-primary focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                  >
                    <option value="">Select year</option>
                    {[2025, 2026, 2027, 2028, 2029].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-text-muted">
                    Internships Done
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={academic.internship_count}
                    onChange={(e) =>
                      setAcademic({
                        ...academic,
                        internship_count: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-border-default px-3 py-2.5 text-sm text-text-primary focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSkip}
                    className="text-xs font-medium text-text-muted hover:text-text-primary transition-colors underline underline-offset-2"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-lg bg-mint-dark px-6 py-2 text-sm font-semibold text-white hover:bg-mint-darker disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Start Analyzing
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-center text-[10px] text-text-placeholder mt-3">
                You can update everything from Settings later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
