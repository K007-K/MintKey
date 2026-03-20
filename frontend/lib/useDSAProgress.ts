// Hook for persisting DSA solved problems in localStorage
"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mintkey_dsa_solved";

/**
 * Manages DSA solved problem IDs with localStorage persistence.
 * Stores a Set of LeetCode problem numbers.
 */
export function useDSAProgress() {
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSolved(new Set(parsed));
        }
      }
    } catch {
      // Ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist whenever solved changes (after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...solved]));
    }
  }, [solved, hydrated]);

  const toggleSolved = useCallback((lcNumber: number) => {
    setSolved((prev) => {
      const next = new Set(prev);
      if (next.has(lcNumber)) {
        next.delete(lcNumber);
      } else {
        next.add(lcNumber);
      }
      return next;
    });
  }, []);

  const isSolved = useCallback((lcNumber: number) => solved.has(lcNumber), [solved]);

  const stats = {
    total: solved.size,
  };

  return { solved, toggleSolved, isSolved, stats, hydrated };
}
