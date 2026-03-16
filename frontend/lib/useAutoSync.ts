// Auto-sync hook — triggers platform sync when data is stale
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePreferencesStore } from "@/lib/store";
import { useCurrentUser, useSyncGithub, useSyncLeetCode, useSyncCodeChef, useSyncHackerRank } from "@/lib/api";
import { useToast } from "@/lib/useToast";

/**
 * useAutoSync — call once inside DashboardLayout.
 *
 * Triggers:
 * 1. On mount: if lastSyncedAt is null or older than user-selected interval
 * 2. On visibility change: if tab was hidden and data became stale
 *
 * Features:
 * - Per-platform progress tracking
 * - Exponential backoff on failure (2 min → 4 min → 8 min, max 3 retries)
 * - Toast notifications for sync start/complete/error
 * - Respects user's autoSyncInterval setting (0 = disabled)
 */
export function useAutoSync() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const { addToast } = useToast();

  const {
    lastSyncedAt,
    autoSyncInterval,
    syncInProgress,
    setSyncInProgress,
    setLastSyncedAt,
    setPlatformSyncStatus,
  } = usePreferencesStore();

  const syncGithub = useSyncGithub();
  const syncLeetCode = useSyncLeetCode();
  const syncCodeChef = useSyncCodeChef();
  const syncHackerRank = useSyncHackerRank();

  // Guards
  const hasTriggered = useRef(false);
  const retryCountRef = useRef<Record<string, number>>({});
  const retryTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const hiddenSinceRef = useRef<number | null>(null);

  const user = currentUser as Record<string, unknown> | undefined;

  const isStale = useCallback((): boolean => {
    if (autoSyncInterval === 0) return false; // disabled
    if (!lastSyncedAt) return true; // never synced
    const elapsed = Date.now() - new Date(lastSyncedAt).getTime();
    return elapsed > autoSyncInterval;
  }, [lastSyncedAt, autoSyncInterval]);

  const runSync = useCallback(async () => {
    if (syncInProgress) return;
    if (autoSyncInterval === 0) return;

    const githubUsername = (user?.github_username as string) || "";
    const leetcodeUsername = (user?.leetcode_username as string) || "";
    const codechefUsername = (user?.codechef_username as string) || "";
    const hackerrankUsername = (user?.hackerrank_username as string) || "";

    // Nothing connected
    if (!githubUsername && !leetcodeUsername && !codechefUsername && !hackerrankUsername) return;

    setSyncInProgress(true);
    addToast({ message: "Auto-syncing your platform data...", type: "info", duration: 3000 });

    // Build per-platform promises
    interface PlatformTask {
      key: string;
      promise: Promise<unknown>;
    }

    const tasks: PlatformTask[] = [];

    if (githubUsername) {
      setPlatformSyncStatus("GitHub", { status: "syncing", lastSynced: null });
      tasks.push({ key: "GitHub", promise: syncGithub.mutateAsync(githubUsername) });
    }
    if (leetcodeUsername) {
      setPlatformSyncStatus("LeetCode", { status: "syncing", lastSynced: null });
      tasks.push({ key: "LeetCode", promise: syncLeetCode.mutateAsync(leetcodeUsername) });
    }
    if (codechefUsername) {
      setPlatformSyncStatus("CodeChef", { status: "syncing", lastSynced: null });
      tasks.push({ key: "CodeChef", promise: syncCodeChef.mutateAsync(codechefUsername) });
    }
    if (hackerrankUsername) {
      setPlatformSyncStatus("HackerRank", { status: "syncing", lastSynced: null });
      tasks.push({ key: "HackerRank", promise: syncHackerRank.mutateAsync(hackerrankUsername) });
    }

    const results = await Promise.allSettled(tasks.map((t) => t.promise));
    const now = new Date().toISOString();

    let allSuccess = true;
    const failedPlatforms: string[] = [];

    results.forEach((result, i) => {
      const key = tasks[i].key;
      if (result.status === "fulfilled") {
        setPlatformSyncStatus(key, { status: "success", lastSynced: now });
        retryCountRef.current[key] = 0; // reset retries
      } else {
        allSuccess = false;
        failedPlatforms.push(key);
        const errMsg = result.reason instanceof Error ? result.reason.message : "Unknown error";
        setPlatformSyncStatus(key, { status: "error", lastSynced: null, errorMsg: errMsg });
        scheduleRetry(key);
      }
    });

    // Invalidate caches
    queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    queryClient.invalidateQueries({ queryKey: ["scores"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });

    setLastSyncedAt(now);
    setSyncInProgress(false);

    if (allSuccess) {
      addToast({ message: "All platforms synced successfully", type: "success" });
    } else {
      addToast({
        message: `${failedPlatforms.join(", ")} failed — will retry`,
        type: "warning",
        duration: 5000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, autoSyncInterval, syncInProgress]);

  // Exponential backoff retry: 2 min → 4 min → 8 min (max 3)
  const scheduleRetry = useCallback((platform: string) => {
    const count = (retryCountRef.current[platform] || 0) + 1;
    if (count > 3) return; // give up after 3 retries

    retryCountRef.current[platform] = count;
    const delayMs = Math.pow(2, count) * 60_000; // 2min, 4min, 8min

    // Clear any existing timer
    if (retryTimerRef.current[platform]) {
      clearTimeout(retryTimerRef.current[platform]);
    }

    retryTimerRef.current[platform] = setTimeout(async () => {
      const u = user;
      if (!u) return;

      let username = "";
      let mutate: ((username: string) => Promise<unknown>) | null = null;

      switch (platform) {
        case "GitHub":
          username = (u.github_username as string) || "";
          mutate = syncGithub.mutateAsync;
          break;
        case "LeetCode":
          username = (u.leetcode_username as string) || "";
          mutate = syncLeetCode.mutateAsync;
          break;
        case "CodeChef":
          username = (u.codechef_username as string) || "";
          mutate = syncCodeChef.mutateAsync;
          break;
        case "HackerRank":
          username = (u.hackerrank_username as string) || "";
          mutate = syncHackerRank.mutateAsync;
          break;
      }

      if (!username || !mutate) return;

      setPlatformSyncStatus(platform, { status: "syncing", lastSynced: null });
      try {
        await mutate(username);
        const now = new Date().toISOString();
        setPlatformSyncStatus(platform, { status: "success", lastSynced: now });
        retryCountRef.current[platform] = 0;
        addToast({ message: `${platform} synced on retry`, type: "success" });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      } catch {
        setPlatformSyncStatus(platform, {
          status: "error",
          lastSynced: null,
          errorMsg: `Retry ${count}/3 failed`,
        });
        if (count < 3) scheduleRetry(platform);
      }
    }, delayMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── Trigger 1: On mount (staleness check) ───
  useEffect(() => {
    if (hasTriggered.current) return;
    if (!user) return;

    if (isStale()) {
      hasTriggered.current = true;
      runSync();
    }
  }, [user, isStale, runSync]);

  // ─── Trigger 2: Visibility API (tab refocus) ───
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenSinceRef.current = Date.now();
      } else if (document.visibilityState === "visible") {
        if (hiddenSinceRef.current && isStale()) {
          runSync();
        }
        hiddenSinceRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      // Clear retry timers on unmount
      Object.values(retryTimerRef.current).forEach(clearTimeout);
    };
  }, [isStale, runSync]);
}
