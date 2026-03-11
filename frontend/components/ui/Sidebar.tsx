// Collapsible dashboard sidebar — smooth animation with opacity transitions
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSidebarStore, usePreferencesStore } from "@/lib/store";
import { useCurrentUser, useSyncGithub, useSyncLeetCode, queryClient } from "@/lib/api";
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
  { href: "/dsa", label: "DSA Tracker", Icon: Code2 },
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
  const { syncInProgress, setSyncInProgress, setLastSyncedAt } = usePreferencesStore();
  const { data: session } = useSession();
  const { data: userData } = useCurrentUser();
  const syncGithub = useSyncGithub();
  const syncLeetCode = useSyncLeetCode();

  const user = userData as Record<string, unknown> | undefined;
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();
  const userAvatar = session?.user?.image;

  // Run sync for all connected platforms
  const handleSyncNow = async () => {
    if (syncInProgress) return;
    setSyncInProgress(true);

    const githubUsername = (user?.github_username as string) || "";
    const leetcodeUsername = (user?.leetcode_username as string) || "";

    try {
      const promises: Promise<unknown>[] = [];
      if (githubUsername) promises.push(syncGithub.mutateAsync(githubUsername));
      if (leetcodeUsername) promises.push(syncLeetCode.mutateAsync(leetcodeUsername));

      if (promises.length === 0) {
        setSyncInProgress(false);
        return;
      }

      await Promise.allSettled(promises);

      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      queryClient.invalidateQueries({ queryKey: ["scores"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      setLastSyncedAt(new Date().toISOString());
    } catch {
      // Sync failed
    }
    setSyncInProgress(false);
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
    const [hovered, setHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = useCallback(() => {
      setHovered(true);
      if (!isOpen) {
        timerRef.current = setTimeout(() => setShowTooltip(true), 300);
      }
    }, [isOpen]);

    const handleMouseLeave = useCallback(() => {
      setHovered(false);
      setShowTooltip(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }, []);

    // Clear tooltip if sidebar opens while hovering
    useEffect(() => {
      if (isOpen) {
        setShowTooltip(false);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
    }, [isOpen]);

    return (
      <>
        <Link
          ref={itemRef}
          href={href}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`group flex items-center h-9 rounded-lg overflow-hidden transition-colors duration-200 whitespace-nowrap ${
            isActive
              ? "bg-[#f0fdfa] text-[#14b8a6] font-semibold"
              : "text-[#374151] hover:bg-[#f3f4f6] hover:text-[#374151]"
          } ${isOpen ? "gap-[10px] px-3" : "justify-center px-0"}`}
        >
          <Icon
            className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
              isActive
                ? "text-[#14b8a6]"
                : "text-[#6b7280] group-hover:text-[#374151]"
            }`}
            strokeWidth={isActive ? 2.2 : 1.8}
          />
          <span
            className="text-sm font-medium truncate transition-all duration-150 ease-out overflow-hidden"
            style={{
              opacity: isOpen ? 1 : 0,
              maxWidth: isOpen ? 160 : 0,
            }}
          >
            {label}
          </span>
          {badge && (
            <span
              className="ml-auto rounded-full border border-[#14b8a6] text-[#14b8a6] bg-transparent px-1.5 py-[1px] text-[10px] font-semibold uppercase tracking-[0.05em] transition-all duration-150 ease-out overflow-hidden"
              style={{
                opacity: isOpen ? 1 : 0,
                maxWidth: isOpen ? 60 : 0,
              }}
            >
              {badge}
            </span>
          )}
        </Link>
        {!isOpen && (
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
      className="fixed left-0 top-0 z-40 flex h-full flex-col border-r border-[#e5e7eb] bg-white overflow-hidden"
      style={{
        width: isOpen ? 240 : 64,
        transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* ─── Logo + toggle ─── */}
      <div
        className="flex items-center border-b border-[#e5e7eb] h-14 shrink-0"
        style={{ padding: isOpen ? "0 16px" : "0 8px" }}
      >
        <div className="overflow-hidden shrink-0">
          {isOpen ? <MintKeyLogoMark /> : <MintKeyLogo size={28} />}
        </div>
        {isOpen && <div className="flex-1" />}
        <button
          onClick={toggle}
          className="rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#6b7280] transition-colors shrink-0"
          style={{
            marginLeft: isOpen ? 0 : "auto",
            marginRight: isOpen ? 0 : "auto",
          }}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <div
            style={{
              transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: isOpen ? "rotate(0deg)" : "rotate(180deg)",
            }}
          >
            <PanelLeftClose className="h-5 w-5" />
          </div>
        </button>
      </div>

      {/* ─── Navigation ─── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ padding: isOpen ? "0 12px" : "0 8px" }}
      >
        {/* Platform section label */}
        <div
          className="overflow-hidden"
          style={{
            padding: isOpen ? "16px 16px 6px 16px" : "16px 0 6px 0",
          }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af] whitespace-nowrap transition-all duration-150 ease-out block"
            style={{
              opacity: isOpen ? 1 : 0,
              maxHeight: isOpen ? 20 : 0,
              overflow: "hidden",
            }}
          >
            Platform
          </span>
          {/* Collapsed: no divider here, just spacing */}
        </div>

        <div className="flex flex-col gap-0.5">
          {PLATFORM_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        {/* ─── Divider between groups (stays visible in collapsed) ─── */}
        <div
          className="h-px bg-[#e5e7eb]"
          style={{
            margin: isOpen ? "8px 0" : "8px 12px",
            transition: "margin 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />

        {/* Intelligence section label */}
        <div
          className="overflow-hidden"
          style={{
            padding: isOpen ? "0 16px 6px 16px" : "0 0 6px 0",
          }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af] whitespace-nowrap transition-all duration-150 ease-out block"
            style={{
              opacity: isOpen ? 1 : 0,
              maxHeight: isOpen ? 20 : 0,
              overflow: "hidden",
            }}
          >
            Intelligence
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          {INTELLIGENCE_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* ─── Bottom section ─── */}
      <div
        className="mt-auto border-t border-[#e5e7eb] shrink-0"
        style={{
          padding: isOpen ? "12px 12px 0 12px" : "12px 8px 0 8px",
          transition: "padding 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="flex flex-col gap-0.5">
          {BOTTOM_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        {/* Sync Now button */}
        <button
          onClick={handleSyncNow}
          disabled={syncInProgress}
          title={!isOpen ? (syncInProgress ? "Syncing..." : "Sync Now") : undefined}
          className={`flex items-center justify-center font-semibold text-white active:scale-[0.98] overflow-hidden whitespace-nowrap ${
            syncInProgress
              ? "bg-gray-400 cursor-wait"
              : "bg-[#14b8a6] hover:opacity-90"
          }`}
          style={{
            marginTop: 8,
            marginBottom: 8,
            borderRadius: 10,
            height: isOpen ? 40 : 40,
            width: isOpen ? "100%" : 40,
            marginLeft: isOpen ? 0 : "auto",
            marginRight: isOpen ? 0 : "auto",
            fontSize: 14,
            gap: isOpen ? 8 : 0,
            transition:
              "width 0.22s cubic-bezier(0.4, 0, 0.2, 1), margin 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {syncInProgress ? (
            <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin" />
          ) : (
            <svg
              className="shrink-0"
              style={{ width: isOpen ? 16 : 18, height: isOpen ? 16 : 18 }}
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
          <span
            className="transition-all duration-150 ease-out overflow-hidden"
            style={{
              opacity: isOpen ? 1 : 0,
              maxWidth: isOpen ? 100 : 0,
            }}
          >
            {syncInProgress ? "Syncing..." : "Sync Now"}
          </span>
        </button>

        {/* User profile row */}
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{
            height: 52,
            padding: isOpen ? "8px 12px" : "8px 0",
            justifyContent: isOpen ? "flex-start" : "center",
            gap: isOpen ? 12 : 0,
            transition:
              "padding 0.22s cubic-bezier(0.4, 0, 0.2, 1), gap 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm font-semibold text-white">
              {userInitial}
            </div>
          )}
          {/* Name + email + logout — fades out in collapsed */}
          <div
            className="flex-1 min-w-0 flex items-center overflow-hidden transition-all duration-150 ease-out"
            style={{
              opacity: isOpen ? 1 : 0,
              maxWidth: isOpen ? 200 : 0,
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#111827] truncate">
                {userName}
              </div>
              <div className="text-[11px] text-[#9ca3af] truncate">
                {userEmail}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg hover:bg-red-50 text-[#9ca3af] hover:text-red-500 transition-all shrink-0"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
