// Collapsible dashboard sidebar — smooth animation with opacity transitions
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSidebarStore, usePreferencesStore } from "@/lib/store";
import { useToast } from "@/lib/useToast";
import { useCurrentUser, useSyncGithub, useSyncLeetCodeDirect, useSyncCodeChef, useSyncHackerRank, queryClient } from "@/lib/api";
import { MintKeyLogoMark, MintKeyLogo } from "@/components/ui/MintKeyLogo";
import {
  LayoutDashboard,
  Building2,
  Map,
  Code2,
  GitBranch,
  TrendingUp,
  Sparkles,
  Target,
  User,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

const PLATFORM_NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/companies", label: "Companies", Icon: Building2 },
  { href: "/roadmap", label: "My Roadmap", Icon: Map },
  { href: "/practice", label: "DSA Practice", Icon: Code2 },
  { href: "/skills", label: "Skill Graph", Icon: GitBranch },
];

const INTELLIGENCE_NAV = [
  { href: "/trends", label: "Market Trends", Icon: TrendingUp },
  { href: "/simulate", label: "Career Simulator", Icon: Target },
  { href: "/coach", label: "AI Coach", Icon: Sparkles, badge: "BETA" },
];

const BOTTOM_NAV = [
  { href: "/profile", label: "Profile & Integrations", Icon: User },
  { href: "/settings", label: "Settings", Icon: Settings },
];

/* ─── Tooltip (collapsed-state only) ─────────────────────────────── */

function Tooltip({
  label,
  targetRef,
  show,
}: {
  label: string;
  targetRef: React.RefObject<HTMLElement | null>;
  show: boolean;
}) {
  const [pos, setPos] = useState({ top: 0 });

  useEffect(() => {
    if (show && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPos({ top: rect.top + rect.height / 2 });
    }
  }, [show, targetRef]);

  if (!show) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: 72,
        top: pos.top,
        transform: "translateY(-50%)",
      }}
    >
      {/* Arrow */}
      <div
        className="absolute"
        style={{
          left: -4,
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: "4px solid transparent",
          borderBottom: "4px solid transparent",
          borderRight: "4px solid #111827",
        }}
      />
      {/* Label */}
      <div
        className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium text-white"
        style={{ backgroundColor: "#111827" }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─── Main Sidebar ────────────────────────────────────────────────── */

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();
  const { syncInProgress, setSyncInProgress, setLastSyncedAt, setPlatformSyncStatus } = usePreferencesStore();
  const { addToast } = useToast();
  const { data: session } = useSession();
  const { data: userData } = useCurrentUser();
  const syncGithub = useSyncGithub();
  const syncLeetCode = useSyncLeetCodeDirect();
  const syncCodeChef = useSyncCodeChef();
  const syncHackerRank = useSyncHackerRank();

  const user = userData as Record<string, unknown> | undefined;
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();
  const userAvatar = session?.user?.image;

  // Collapsed = !isOpen
  const collapsed = !isOpen;

  // Run sync for all connected platforms
  const handleSyncNow = async () => {
    if (syncInProgress) return;
    setSyncInProgress(true);
    addToast({ message: "Syncing all platforms...", type: "info", duration: 3000 });

    const githubUsername = (user?.github_username as string) || "";
    const leetcodeUsername = (user?.leetcode_username as string) || "";
    const codechefUsername = (user?.codechef_username as string) || "";
    const hackerrankUsername = (user?.hackerrank_username as string) || "";

    interface SyncTask { key: string; promise: Promise<unknown> }
    const tasks: SyncTask[] = [];

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

    if (tasks.length === 0) {
      addToast({ message: "No platforms connected", type: "warning" });
      setSyncInProgress(false);
      return;
    }

    const results = await Promise.allSettled(tasks.map((t) => t.promise));
    const now = new Date().toISOString();
    const failed: string[] = [];

    results.forEach((result, i) => {
      const key = tasks[i].key;
      if (result.status === "fulfilled") {
        setPlatformSyncStatus(key, { status: "success", lastSynced: now });
      } else {
        failed.push(key);
        setPlatformSyncStatus(key, { status: "error", lastSynced: null, errorMsg: "Sync failed" });
      }
    });

    queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    queryClient.invalidateQueries({ queryKey: ["scores"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setLastSyncedAt(now);
    setSyncInProgress(false);

    if (failed.length === 0) {
      addToast({ message: "All platforms synced successfully", type: "success" });
    } else {
      addToast({ message: `${failed.join(", ")} failed to sync`, type: "error", duration: 5000 });
    }
  };

  /* ─── NavItem with tooltip support ─── */

  const NavItem = ({
    href,
    label,
    Icon,
    badge,
  }: {
    href: string;
    label: string;
    Icon: React.ElementType;
    badge?: string;
  }) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    const itemRef = useRef<HTMLAnchorElement>(null);
    const [showTooltip, setShowTooltip] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = useCallback(() => {
      if (collapsed) {
        timerRef.current = setTimeout(() => setShowTooltip(true), 300);
      }
    }, [collapsed]);

    const handleMouseLeave = useCallback(() => {
      setShowTooltip(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    // Clear tooltip if sidebar opens while hovering
    useEffect(() => {
      if (!collapsed) {
        setShowTooltip(false);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    }, [collapsed]);

    return (
      <>
        <Link
          ref={itemRef}
          href={href}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : 10,
            paddingTop: 8,
            paddingBottom: 8,
            paddingLeft: collapsed ? 0 : 12,
            paddingRight: collapsed ? 0 : 12,
            marginLeft: collapsed ? 0 : 8,
            marginRight: collapsed ? 0 : 8,
            marginTop: 0,
            marginBottom: 0,
            borderRadius: 8,
            width: collapsed ? "100%" : undefined,
            textDecoration: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            transition: "background-color 200ms, color 200ms",
            backgroundColor: isActive ? "rgba(20, 184, 166, 0.08)" : "transparent",
            color: isActive ? "#14b8a6" : "#374151",
            fontWeight: isActive ? 600 : 500,
            fontSize: 14,
          }}
          onMouseOver={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = "#f3f4f6";
            }
          }}
          onMouseOut={(e) => {
            if (!isActive) {
              e.currentTarget.style.backgroundColor = "transparent";
            }
          }}
        >
          <Icon
            style={{
              width: 18,
              height: 18,
              flexShrink: 0,
              color: isActive ? "#14b8a6" : "#6b7280",
            }}
            strokeWidth={isActive ? 2.2 : 1.8}
          />
          {/* FIX 3: Use display:none in collapsed so label is OUT of flex flow */}
          {!collapsed && (
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
              {label}
            </span>
          )}
          {/* FIX 5: BETA badge — filled pill, hidden in collapsed */}
          {badge && !collapsed && (
            <span
              style={{
                backgroundColor: "rgba(20, 184, 166, 0.12)",
                border: "1px solid rgba(20, 184, 166, 0.30)",
                color: "#14b8a6",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.05em",
                borderRadius: 99,
                padding: "2px 7px",
                lineHeight: 1.4,
                marginLeft: "auto",
              }}
            >
              {badge}
            </span>
          )}
        </Link>
        {collapsed && (
          <Tooltip
            label={label}
            targetRef={itemRef as React.RefObject<HTMLElement | null>}
            show={showTooltip}
          />
        )}
      </>
    );
  };

  return (
    <aside
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
        display: "flex",
        height: "100vh",
        flexDirection: "column",
        borderRight: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        overflow: "hidden",
        width: collapsed ? 64 : 260,
        transition: "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* ─── FIX 2: Logo + toggle ─── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          height: 64,
          padding: collapsed ? "0" : "0 16px",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
        {/* Logo — hidden in collapsed state */}
        {!collapsed && (
          <div style={{ overflow: "hidden", flexShrink: 0 }}>
            <MintKeyLogoMark />
          </div>
        )}
        {/* Toggle button — centered in collapsed */}
        <button
          onClick={toggle}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            padding: 6,
            color: "#9ca3af",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
            transition: "background-color 150ms",
            margin: collapsed ? "0 auto" : 0,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#f3f4f6";
            e.currentTarget.style.color = "#6b7280";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#9ca3af";
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen style={{ width: 20, height: 20 }} />
          ) : (
            <PanelLeftClose style={{ width: 20, height: 20 }} />
          )}
        </button>
      </div>

      {/* ─── Navigation ─── */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: collapsed ? "8px 0" : "8px 0",
        }}
      >
        {/* FIX 7: Platform section label / divider */}
        {collapsed ? (
          <div style={{ height: 8 }} />
        ) : (
          <div style={{ padding: "8px 20px 4px 20px" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
                color: "#9ca3af",
              }}
            >
              Platform
            </span>
          </div>
        )}

        {/* FIX 1: Nav list with 2px gap */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {PLATFORM_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        {/* FIX 7: Divider between groups */}
        <div
          style={{
            height: 1,
            background: "#e5e7eb",
            margin: collapsed ? "8px 12px" : "8px 8px",
          }}
        />

        {/* Intelligence section label / divider */}
        {collapsed ? (
          <div style={{ height: 4 }} />
        ) : (
          <div style={{ padding: "4px 20px 4px 20px" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
                color: "#9ca3af",
              }}
            >
              Intelligence
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {INTELLIGENCE_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* ─── Bottom section ─── */}
      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid #e5e7eb",
          padding: collapsed ? "8px 0" : "8px 0",
          flexShrink: 0,
        }}
      >
        {/* FIX 6: Profile & Settings — only current route gets active style */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {BOTTOM_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        {/* FIX 8: Sync Now button */}
        {collapsed ? (
          <button
            onClick={handleSyncNow}
            disabled={syncInProgress}
            title={syncInProgress ? "Syncing..." : "Sync Now"}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: syncInProgress ? "#9ca3af" : "#14b8a6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "8px auto",
              border: "none",
              cursor: syncInProgress ? "wait" : "pointer",
              color: "white",
            }}
          >
            {syncInProgress ? (
              <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
            ) : (
              <svg
                style={{ width: 16, height: 16 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
          </button>
        ) : (
          <button
            onClick={handleSyncNow}
            disabled={syncInProgress}
            style={{
              width: "calc(100% - 32px)",
              height: 40,
              borderRadius: 8,
              background: syncInProgress ? "#9ca3af" : "#14b8a6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              margin: "8px 16px",
              border: "none",
              cursor: syncInProgress ? "wait" : "pointer",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {syncInProgress ? (
              <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
            ) : (
              <svg
                style={{ width: 16, height: 16 }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            {syncInProgress ? "Syncing..." : "Sync Now"}
          </button>
        )}

        {/* Per-platform sync status (expanded only) */}
        {!collapsed && (
          <PlatformSyncStatusPanel />
        )}

        {/* FIX 9: User row */}
        {collapsed ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "12px 0",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "#111827",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {userInitial}
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
              }}
              title="Sign out"
            >
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "#111827",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {userInitial}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#111827",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userEmail}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                flexShrink: 0,
              }}
              title="Sign out"
            >
              <LogOut style={{ width: 16, height: 16 }} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─── Per-platform sync status mini panel ─── */

function PlatformSyncStatusPanel() {
  const { perPlatformStatus } = usePreferencesStore();
  const entries = Object.entries(perPlatformStatus);
  if (entries.length === 0) return null;

  const statusDot: Record<string, string> = {
    idle: "bg-gray-300",
    syncing: "bg-amber-400 animate-pulse",
    success: "bg-green-500",
    error: "bg-red-400",
  };

  const statusLabel: Record<string, string> = {
    idle: "—",
    syncing: "syncing…",
    success: "synced",
    error: "failed",
  };

  const miniTimeAgo = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60_000) return "just now";
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  return (
    <div style={{ margin: "4px 16px 0", padding: "8px 10px", borderRadius: 8, background: "#f9fafb", border: "1px solid #f3f4f6" }}>
      {entries.map(([platform, info]) => (
        <div key={platform} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 11 }}>
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusDot[info.status]}`} />
          <span style={{ flex: 1, color: "#374151", fontWeight: 500 }}>{platform}</span>
          <span style={{ color: info.status === "error" ? "#ef4444" : "#9ca3af", fontSize: 10, fontWeight: 500 }}>
            {info.status === "success" && info.lastSynced
              ? miniTimeAgo(info.lastSynced)
              : statusLabel[info.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
