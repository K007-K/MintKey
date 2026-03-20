// Hook for persisting DSA solved problems — localStorage + API dual-write
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "mintkey_dsa_solved";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Manages DSA solved problem tracking with dual persistence:
 * - localStorage for instant UI response (optimistic updates)
 * - Backend API for persistent cross-device sync (when logged in)
 *
 * The hook works offline with localStorage only and syncs to API async.
 */
export function useDSAProgress() {
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const syncQueue = useRef<Array<{ lc_number: number; title: string; difficulty: string; topic: string; sheet: string; solved: boolean }>>([]);
  const isSyncing = useRef(false);

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

  // Persist to localStorage whenever solved changes (after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...solved]));
    }
  }, [solved, hydrated]);

  // Process sync queue — POST to API asynchronously
  const processSyncQueue = useCallback(async () => {
    if (isSyncing.current || syncQueue.current.length === 0) return;
    isSyncing.current = true;

    while (syncQueue.current.length > 0) {
      const item = syncQueue.current.shift();
      if (!item) break;
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) break; // No auth — skip API sync, localStorage is enough

        await fetch(`${API}/api/v1/dsa/progress`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item),
        });
      } catch {
        // API sync failed — localStorage already has the data, so no data loss
      }
    }
    isSyncing.current = false;
  }, []);

  const toggleSolved = useCallback(
    (lcNumber: number, meta?: { title?: string; difficulty?: string; topic?: string; sheet?: string }) => {
      setSolved((prev) => {
        const next = new Set(prev);
        const wasSolved = next.has(lcNumber);
        if (wasSolved) {
          next.delete(lcNumber);
        } else {
          next.add(lcNumber);
        }

        // Queue API sync with metadata
        syncQueue.current.push({
          lc_number: lcNumber,
          title: meta?.title || `LC-${lcNumber}`,
          difficulty: meta?.difficulty || "Medium",
          topic: meta?.topic || "General",
          sheet: meta?.sheet || "neetcode_150",
          solved: !wasSolved,
        });
        // Process async
        setTimeout(() => processSyncQueue(), 100);

        return next;
      });
    },
    [processSyncQueue]
  );

  const isSolved = useCallback((lcNumber: number) => solved.has(lcNumber), [solved]);

  const stats = {
    total: solved.size,
  };

  return { solved, toggleSolved, isSolved, stats, hydrated };
}
