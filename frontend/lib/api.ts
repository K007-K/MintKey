// React Query hooks + Axios instance for MintKey API
import axios from "axios";
import {
  useQuery,
  useMutation,
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

// Score history for trend chart
export function useScoreHistory(companySlug: string) {
  return useQuery({
    queryKey: ["scores", "history", companySlug],
    queryFn: async () => {
      const { data } = await api.get<APIResponse>(
        `/api/v1/scores/history/${companySlug}`
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
