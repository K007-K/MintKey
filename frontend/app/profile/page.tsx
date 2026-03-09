// Profile & Integrations page — wired to real API data
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { useCurrentUser, useUpdateProfile } from "@/lib/api";
import { useSession } from "next-auth/react";
import {
  Github, Code2, Upload, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, FileText, Camera, Loader2,
} from "lucide-react";

/* ─── Types ─── */
interface PlatformCard {
  key: "github" | "leetcode" | "hackerrank" | "codechef";
  name: string;
  icon: React.ReactNode;
  usernameField: string;
}

const PLATFORMS: PlatformCard[] = [
  { key: "github", name: "GitHub", icon: <Github className="h-5 w-5 text-gray-700" strokeWidth={1.8} />, usernameField: "github_username" },
  { key: "leetcode", name: "LeetCode", icon: <Code2 className="h-5 w-5 text-teal-600" strokeWidth={1.8} />, usernameField: "leetcode_username" },
  { key: "hackerrank", name: "HackerRank", icon: <Code2 className="h-5 w-5 text-green-600" strokeWidth={1.8} />, usernameField: "hackerrank_username" },
  { key: "codechef", name: "CodeChef", icon: <Code2 className="h-5 w-5 text-amber-700" strokeWidth={1.8} />, usernameField: "codechef_username" },
];

/** Extract just the username from a URL or raw value */
function extractUsername(value: string | null): string | null {
  if (!value) return null;
  // Strip trailing slashes, then grab last path segment
  const cleaned = value.replace(/\/+$/, "");
  if (cleaned.includes("/")) {
    return cleaned.split("/").pop() || cleaned;
  }
  return cleaned;
}

/* ─── Main Page ─── */
export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: userData, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const user = userData as Record<string, unknown> | undefined;

  // Profile card state
  const [name, setName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Platform input state
  const [platformInputs, setPlatformInputs] = useState<Record<string, string>>({});
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  // Academic state
  const [academicOpen, setAcademicOpen] = useState(false);
  const [academic, setAcademic] = useState({
    college_tier: "",
    branch: "",
    cgpa: "",
    graduation_year: "",
    internship_count: "",
  });
  const [academicSaving, setAcademicSaving] = useState(false);

  // Resume state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Hydrate from API data
  useEffect(() => {
    if (user) {
      setName((user.name as string) || "");
      setAcademic({
        college_tier: user.college_tier != null ? String(user.college_tier) : "",
        branch: (user.branch as string) || "",
        cgpa: user.cgpa != null ? String(user.cgpa) : "",
        graduation_year: user.graduation_year != null ? String(user.graduation_year) : "",
        internship_count: user.internship_count != null ? String(user.internship_count) : "",
      });
    }
  }, [user]);

  // Save profile name
  const saveProfile = useCallback(async () => {
    setProfileSaving(true);
    try {
      await updateProfile.mutateAsync({ name });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch { /* toast error */ }
    setProfileSaving(false);
  }, [name, updateProfile]);

  // Connect a platform
  const connectPlatform = useCallback(async (platform: PlatformCard) => {
    const value = platformInputs[platform.key]?.trim();
    if (!value) return;
    setConnectingPlatform(platform.key);
    try {
      await updateProfile.mutateAsync({ [platform.usernameField]: value });
      setPlatformInputs((prev) => ({ ...prev, [platform.key]: "" }));
    } catch { /* toast error */ }
    setConnectingPlatform(null);
  }, [platformInputs, updateProfile]);

  // Disconnect a platform
  const disconnectPlatform = useCallback(async (platform: PlatformCard) => {
    if (platform.key === "github") return;
    setConnectingPlatform(platform.key);
    try {
      await updateProfile.mutateAsync({ [platform.usernameField]: null });
    } catch { /* toast error */ }
    setConnectingPlatform(null);
  }, [updateProfile]);

  // Save academic info
  const saveAcademic = useCallback(async () => {
    setAcademicSaving(true);
    try {
      await updateProfile.mutateAsync({
        college_tier: academic.college_tier ? parseInt(academic.college_tier) : null,
        branch: academic.branch || null,
        cgpa: academic.cgpa ? parseFloat(academic.cgpa) : null,
        graduation_year: academic.graduation_year ? parseInt(academic.graduation_year) : null,
        internship_count: academic.internship_count ? parseInt(academic.internship_count) : null,
      });
    } catch { /* toast error */ }
    setAcademicSaving(false);
  }, [academic, updateProfile]);

  // Get platform username from user data
  const getPlatformUsername = (platform: PlatformCard): string | null => {
    if (!user) return null;
    return extractUsername((user[platform.usernameField] as string) || null);
  };

  const email = (user?.email as string) || session?.user?.email || "";
  const avatar = (user?.avatar_url as string) || session?.user?.image || "";
  const githubUsername = (user?.github_username as string) || session?.user?.githubUsername || "";
  const resumeUrl = (user?.resume_url as string) || null;
  const resumeParsed = user?.resume_parsed_data != null;

  return (
    <DashboardLayout
      title="Profile & Integrations"
      subtitle="Manage your profile, connected platforms, and resume."
    >
      <div className="max-w-3xl space-y-5">

        {/* ─── Section 1: Profile Card ─── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
          {isLoading ? (
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 animate-pulse rounded-full bg-gray-100" />
              <div className="flex-1 space-y-3"><div className="h-4 w-48 animate-pulse rounded bg-gray-100" /><div className="h-3 w-32 animate-pulse rounded bg-gray-100" /></div>
            </div>
          ) : (
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-gray-100 shadow-sm">
                  {avatar ? (
                    <img src={avatar} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xl font-bold text-gray-400">{name?.[0]?.toUpperCase() || "?"}</div>
                  )}
                </div>
                <button className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
                  <Camera className="h-3.5 w-3.5 text-gray-500" />
                </button>
              </div>

              {/* Fields */}
              <div className="flex-1 min-w-0 space-y-3.5">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-gray-600">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-gray-600">Email</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-lg border border-gray-100 bg-[#f9fafb] px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-gray-600">GitHub Username</label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={githubUsername ? `@${githubUsername}` : ""}
                      readOnly
                      className="flex-1 rounded-lg border border-gray-100 bg-[#f9fafb] px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                    />
                    {githubUsername && (
                      <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600">
                        <CheckCircle2 className="h-3 w-3" /> Connected via OAuth
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="mt-1 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  {profileSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : profileSaved ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</> : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Section 2: Connected Platforms ─── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-base font-bold text-gray-900">Connected Platforms</h2>
          <p className="mb-4 text-sm text-gray-400">Link your coding profiles to unlock real-time analysis</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {PLATFORMS.map((platform) => {
              const username = getPlatformUsername(platform);
              const isConnected = !!username;
              const isGithub = platform.key === "github";
              const isConnecting = connectingPlatform === platform.key;

              return (
                <div
                  key={platform.key}
                  className={`flex flex-col rounded-xl p-4 transition-all ${
                    isConnected
                      ? "border-2 border-teal-200 bg-white"
                      : "border border-dashed border-gray-200 bg-white"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-50">
                        {platform.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{platform.name}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {isConnected ? `@${username}` : "Not connected"}
                        </div>
                      </div>
                    </div>
                    {isConnected && (
                      <span className="ml-2 flex-shrink-0 flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Connected
                      </span>
                    )}
                  </div>

                  {/* Action area */}
                  {isConnected ? (
                    <div className="mt-2.5">
                      {!isGithub && (
                        <button
                          onClick={() => disconnectPlatform(platform)}
                          disabled={isConnecting}
                          className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {isConnecting ? "Disconnecting..." : "Disconnect"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <input
                        type="text"
                        value={platformInputs[platform.key] || ""}
                        onChange={(e) =>
                          setPlatformInputs((prev) => ({ ...prev, [platform.key]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && connectPlatform(platform)}
                        placeholder="Enter username"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition-colors"
                      />
                      <button
                        onClick={() => connectPlatform(platform)}
                        disabled={!platformInputs[platform.key]?.trim() || isConnecting}
                        className="w-full rounded-lg bg-teal-600 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
                      >
                        {isConnecting ? "Connecting..." : "Connect"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Section 3: Academic Background (Collapsible) ─── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white">
          <button
            onClick={() => setAcademicOpen(!academicOpen)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <div>
              <h2 className="text-base font-bold text-gray-900">Academic Background</h2>
              <p className="text-sm text-gray-400">Optional information to improve recommendations</p>
            </div>
            {academicOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </button>

          {academicOpen && (
            <div className="border-t border-gray-100 px-6 pb-5 pt-4">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-gray-600">College Tier</label>
                  <select
                    value={academic.college_tier}
                    onChange={(e) => setAcademic({ ...academic, college_tier: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30"
                  >
                    <option value="">Select tier</option>
                    <option value="1">Tier 1 (IIT/NIT/BITS/IIIT)</option>
                    <option value="2">Tier 2 (Good state/private)</option>
                    <option value="3">Tier 3 (Other)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-gray-600">Branch</label>
                  <input
                    type="text"
                    value={academic.branch}
                    onChange={(e) => setAcademic({ ...academic, branch: e.target.value })}
                    placeholder="Computer Science"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-gray-600">CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={academic.cgpa}
                    onChange={(e) => setAcademic({ ...academic, cgpa: e.target.value })}
                    placeholder="8.5"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-gray-600">Graduation Year</label>
                  <input
                    type="number"
                    value={academic.graduation_year}
                    onChange={(e) => setAcademic({ ...academic, graduation_year: e.target.value })}
                    placeholder="2025"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-gray-600">Internship Count</label>
                  <input
                    type="number"
                    value={academic.internship_count}
                    onChange={(e) => setAcademic({ ...academic, internship_count: e.target.value })}
                    placeholder="2"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30"
                  />
                </div>
              </div>
              <button
                onClick={saveAcademic}
                disabled={academicSaving}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {academicSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...</> : "Update"}
              </button>
            </div>
          )}
        </div>

        {/* ─── Section 4: Resume Upload ─── */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6">
          <h2 className="text-base font-bold text-gray-900">Resume Upload</h2>
          <p className="mb-4 text-sm text-gray-400">Upload your resume for AI-powered analysis</p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 px-4 transition-colors ${
              dragOver
                ? "border-teal-400 bg-teal-50/30"
                : "border-gray-200 bg-[#f9fafb] hover:border-teal-300 hover:bg-teal-50/10"
            }`}
          >
            <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm">
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-600">Drag & drop your resume or click to browse</p>
            <p className="mt-0.5 text-xs text-gray-400">PDF only, max 5MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) console.log("Selected file:", file.name);
              }}
            />
          </div>

          {resumeUrl && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
                  <FileText className="h-4 w-4 text-red-500" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">Resume.pdf</div>
                  <div className="text-xs text-gray-400">Uploaded</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {resumeParsed && (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                    <CheckCircle2 className="h-2.5 w-2.5" /> AI Parsed
                  </span>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
                >
                  Replace
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Section 5: Danger Zone ─── */}
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-red-100">
              <AlertTriangle className="h-4 w-4 text-red-500" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
              <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                Once you delete your account, there is no going back. All your data, progress, and integrations will be permanently removed.
              </p>
              <button className="mt-3 rounded-lg border border-red-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
