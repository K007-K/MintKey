// Profile & Integrations page — wired to real API data
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { useCurrentUser, useUpdateProfile, useUploadResume } from "@/lib/api";
import { useSession } from "next-auth/react";
import {
  Github, Code2, Upload, ChevronDown, ChevronUp,
  CheckCircle2, FileText, Camera, Loader2,
  Trash2, Briefcase, GraduationCap, FolderGit2, Award, Mail, Phone,
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
  const uploadResume = useUploadResume();

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
    institution_name: "",
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
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Resume upload handler
  const handleResumeUpload = useCallback(async (file: File) => {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadError("Only PDF files are accepted");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size must be under 5MB");
      return;
    }
    try {
      await uploadResume.mutateAsync(file);
    } catch (err: unknown) {
      // Extract real error from Axios response
      const axiosErr = err as { response?: { status?: number; data?: { detail?: unknown; error?: string } }; message?: string };
      const status = axiosErr?.response?.status;
      const rawDetail = axiosErr?.response?.data?.detail;

      // Safely extract a string message from detail (which can be string, array, or object)
      let detail: string | null = null;
      if (typeof rawDetail === "string") {
        detail = rawDetail;
      } else if (Array.isArray(rawDetail) && rawDetail.length > 0) {
        // Pydantic 422 errors: [{type, loc, msg, input}]
        detail = rawDetail.map((e: { msg?: string }) => e.msg || "Validation error").join(", ");
      } else if (rawDetail && typeof rawDetail === "object") {
        detail = JSON.stringify(rawDetail);
      }

      if (status === 401) {
        setUploadError("Session expired. Please refresh the page.");
      } else if (status === 413) {
        setUploadError("File too large. Max 5MB allowed.");
      } else if (status === 422) {
        setUploadError(detail || "Invalid request format.");
      } else if (detail || axiosErr?.response?.data?.error) {
        setUploadError(detail || axiosErr?.response?.data?.error || "Upload failed.");
      } else if (axiosErr?.message) {
        setUploadError(axiosErr.message);
      } else {
        setUploadError("Upload failed. Please try again.");
      }
    }
  }, [uploadResume]);

  // Hydrate from API data
  useEffect(() => {
    if (user) {
      setName((user.name as string) || "");
      setAcademic({
        institution_name: (user.institution_name as string) || "",
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
        institution_name: academic.institution_name || null,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resumeParsedData = (user?.resume_parsed_data as Record<string, any>) || null;

  return (
    <DashboardLayout
      title="Profile & Integrations"
      subtitle="Manage your profile, connected platforms, and resume."
    >
      <div className="mx-auto max-w-3xl space-y-5">

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
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[13px] font-medium text-gray-600">Institution Name</label>
                  <input
                    type="text"
                    value={academic.institution_name}
                    onChange={(e) => setAcademic({ ...academic, institution_name: e.target.value })}
                    placeholder="e.g. VIT University"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30"
                  />
                </div>
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

          {/* Upload area — show when no resume OR while uploading */}
          {(!resumeUrl || uploadResume.isPending) && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleResumeUpload(f); }}
              onClick={() => !uploadResume.isPending && fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 px-4 transition-colors ${
                uploadResume.isPending
                  ? "border-teal-400 bg-teal-50/20 cursor-wait"
                  : dragOver
                    ? "border-teal-400 bg-teal-50/30"
                    : "border-gray-200 bg-[#f9fafb] hover:border-teal-300 hover:bg-teal-50/10"
              }`}
            >
              {uploadResume.isPending ? (
                <>
                  <Loader2 className="h-6 w-6 text-teal-500 animate-spin mb-2" />
                  <p className="text-sm font-medium text-teal-600">Uploading & parsing your resume...</p>
                  <p className="mt-0.5 text-xs text-gray-400">Extracting skills, education, experience</p>
                </>
              ) : (
                <>
                  <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-gray-100 shadow-sm">
                    <Upload className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Drag & drop your resume or click to browse</p>
                  <p className="mt-0.5 text-xs text-gray-400">PDF only, max 5MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleResumeUpload(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}
          {uploadError && (
            <p className="mt-2 text-xs text-red-500 font-medium">{uploadError}</p>
          )}

          {/* Uploaded file card + actions */}
          {resumeUrl && !uploadResume.isPending && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-green-100 bg-green-50/30 p-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
                  <FileText className="h-4 w-4 text-red-500" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{resumeUrl}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {resumeParsed && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600">
                        <CheckCircle2 className="h-3 w-3" /> AI Parsed
                      </span>
                    )}
                    {resumeParsedData?.total_skills != null && (
                      <span className="text-[11px] text-gray-400">
                        • {resumeParsedData.total_skills} skills found
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-teal-600 hover:bg-teal-50 transition-colors"
                >
                  Replace
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await updateProfile.mutateAsync({ resume_url: null, resume_parsed_data: null } as Record<string, unknown>);
                    } catch { /* ignore */ }
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete resume"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ─── Resume Analysis Results ─── */}
          {resumeParsed && resumeParsedData && !uploadResume.isPending && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                Resume Analysis
              </h3>

              {/* Skills extracted */}
              {resumeParsedData.skills_extracted?.length > 0 && (
                <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Skills Extracted ({resumeParsedData.skills_extracted.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(resumeParsedData.skills_extracted as Array<{name: string; category: string; frequency: number}>).map((skill, i) => {
                      const colors: Record<string, string> = {
                        languages: "bg-blue-50 text-blue-700 border-blue-200",
                        frontend: "bg-purple-50 text-purple-700 border-purple-200",
                        backend: "bg-amber-50 text-amber-700 border-amber-200",
                        database: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        devops: "bg-orange-50 text-orange-700 border-orange-200",
                        testing: "bg-pink-50 text-pink-700 border-pink-200",
                        tools: "bg-gray-50 text-gray-700 border-gray-200",
                      };
                      const colorClass = colors[skill.category] || "bg-gray-50 text-gray-700 border-gray-200";
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${colorClass}`}
                        >
                          {skill.name}
                          {skill.frequency > 1 && (
                            <span className="ml-1 text-[9px] opacity-60">×{skill.frequency}</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact info */}
              {resumeParsedData.contact && Object.values(resumeParsedData.contact).some(Boolean) && (
                <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Contact Info</p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {resumeParsedData.contact.email && (
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{resumeParsedData.contact.email}</span>
                    )}
                    {resumeParsedData.contact.phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{resumeParsedData.contact.phone}</span>
                    )}
                    {resumeParsedData.contact.github && (
                      <span className="flex items-center gap-1"><Github className="h-3 w-3" />github.com/{resumeParsedData.contact.github}</span>
                    )}
                    {resumeParsedData.contact.linkedin && (
                      <span className="flex items-center gap-1">linkedin.com/in/{resumeParsedData.contact.linkedin}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Sections summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {resumeParsedData.education?.length > 0 && (
                  <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-2.5 text-center">
                    <GraduationCap className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                    <p className="text-[11px] font-semibold text-gray-700">{resumeParsedData.education.length} Education</p>
                    {resumeParsedData.education[0]?.degree && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{resumeParsedData.education[0].degree}</p>
                    )}
                  </div>
                )}
                {resumeParsedData.experience?.length > 0 && (
                  <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-2.5 text-center">
                    <Briefcase className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                    <p className="text-[11px] font-semibold text-gray-700">{resumeParsedData.experience.length} Experience</p>
                  </div>
                )}
                {resumeParsedData.projects?.length > 0 && (
                  <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-2.5 text-center">
                    <FolderGit2 className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                    <p className="text-[11px] font-semibold text-gray-700">{resumeParsedData.projects.length} Projects</p>
                  </div>
                )}
                {resumeParsedData.certifications?.length > 0 && (
                  <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-2.5 text-center">
                    <Award className="h-4 w-4 mx-auto text-green-500 mb-1" />
                    <p className="text-[11px] font-semibold text-gray-700">{resumeParsedData.certifications.length} Certs</p>
                  </div>
                )}
              </div>

              {/* Sections found */}
              {resumeParsedData.sections?.length > 0 && (
                <p className="text-[11px] text-gray-400">
                  Sections detected: {resumeParsedData.sections.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>


      </div>
    </DashboardLayout>
  );
}
