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

// User preferences
interface PreferencesState {
  theme: "dark" | "light";
  syncInProgress: boolean;
  lastSyncedAt: string | null;
  setSyncInProgress: (val: boolean) => void;
  setLastSyncedAt: (date: string) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  theme: "dark",
  syncInProgress: false,
  lastSyncedAt: null,
  setSyncInProgress: (val) => set({ syncInProgress: val }),
  setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
}));
