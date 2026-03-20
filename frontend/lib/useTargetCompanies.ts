// Shared hook for persisting target company slugs in localStorage
"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mintkey_target_slugs";
const DEFAULT_TARGETS = ["google", "meta", "amazon", "microsoft"];

/**
 * Manages target company slugs with localStorage persistence.
 * Max 5 targets. Changes persist across page refreshes.
 */
export function useTargetCompanies() {
  const [targetSlugs, setTargetSlugs] = useState<string[]>(DEFAULT_TARGETS);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTargetSlugs(parsed);
        }
      }
    } catch {
      // Ignore parse errors — use defaults
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever slugs change (after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(targetSlugs));
    }
  }, [targetSlugs, hydrated]);

  const addTarget = useCallback((slug: string) => {
    setTargetSlugs((prev) => {
      if (prev.includes(slug) || prev.length >= 5) return prev;
      return [...prev, slug];
    });
  }, []);

  const removeTarget = useCallback((slug: string) => {
    setTargetSlugs((prev) => prev.filter((s) => s !== slug));
  }, []);

  return { targetSlugs, addTarget, removeTarget, hydrated };
}
