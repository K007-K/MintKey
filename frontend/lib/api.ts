// React Query hooks + Axios instance for MintKey API
import axios from "axios";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

// --- Axios instance ---
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("mintkey_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401 — clear stale token + trigger NextAuth session refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("mintkey_token");
      // Trigger NextAuth to refresh the session (which re-runs JWT callback)
      try { await fetch("/api/auth/session"); } catch {}
    }
    return Promise.reject(error);
  }
);

// --- Query Client ---
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// --- API Response type ---
interface APIResponse<T = unknown> {
  success: boolean;
  data: T;
  error: string | null;
}

// --- React Query Hooks ---

// User profile
export function useCurrentUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>("/api/v1/users/me");
      return data.data;
    },
  });
}

// Match scores for all target companies
export function useMatchScores() {
  return useQuery({
    queryKey: ["scores"],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>("/api/v1/scores/");
      return data.data;
    },
  });
}


// Skill gaps for a specific company
export function useSkillGaps(companySlug: string) {
  return useQuery({
    queryKey: ["scores", "gaps", companySlug],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>(
        `/api/v1/scores/gaps/${companySlug}`
      );
      return data.data;
    },
    enabled: !!companySlug,
  });
}

// Trigger analysis
export function useTriggerAnalysis() {
  return useMutation({
    mutationFn: async (payload: {
      github_username?: string;
      leetcode_username?: string;
      target_companies: string[];
    }) => {
      const { data } = await api.post<APIResponse>(
        "/api/v1/analysis/trigger",
        payload
      );
      return data.data;
    },
  });
}

// Poll analysis status (enabled only when taskId is set)
export function useAnalysisStatus(taskId: string | null) {
  return useQuery({
    queryKey: ["analysis", "status", taskId],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>(
        `/api/v1/analysis/status/${taskId}`
      );
      return data.data;
    },
    enabled: !!taskId,
    refetchInterval: (query) => {
      const status = (query?.state?.data as Record<string, unknown>)?.status;
      if (status === "complete" || status === "failed") return false;
      return 2000; // Poll every 2s while running
    },
    staleTime: 0,
  });
}

// Compute match scores after analysis
export function useComputeScores() {
  return useMutation({
    mutationFn: async (payload: { target_companies: string[] }) => {
      const { data } = await api.post<APIResponse>(
        "/api/v1/scores/compute",
        payload
      );
      return data.data;
    },
  });
}

// --- Company Hooks ---

// List all companies
export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>("/api/companies");
      return data.data;
    },
    staleTime: 30 * 60 * 1000, // 30 min — company data rarely changes
  });
}

// Single company by slug
export function useCompany(slug: string) {
  return useQuery({
    queryKey: ["companies", slug],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>(`/api/companies/${slug}`);
      return data.data;
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

// Scoring weights only
export function useCompanyScoringWeights(slug: string) {
  return useQuery({
    queryKey: ["companies", slug, "weights"],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>(`/api/companies/${slug}/scoring-weights`);
      return data.data;
    },
    enabled: !!slug,
    staleTime: 30 * 60 * 1000,
  });
}

// Dashboard summary — real scraped platform data
export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>("/api/v1/dashboard/summary");
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });
}

// Health check
export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data } = await api.get("/health");
      return data;
    },
  });
}

// --- Auth Token Management ---

/**
 * Store the backend JWT token (received from NextAuth callback).
 * The Axios interceptor will pick it up for all subsequent requests.
 */
export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("mintkey_token", token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("mintkey_token");
  }
}

// --- User Profile Mutations ---

// Update user profile (used by onboarding and settings)
export function useUpdateProfile() {
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data } = await api.patch<APIResponse>("/api/v1/users/me", updates);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
}

// --- Platform Sync Mutations ---

// Trigger GitHub sync (direct mode — no Celery needed)
export function useSyncGithub() {
  return useMutation({
    mutationFn: async (github_username: string) => {
      const { data } = await api.post<APIResponse>("/api/v1/sync/github/direct", {
        github_username,
      }, { timeout: 60000 }); // GitHub scraper can take 40s+ for repos with 409s
      return data.data;
    },
  });
}

// Trigger LeetCode sync (direct mode — from dashboard)
export function useSyncLeetCodeDirect() {
  return useMutation({
    mutationFn: async (leetcode_username: string) => {
      const { data } = await api.post<APIResponse>("/api/v1/sync/leetcode/direct", {
        leetcode_username,
      });
      return data.data;
    },
  });
}

// Trigger CodeChef sync (direct mode)
export function useSyncCodeChef() {
  return useMutation({
    mutationFn: async (codechef_username: string) => {
      const { data } = await api.post<APIResponse>("/api/v1/sync/codechef/direct", {
        codechef_username,
      });
      return data.data;
    },
  });
}

// Trigger HackerRank sync (direct mode)
export function useSyncHackerRank() {
  return useMutation({
    mutationFn: async (hackerrank_username: string) => {
      const { data } = await api.post<APIResponse>("/api/v1/sync/hackerrank/direct", {
        hackerrank_username,
      });
      return data.data;
    },
  });
}

// Upload resume PDF (multipart/form-data)
export function useUploadResume() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post<APIResponse>("/api/v1/sync/resume/upload", formData, {
        // Override the default "application/json" from axios.create —
        // browser must auto-set Content-Type with multipart boundary
        headers: { "Content-Type": undefined },
        timeout: 60000,
      });
      if (!data.success) {
        throw new Error(data.error || "Upload failed");
      }
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
  });
}

// Delete user account permanently
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<APIResponse>("/api/v1/users/me");
      return data.data;
    },
    onSuccess: () => {
      clearAuthToken();
      queryClient.clear();
    },
  });
}

// --- Practice API Hooks ---

interface PracticeFilters {
  source?: string;
  difficulty?: string;
  study_plan?: string;
  pattern?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

// Fetch problems with filters + pagination
export function useProblems(filters: PracticeFilters = {}) {
  return useQuery({
    queryKey: ["practice", "problems", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.source && filters.source !== "All") params.set("source", filters.source.toLowerCase());
      if (filters.difficulty && filters.difficulty !== "All") params.set("difficulty", filters.difficulty);
      if (filters.study_plan) params.set("study_plan", filters.study_plan);
      if (filters.pattern) params.set("pattern", filters.pattern);
      if (filters.search) params.set("search", filters.search);
      params.set("page", String(filters.page || 1));
      params.set("per_page", String(filters.per_page || 50));
      const { data } = await api.get<APIResponse>(`/api/v1/practice/problems?${params}`);
      return data.data;
    },
  });
}

// Fetch single problem detail
export function useProblemDetail(problemId: string) {
  return useQuery({
    queryKey: ["practice", "problem", problemId],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>(`/api/v1/practice/problems/${problemId}`);
      return data.data;
    },
    enabled: !!problemId,
  });
}

// Fetch study plan stats
export function useStudyPlans() {
  return useQuery({
    queryKey: ["practice", "plans"],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>("/api/v1/practice/plans");
      return data.data;
    },
  });
}

// Fetch user practice stats (auth required)
export function usePracticeStats() {
  return useQuery({
    queryKey: ["practice", "stats"],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>("/api/v1/practice/stats");
      return data.data;
    },
  });
}

// Fetch user progress for all problems (auth required)
export function usePracticeProgress() {
  return useQuery({
    queryKey: ["practice", "progress"],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>("/api/v1/practice/progress");
      return data.data;
    },
  });
}

// Update problem progress (auth required)
export function useUpdateProblemProgress() {
  return useMutation({
    mutationFn: async ({
      problemId,
      status,
    }: {
      problemId: string;
      status: "solved" | "attempted" | "unsolved";
    }) => {
      const { data } = await api.patch<APIResponse>(
        `/api/v1/practice/progress/${problemId}?status=${status}`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practice"] });
    },
  });
}

// --- Roadmap API Hooks ---

// List all roadmaps for the current user
export function useRoadmapList() {
  return useQuery({
    queryKey: ["roadmaps"],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>("/api/v1/roadmap/");
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get roadmap for a specific company
export function useRoadmapData(companySlug: string) {
  return useQuery({
    queryKey: ["roadmaps", companySlug],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>(
        `/api/v1/roadmap/${companySlug}`
      );
      return data.data;
    },
    enabled: !!companySlug,
    staleTime: 5 * 60 * 1000,
  });
}

// Update roadmap progress
export function useUpdateRoadmapProgress() {
  return useMutation({
    mutationFn: async ({
      companySlug,
      currentWeek,
      progressPct,
    }: {
      companySlug: string;
      currentWeek: number;
      progressPct: number;
    }) => {
      const { data } = await api.patch<APIResponse>(
        `/api/v1/roadmap/${companySlug}/progress`,
        { current_week: currentWeek, progress_pct: progressPct }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
    },
  });
}

// Update a kanban task status (triggers score recalculation)
export function useUpdateTask() {
  return useMutation({
    mutationFn: async ({
      companySlug,
      taskId,
      status,
      lcCountDone,
    }: {
      companySlug: string;
      taskId: string;
      status: string;
      lcCountDone?: number;
    }) => {
      const { data } = await api.patch<APIResponse>(
        `/api/v1/roadmap/${companySlug}/tasks/${taskId}`,
        { status, lc_count_done: lcCountDone }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
    },
  });
}

// Get score history for the trend chart
export function useScoreHistory(companySlug: string) {
  return useQuery({
    queryKey: ["score-history", companySlug],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>(
        `/api/v1/roadmap/${companySlug}/score-history`
      );
      return data.data;
    },
    enabled: !!companySlug,
    staleTime: 60 * 1000,
  });
}

// Trigger LeetCode sync for a roadmap
export function useSyncLeetCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (companySlug: string) => {
      const { data } = await api.post<APIResponse>(
        `/api/v1/roadmap/${companySlug}/sync/leetcode`
      );
      return data.data;
    },
    onSuccess: (_data, companySlug) => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap", companySlug] });
      queryClient.invalidateQueries({ queryKey: ["score-history", companySlug] });
    },
  });
}

// Trigger GitHub sync for a roadmap
export function useSyncGitHub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (companySlug: string) => {
      const { data } = await api.post<APIResponse>(
        `/api/v1/roadmap/${companySlug}/sync/github`
      );
      return data.data;
    },
    onSuccess: (_data, companySlug) => {
      queryClient.invalidateQueries({ queryKey: ["roadmaps"] });
      queryClient.invalidateQueries({ queryKey: ["roadmap", companySlug] });
      queryClient.invalidateQueries({ queryKey: ["score-history", companySlug] });
    },
  });
}

// Export roadmap as JSON download
export function useExportRoadmap() {
  return useMutation({
    mutationFn: async (companySlug: string) => {
      const { data } = await api.get<APIResponse>(
        `/api/v1/roadmap/${companySlug}/export`
      );
      // Trigger browser download
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${companySlug}-roadmap-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      return data.data;
    },
  });
}

// Regenerate roadmap via Agent 7 (Groq LLM)
export function useRegenerateRoadmap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (companySlug: string) => {
      const { data } = await api.post<APIResponse>(
        `/api/v1/roadmap/${companySlug}/regenerate`
      );
      if (!data.success) throw new Error(data.error || "Regeneration failed");
      return data.data;
    },
    onSuccess: (_data, companySlug) => {
      // Invalidate roadmap data to force refetch with new AI-generated content
      queryClient.invalidateQueries({ queryKey: ["roadmap", companySlug] });
      queryClient.invalidateQueries({ queryKey: ["score-history", companySlug] });
    },
  });
}
