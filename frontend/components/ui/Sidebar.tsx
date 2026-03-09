// Collapsible dashboard sidebar — icon-only when collapsed
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
      if (githubUsername) {
        promises.push(syncGithub.mutateAsync(githubUsername));
      }
      if (leetcodeUsername) {
        promises.push(syncLeetCode.mutateAsync(leetcodeUsername));
      }

      if (promises.length === 0) {
        // No platforms connected — nothing to sync
        setSyncInProgress(false);
        return;
      }

      await Promise.allSettled(promises);

      // Invalidate all data queries so dashboard refreshes
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      queryClient.invalidateQueries({ queryKey: ["scores"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });

      setLastSyncedAt(new Date().toISOString());
    } catch {
      // Sync failed — still update timestamp
    }
    setSyncInProgress(false);
  };

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
    return (
      <Link
        href={href}
        title={!isOpen ? label : undefined}
        className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? "bg-mint-bg text-mint-darker font-semibold"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        } ${!isOpen ? "justify-center px-2" : ""}`}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 ${
            isActive
              ? "text-mint-dark"
              : "text-gray-400 group-hover:text-gray-600"
          }`}
          strokeWidth={isActive ? 2.2 : 1.8}
        />
        {isOpen && <span className="truncate">{label}</span>}
        {isOpen && badge && (
          <span className="ml-auto rounded-md bg-mint-light px-1.5 py-0.5 text-[9px] font-bold text-mint-darker tracking-wide">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-full flex-col overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-300 ease-in-out ${
        isOpen ? "w-[240px]" : "w-[76px]"
      }`}
    >
      {/* Logo + toggle */}
      <div
        className={`flex items-center border-b border-gray-100 py-4 ${
          isOpen ? "justify-between px-5" : "justify-center px-2"
        }`}
      >
        {isOpen ? (
          <MintKeyLogoMark />
        ) : (
          <MintKeyLogo size={24} />
        )}
        <button
          onClick={toggle}
          className={`rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ${
            !isOpen ? "absolute right-1 top-3" : ""
          }`}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto ${isOpen ? "px-3" : "px-2"}`}>
        {/* Platform section */}
        {isOpen && (
          <div className="mb-1 mt-3">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
              Platform
            </span>
          </div>
        )}
        {!isOpen && <div className="mt-3" />}
        <div className="space-y-0.5 mb-4">
          {PLATFORM_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        {/* Divider when collapsed */}
        {!isOpen && <div className="mx-2 my-2 h-px bg-gray-200" />}

        {/* Intelligence section */}
        {isOpen && (
          <div className="mb-1">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
              Intelligence
            </span>
          </div>
        )}
        <div className="space-y-0.5">
          {INTELLIGENCE_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div
        className={`border-t border-gray-100 py-3 space-y-0.5 ${
          isOpen ? "px-3" : "px-2"
        }`}
      >
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {/* Sync Now button — wired to real APIs */}
        <button
          onClick={handleSyncNow}
          disabled={syncInProgress}
          className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.98] ${
            syncInProgress
              ? "bg-gray-400 cursor-wait"
              : "bg-mint-dark hover:bg-mint-darker"
          } ${isOpen ? "px-4" : "px-0"}`}
          title={!isOpen ? (syncInProgress ? "Syncing..." : "Sync Now") : undefined}
        >
          {syncInProgress ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <svg
              className="h-4 w-4 shrink-0"
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
          {isOpen && (syncInProgress ? "Syncing..." : "Sync Now")}
        </button>

        {/* User profile */}
        <div
          className={`mt-3 flex items-center rounded-lg py-2 group ${
            isOpen ? "gap-3 px-3" : "justify-center px-0"
          }`}
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
              title={!isOpen ? `${userName}\n${userEmail}` : undefined}
            />
          ) : (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-light text-sm font-semibold text-mint-darker"
              title={!isOpen ? `${userName}\n${userEmail}` : undefined}
            >
              {userInitial}
            </div>
          )}
          {isOpen && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {userName}
                </div>
                <div className="text-xs text-text-muted truncate">
                  {userEmail}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
