// Zustand global state stores for MintKey
import { create } from "zustand";

// Sidebar state
interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
  open: () => set({ isOpen: true }),
}));

// Selected company state
interface CompanyState {
  selectedCompany: string | null;
  targetCompanies: string[];
  setSelectedCompany: (slug: string | null) => void;
  setTargetCompanies: (slugs: string[]) => void;
  addTargetCompany: (slug: string) => void;
  removeTargetCompany: (slug: string) => void;
}

export const useCompanyStore = create<CompanyState>((set) => ({
  selectedCompany: null,
  targetCompanies: [],
  setSelectedCompany: (slug) => set({ selectedCompany: slug }),
  setTargetCompanies: (slugs) => set({ targetCompanies: slugs }),
  addTargetCompany: (slug) =>
    set((s) => {
      if (s.targetCompanies.length >= 5) return s;
      return { targetCompanies: [...s.targetCompanies, slug] };
    }),
  removeTargetCompany: (slug) =>
    set((s) => ({
      targetCompanies: s.targetCompanies.filter((c) => c !== slug),
    })),
}));

// ─── Sync Interval Options ───
export const SYNC_INTERVAL_OPTIONS = [
  { label: "Every 1 hour", value: 3_600_000 },
  { label: "Every 3 hours", value: 10_800_000 },
  { label: "Every 6 hours", value: 21_600_000 },
  { label: "Every 12 hours", value: 43_200_000 },
  { label: "Once a day", value: 86_400_000 },
  { label: "Off", value: 0 },
] as const;

const DEFAULT_SYNC_INTERVAL = 10_800_000; // 3 hours

// Per-platform sync status
export interface PlatformSyncStatus {
  status: "idle" | "syncing" | "success" | "error";
  lastSynced: string | null;
  errorMsg?: string;
}

// User preferences
interface PreferencesState {
  theme: "dark" | "light";
  syncInProgress: boolean;
  lastSyncedAt: string | null;
  autoSyncInterval: number;
  perPlatformStatus: Record<string, PlatformSyncStatus>;
  setSyncInProgress: (val: boolean) => void;
  setLastSyncedAt: (date: string) => void;
  setAutoSyncInterval: (ms: number) => void;
  setPlatformSyncStatus: (platform: string, status: PlatformSyncStatus) => void;
  resetPlatformStatuses: () => void;
}

const getStoredSyncTime = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mintkey_last_synced");
};

const getStoredSyncInterval = (): number => {
  if (typeof window === "undefined") return DEFAULT_SYNC_INTERVAL;
  const stored = localStorage.getItem("mintkey_auto_sync_interval");
  if (stored !== null) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return DEFAULT_SYNC_INTERVAL;
};

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: "dark",
  syncInProgress: false,
  lastSyncedAt: getStoredSyncTime(),
  autoSyncInterval: getStoredSyncInterval(),
  perPlatformStatus: {},
  setSyncInProgress: (val) => set({ syncInProgress: val }),
  setLastSyncedAt: (date) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mintkey_last_synced", date);
    }
    set({ lastSyncedAt: date });
  },
  setAutoSyncInterval: (ms) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mintkey_auto_sync_interval", String(ms));
    }
    set({ autoSyncInterval: ms });
  },
  setPlatformSyncStatus: (platform, status) =>
    set((s) => ({
      perPlatformStatus: { ...s.perPlatformStatus, [platform]: status },
    })),
  resetPlatformStatuses: () => set({ perPlatformStatus: {} }),
}));
