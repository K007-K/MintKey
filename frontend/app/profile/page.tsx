// Profile & Integrations page — wired to real API data
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { useCurrentUser, useUpdateProfile, useUploadResume } from "@/lib/api";
import { useSession } from "next-auth/react";
import {
  Github, Code2, Upload, UploadCloud, ChevronDown, ChevronUp,
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
        <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6">
          {/* Section header */}
          <div className="flex items-center gap-2.5 mb-1">
            <CheckCircle2 className="h-5 w-5" style={{ color: '#16a34a' }} />
            <h2 className="text-lg font-bold" style={{ color: '#111827' }}>Resume Upload</h2>
          </div>
          <p className="text-sm mb-5" style={{ color: '#6b7280' }}>Upload your resume for AI-powered analysis</p>

          {/* Upload area — show when no resume OR while uploading */}
          {(!resumeUrl || uploadResume.isPending) && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleResumeUpload(f); }}
              onClick={() => !uploadResume.isPending && fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-8 px-4 transition-colors ${
                uploadResume.isPending
                  ? 'cursor-wait'
                  : 'hover:bg-[rgba(20,184,166,0.04)]'
              }`}
              style={{
                borderColor: uploadResume.isPending || dragOver ? 'rgba(20,184,166,0.5)' : '#e5e7eb',
                background: uploadResume.isPending ? 'rgba(20,184,166,0.04)' : dragOver ? 'rgba(20,184,166,0.06)' : '#f9fafb',
              }}
            >
              {uploadResume.isPending ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin mb-2" style={{ color: '#14b8a6' }} />
                  <p className="text-sm font-medium" style={{ color: '#14b8a6' }}>Uploading & parsing your resume...</p>
                  <p className="mt-1 text-xs" style={{ color: '#6b7280' }}>Extracting skills, education, experience</p>
                </>
              ) : (
                <>
                  <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
                    <Upload className="h-4 w-4" style={{ color: '#14b8a6' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#374151' }}>Drag & drop your resume or click to browse</p>
                  <p className="mt-1 text-xs" style={{ color: '#9ca3af' }}>PDF only, max 5MB</p>
                </>
              )}
            </div>
          )}
          {/* Always-mounted hidden file input for Replace/Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleResumeUpload(file);
              e.target.value = '';
            }}
          />
          {uploadError && (
            <p className="mt-2 text-xs font-medium" style={{ color: '#ef4444' }}>{uploadError}</p>
          )}

          {/* ── PART 1: Uploaded file row ── */}
          {resumeUrl && !uploadResume.isPending && (
            <div className="flex items-center gap-3.5 rounded-[10px] p-3.5" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              {/* PDF icon — teal */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.20)' }}>
                <FileText className="h-5 w-5" style={{ color: '#14b8a6' }} strokeWidth={1.8} />
              </div>
              {/* File info */}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate" style={{ color: '#111827' }}>{resumeUrl}</div>
                <div className="flex items-center gap-0 mt-1 flex-wrap">
                  {resumeParsed && (
                    <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', color: '#16a34a' }}>
                      <CheckCircle2 className="h-3 w-3" /> AI Parsed
                    </span>
                  )}
                  {resumeParsedData?.total_skills != null && (
                    <>
                      <span className="mx-2 text-xs" style={{ color: '#9ca3af' }}>·</span>
                      <span className="text-[13px]" style={{ color: '#6b7280' }}>{resumeParsedData.total_skills} skills found</span>
                    </>
                  )}
                  {resumeParsedData?.file_size_kb != null && (
                    <>
                      <span className="mx-2 text-xs" style={{ color: '#9ca3af' }}>·</span>
                      <span className="text-[13px]" style={{ color: '#9ca3af' }}>{resumeParsedData.file_size_kb} KB</span>
                    </>
                  )}
                  <span className="mx-2 text-xs" style={{ color: '#9ca3af' }}>·</span>
                  <span className="text-[13px]" style={{ color: '#9ca3af' }}>
                    {resumeParsedData?.uploaded_at
                      ? `Uploaded ${(() => {
                          const diff = Date.now() - new Date(resumeParsedData.uploaded_at).getTime();
                          const mins = Math.floor(diff / 60000);
                          if (mins < 1) return 'just now';
                          if (mins < 60) return `${mins}m ago`;
                          const hrs = Math.floor(mins / 60);
                          if (hrs < 24) return `${hrs}h ago`;
                          const days = Math.floor(hrs / 24);
                          return `${days} day${days > 1 ? 's' : ''} ago`;
                        })()}`
                      : 'Uploaded'}
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="flex items-center gap-1 text-[13px] font-medium bg-transparent border-none hover:underline transition-colors"
                  style={{ color: '#14b8a6' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#0d9488')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#14b8a6')}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  Replace
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await updateProfile.mutateAsync({ resume_url: null, resume_parsed_data: null } as Record<string, unknown>);
                    } catch { /* ignore */ }
                  }}
                  className="bg-transparent border-none transition-colors p-1"
                  style={{ color: '#9ca3af' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                  title="Delete resume"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Resume Analysis ── */}
          {resumeParsed && resumeParsedData && !uploadResume.isPending && (() => {
            // Group skills by category
            type Skill = { name: string; category: string; frequency: number };
            const allSkills = (resumeParsedData.skills_extracted || []) as Skill[];
            const dsaStyles = { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', count: '#16a34a' };
            const backendStyles = { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', count: '#3b82f6' };
            const frontendStyles = { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', count: '#9333ea' };
            const defaultStyles = { bg: '#f9fafb', border: '#e5e7eb', text: '#374151', count: '#6b7280' };

            // Skills that should always go to Backend regardless of taxonomy category
            const backendSkillNames = new Set(['javascript', 'typescript', 'sql', 'postgresql', 'mongodb', 'supabase', 'redis', 'node.js', 'express.js', 'rest api', 'graphql', 'fastapi', 'django', 'flask']);
            // Category-level mapping for remaining skills
            const categoryMap: Record<string, { label: string; styles: typeof defaultStyles }> = {
              backend: { label: 'Backend', styles: backendStyles },
              database: { label: 'Backend', styles: backendStyles },
              frontend: { label: 'Frontend', styles: frontendStyles },
              languages: { label: 'DSA & CS', styles: dsaStyles },
            };

            const groups: Record<string, { label: string; styles: typeof defaultStyles; skills: Skill[] }> = {};
            allSkills.forEach((s) => {
              // Check skill-name override first
              let groupLabel: string;
              let styles: typeof defaultStyles;
              if (backendSkillNames.has(s.name.toLowerCase())) {
                groupLabel = 'Backend';
                styles = backendStyles;
              } else {
                const mapped = categoryMap[s.category];
                groupLabel = mapped ? mapped.label : 'Tools & Other';
                styles = mapped ? mapped.styles : defaultStyles;
              }
              if (!groups[groupLabel]) {
                groups[groupLabel] = { label: groupLabel, styles, skills: [] };
              }
              groups[groupLabel].skills.push(s);
            });
            const orderedGroups = ['DSA & CS', 'Backend', 'Frontend', 'Tools & Other']
              .filter((k) => groups[k])
              .map((k) => groups[k]);

            const totalSkills = allSkills.length;
            const totalProjects = resumeParsedData.projects?.length || 0;

            return (
              <div className="mt-6">
                {/* ── PART 2: Analysis section header ── */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-[18px] w-[18px]" style={{ color: '#16a34a' }} />
                    <span className="text-base font-bold" style={{ color: '#111827' }}>Resume Analysis</span>
                  </div>
                  <span className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280' }}>
                    {totalSkills} skills · {totalProjects} projects
                  </span>
                </div>

                {/* ── PART 3: Skills Extracted card ── */}
                {totalSkills > 0 && (
                  <div className="rounded-xl p-5" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold" style={{ color: '#111827' }}>Skills Extracted ({totalSkills})</span>
                    </div>
                    <div className="space-y-5">
                      {orderedGroups.map((group) => (
                        <div key={group.label}>
                          <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: '#9ca3af', letterSpacing: '0.06em' }}>{group.label}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {group.skills.map((skill, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center rounded-md px-2.5 py-[3px] text-xs font-medium"
                                style={{ background: group.styles.bg, border: `1px solid ${group.styles.border}`, color: group.styles.text }}
                              >
                                {skill.name}
                                {skill.frequency > 1 && (
                                  <span className="ml-1 text-[11px] font-semibold" style={{ color: group.styles.count }}>×{skill.frequency}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── PART 4: Contact Info row ── */}
                {resumeParsedData.contact && Object.values(resumeParsedData.contact).some(Boolean) && (
                  <div className="flex items-center gap-6 mt-3 rounded-[10px] p-3.5" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                    <span className="text-[13px] font-semibold" style={{ color: '#374151' }}>Contact Info</span>
                    <div className="flex items-center gap-5 flex-wrap">
                      {resumeParsedData.contact.email && (
                        <span className="flex items-center gap-1.5 text-[13px]" style={{ color: '#374151' }}>
                          <Mail className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} />{resumeParsedData.contact.email}
                        </span>
                      )}
                      {resumeParsedData.contact.phone && (
                        <span className="flex items-center gap-1.5 text-[13px]" style={{ color: '#374151' }}>
                          <Phone className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} />{resumeParsedData.contact.phone}
                        </span>
                      )}
                      {resumeParsedData.contact.github && (
                        <span className="flex items-center gap-1.5 text-[13px]" style={{ color: '#374151' }}>
                          <Github className="h-3.5 w-3.5" style={{ color: '#9ca3af' }} />github.com/{resumeParsedData.contact.github}
                        </span>
                      )}
                      {resumeParsedData.contact.linkedin && (
                        <span className="flex items-center gap-1.5 text-[13px]" style={{ color: '#374151' }}>
                          linkedin.com/in/{resumeParsedData.contact.linkedin}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ── PART 5: Stats row — ALL teal icons ── */}
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {resumeParsedData.education?.length > 0 && (
                    <div className="flex flex-col items-center gap-2 rounded-[10px] p-4 text-center" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'rgba(20,184,166,0.08)' }}>
                        <GraduationCap className="h-[18px] w-[18px]" style={{ color: '#14b8a6' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#111827' }}>{resumeParsedData.education.length} Education</p>
                        {resumeParsedData.education[0]?.degree && (
                          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{resumeParsedData.education[0].degree}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {resumeParsedData.experience?.length > 0 && (
                    <div className="flex flex-col items-center gap-2 rounded-[10px] p-4 text-center" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'rgba(20,184,166,0.08)' }}>
                        <Briefcase className="h-[18px] w-[18px]" style={{ color: '#14b8a6' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#111827' }}>{resumeParsedData.experience.length} Experience</p>
                      </div>
                    </div>
                  )}
                  {resumeParsedData.projects?.length > 0 && (
                    <div className="flex flex-col items-center gap-2 rounded-[10px] p-4 text-center" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'rgba(20,184,166,0.08)' }}>
                        <Code2 className="h-[18px] w-[18px]" style={{ color: '#14b8a6' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#111827' }}>{resumeParsedData.projects.length} Projects</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── PART 6: Sections detected footer ── */}
                {resumeParsedData.sections?.length > 0 && (
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: '#9ca3af' }}>Sections detected:</span>
                    {(resumeParsedData.sections as string[]).map((s, i) => (
                      <span key={i} className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>


      </div>
    </DashboardLayout>
  );
}
