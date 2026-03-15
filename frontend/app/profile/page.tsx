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

/* SVG platform logos */
const LeetCodeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#F89F1B">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
  </svg>
);

const HackerRankIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#00EA64">
    <path d="M12 0c1.285 0 9.75 4.886 10.392 6 .645 1.115.645 10.885 0 12S13.287 24 12 24s-9.75-4.885-10.395-6c-.641-1.115-.641-10.885 0-12C2.25 4.886 10.715 0 12 0zm2.295 6.799c-.141 0-.258.115-.258.258v3.875H9.963V7.057c0-.143-.117-.258-.258-.258h-1.2c-.141 0-.258.115-.258.258v9.886c0 .143.117.258.258.258h1.2c.141 0 .258-.115.258-.258v-3.875h4.074v3.875c0 .143.117.258.258.258h1.2c.141 0 .258-.115.258-.258V7.057c0-.143-.117-.258-.258-.258z"/>
  </svg>
);

const CodeChefIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#5B4638">
    <path d="M11.007.001c-.055-.001-.11.003-.166.008-.434.044-.774.373-.849.645-.075.273-.017.547.15.725.056.066.142.131.186.144.099.025.103.095.108.179.008.126-.04.2-.163.26-.123.06-.14.158-.117.268.012.066.066.168.104.208.087.082.103.19.043.325-.082.184-.11.374-.088.57.019.168.028.337.067.502.056.24.205.415.39.555l.167.132-.006.082c-.005.082-.005.083-.089.075-.061-.005-.065-.004-.088.033l-.024.037.064.062c.068.065.09.121.067.167-.015.032-.193.211-.305.308-.07.06-.07.062-.05.108.015.032.004.049-.04.06-.083.023-.107.065-.097.172.012.126-.132.337-.346.506-.166.13-.164.127-.183.184-.025.079-.068.093-.298.099-.14.003-.235.02-.337.058-.149.055-.158.055-.291.002-.11-.044-.155-.051-.227-.04-.066.013-.115.006-.209-.03-.117-.044-.124-.051-.14-.128-.023-.103-.071-.148-.182-.165-.122-.019-.186-.098-.266-.333-.08-.24-.076-.294.01-.324.073-.025.118-.087.108-.15-.01-.058-.064-.105-.128-.11-.093-.007-.18-.068-.243-.174-.04-.066-.05-.072-.196-.098-.084-.014-.179-.04-.212-.058-.084-.046-.103-.093-.073-.178.024-.067.178-.223.287-.29.034-.02.04-.034.03-.068-.009-.027-.025-.046-.038-.047-.063-.003-.243-.08-.327-.14-.082-.058-.1-.088-.078-.132.018-.035.066-.06.236-.123.16-.058.175-.071.153-.134-.011-.034-.064-.064-.148-.086-.201-.052-.352-.16-.39-.28-.009-.03-.002-.052.036-.113.193-.308.295-.54.312-.71.005-.057.015-.081.037-.09.04-.019.023-.112-.04-.214-.11-.179-.127-.264-.062-.27.056 0 .282.08.406.145.204.107.209.105.157-.041C9.9 2.63 9.885 2.49 9.9 2.404c.011-.058.01-.059-.038-.093C9.805 2.269 9.77 2.23 9.77 2.2c0-.026.03-.064.048-.068.02-.002.034-.013.034-.028 0-.04-.058-.122-.097-.14-.02-.01-.056-.036-.079-.06-.037-.035-.04-.046-.022-.068.024-.03.167-.047.272-.033.077.01.083.013.11.071.024.05.024.074.003.145-.036.112-.027.206.022.211.011.001.031-.024.044-.056.017-.04.039-.066.065-.079.093-.041.138-.027.215.07.04.05.084.091.098.091.033 0 .043-.03.042-.114-.002-.09.017-.143.08-.23C10.67.924 10.863.804 11.007.8z M6.04 5.437c-.017 0-.03.011-.03.028.001.024.027.052.143.155l.143.126-.059.091c-.032.05-.082.13-.111.177l-.053.086-.207-.174c-.193-.162-.208-.173-.233-.16-.025.013-.026.021-.005.063.013.028.082.124.153.215s.13.174.132.184c.002.025-.164.286-.178.28-.006-.003-.1-.082-.208-.177-.108-.095-.203-.17-.211-.166-.023.01-.026.019.032.12.031.055.098.158.149.229.05.072.092.137.092.145 0 .008-.036.058-.08.11-.044.053-.117.165-.16.25-.045.085-.088.155-.098.155-.009 0-.092-.07-.184-.154l-.168-.155-.049.036c-.029.02-.046.045-.041.057.006.013.067.096.137.185.07.09.127.172.127.183 0 .011-.033.065-.073.12-.04.054-.113.176-.163.27-.05.094-.095.17-.101.17-.005 0-.09-.076-.19-.169-.098-.093-.184-.167-.19-.163-.016.01-.029.05-.029.092 0 .033.018.053.08.09.044.027.135.118.201.203.066.085.123.154.127.154.004 0 .018-.023.03-.05.034-.076.066-.067.152.047.129.166.271.224.438.18.108-.03.252-.108.338-.185l.076-.067.068.015c.152.032.216.068.329.185.049.05.098.092.11.092.026 0 .022-.007-.119-.168-.091-.103-.117-.15-.088-.161.01-.003.114-.068.23-.145.153-.1.274-.168.406-.224l.197-.083.14.084c.077.047.162.088.188.093.048.008.055.003.22-.164L9.53 7.48l.085.07c.048.04.087.082.089.097.005.038-.106.158-.196.213-.072.044-.096.05-.163.04-.082-.013-2.29-.013-2.472-.013h-.066v.03c0 .027.033.03.249.03H7.3v4.906H7.056c-.216 0-.248.004-.248.03v.031h.138c.162 0 2.367 0 2.499-.016.073-.009.112-.005.201.023l.034.01-.075.082c-.042.046-.1.099-.13.119-.048.032-.074.037-.195.037h-.14l-.09.076c-.05.042-.1.09-.112.107l-.022.032.221.092c.163.069.29.105.504.148.301.06.304.061.507.02.292-.06.576-.166.782-.29.054-.034.114-.063.133-.064.041-.003.046.014.026.076a.99.99 0 0 1-.102.185c-.053.074-.051.087.012.132.064.046.06.072-.018.128-.063.047-.134.052-.198.016-.035-.02-.07-.023-.126-.013-.133.024-.154.058-.158.252-.003.094-.014.175-.04.267-.02.074-.033.15-.027.168.015.06-.038.155-.105.192-.08.043-.099.085-.078.168.011.045 0 .082-.059.208-.087.182-.15.268-.28.38-.103.09-.107.096-.107.165 0 .07-.003.073-.088.13-.05.034-.11.063-.132.063-.033.001-.059-.023-.118-.108-.093-.133-.117-.148-.283-.183-.13-.027-.152-.027-.217.002-.076.033-.147.104-.147.147 0 .068.082.14.21.182.042.015.13.064.195.11.095.069.139.088.228.101.229.036.456-.029.587-.169.04-.043.079-.06.15-.074.053-.009.137-.04.186-.068.064-.037.095-.046.106-.034.014.02.067.012.154-.024.07-.029.044-.029-.12-.001-.11.019-.24 0-.336-.047-.12-.058-.066-.086.086-.046.051.013.12.023.153.022.086-.002.086-.005.09-.059.004-.067-.094-.187-.147-.18-.016.003-.06.024-.099.046-.114.063-.28.075-.386.027-.143-.065-.193-.02-.255.232-.045.184-.018.288.088.34.142.078.234.133.247.167.034.073-.075.144-.265.172-.178.026-.302-.02-.379-.141-.055-.086-.058-.087-.182-.102-.142-.017-.186-.05-.153-.117.016-.035.016-.038-.026-.035-.149.008-.32.101-.396.216-.034.05-.051.058-.12.062-.068.004-.087.014-.139.069-.053.058-.068.063-.144.063-.048-.001-.102-.012-.122-.026-.03-.022-.038-.021-.048.007-.015.04-.085.085-.128.082-.014 0-.058-.019-.098-.039-.09-.049-.117-.046-.2.02-.093.074-.128.084-.255.074-.203-.015-.269-.027-.395-.068-.14-.047-.213-.046-.296.002l-.058.033-.107-.039c-.207-.074-.254-.104-.325-.203-.04-.055-.044-.056-.125-.048-.096.01-.212-.031-.291-.103-.058-.052-.062-.051-.065.033 0 .025-.008.05-.017.054-.009.004-.025-.027-.037-.068-.017-.06-.02-.072-.007-.055a.24.24 0 0 0 .036.055c.072.093.083.114.083.162 0 .11.103.231.265.314.127.064.162.064.279-.001.053-.03.112-.053.13-.053.035 0 .056.032.056.088 0 .058-.093.153-.19.194-.146.062-.37.056-.49-.012-.072-.042-.075-.042-.111-.014-.03.022-.063.029-.165.032-.175.004-.336-.081-.41-.218-.027-.05-.044-.067-.065-.064-.017.003-.034-.007-.039-.021-.01-.033.033-.127.066-.139.013-.005.024-.013.024-.018a.12.12 0 0 0-.029-.05c-.036-.035-.046-.035-.209.01l-.111.031-.057-.043a.645.645 0 0 1-.103-.11v-.019c0-.01-.018-.012-.058-.003-.032.006-.07.005-.085-.003-.024-.014-.025-.02-.005-.045.021-.027.02-.037-.02-.125-.045-.101-.189-.269-.183-.215.002.018-.006.041-.019.052-.014.013-.026.004-.046-.033-.015-.028-.06-.092-.1-.141a2.14 2.14 0 0 1-.127-.193c-.034-.063-.036-.064-.073-.045a.139.139 0 0 1-.053.015c-.012 0-.032-.021-.045-.047-.015-.032-.034-.05-.05-.05-.016 0-.036-.011-.046-.025-.015-.021-.059-.039-.104-.043z"/>
  </svg>
);

const PLATFORMS: PlatformCard[] = [
  { key: "github", name: "GitHub", icon: <Github className="h-5 w-5 text-gray-700" strokeWidth={1.8} />, usernameField: "github_username" },
  { key: "leetcode", name: "LeetCode", icon: <LeetCodeIcon />, usernameField: "leetcode_username" },
  { key: "hackerrank", name: "HackerRank", icon: <HackerRankIcon />, usernameField: "hackerrank_username" },
  { key: "codechef", name: "CodeChef", icon: <CodeChefIcon />, usernameField: "codechef_username" },
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
