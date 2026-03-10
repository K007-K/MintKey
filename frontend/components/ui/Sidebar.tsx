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
        title={label}
        className={`group flex items-center rounded-lg py-2 transition-all duration-200 whitespace-nowrap overflow-hidden ${
          isActive
            ? "bg-mint-bg text-mint-darker font-semibold"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        } ${isOpen ? "gap-2.5 px-3" : "justify-center px-2"}`}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
            isActive
              ? "text-mint-dark"
              : "text-gray-400 group-hover:text-gray-600"
          }`}
          strokeWidth={isActive ? 2.2 : 1.8}
        />
        <span
          className={`text-[13px] font-medium truncate transition-all duration-300 ${
            isOpen ? "w-auto opacity-100" : "w-0 opacity-0"
          }`}
        >
          {label}
        </span>
        {badge && (
          <span
            className={`ml-auto rounded-md bg-mint-light px-1.5 py-0.5 text-[9px] font-bold text-mint-darker tracking-wide transition-all duration-300 ${
              isOpen ? "opacity-100 scale-100" : "opacity-0 scale-0 w-0"
            }`}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-full flex-col border-r border-gray-200 bg-white transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
        isOpen ? "w-[240px]" : "w-[60px]"
      }`}
    >
      {/* Logo + toggle */}
      <div className={`flex items-center border-b border-gray-100 h-14 transition-all duration-300 ${
        isOpen ? "justify-between px-5" : "justify-center px-2"
      }`}>
        <div className="overflow-hidden">
          {isOpen ? <MintKeyLogoMark /> : <MintKeyLogo size={24} />}
        </div>
        <button
          onClick={toggle}
          className={`rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0 ${
            !isOpen ? "absolute right-1.5 top-3.5" : ""
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
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden transition-[padding] duration-300 ${isOpen ? "px-3" : "px-1.5"}`}>
        {/* Platform section header */}
        <div className={`mt-3 mb-1 overflow-hidden transition-all duration-300 ${isOpen ? "h-5 opacity-100 px-3" : "h-0 opacity-0 px-0"}`}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
            Platform
          </span>
        </div>
        {!isOpen && <div className="mt-3" />}
        <div className="space-y-0.5 mb-4">
          {PLATFORM_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        {/* Divider */}
        <div className={`my-2 h-px bg-gray-200 transition-[margin] duration-300 ${isOpen ? "mx-2" : "mx-1"}`} />

        {/* Intelligence section header */}
        <div className={`mb-1 overflow-hidden transition-all duration-300 ${isOpen ? "h-5 opacity-100 px-3" : "h-0 opacity-0 px-0"}`}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
            Intelligence
          </span>
        </div>
        <div className="space-y-0.5">
          {INTELLIGENCE_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className={`border-t border-gray-100 py-3 space-y-0.5 transition-[padding] duration-300 ${
        isOpen ? "px-3" : "px-1.5"
      }`}>
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {/* Sync Now — wired to real APIs */}
        <button
          onClick={handleSyncNow}
          disabled={syncInProgress}
          title={!isOpen ? (syncInProgress ? "Syncing..." : "Sync Now") : undefined}
          className={`mt-2 flex w-full items-center justify-center rounded-lg py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] overflow-hidden whitespace-nowrap ${
            syncInProgress
              ? "bg-gray-400 cursor-wait"
              : "bg-mint-dark hover:bg-mint-darker"
          } ${isOpen ? "gap-2 px-4" : "px-0"}`}
        >
          {syncInProgress ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span className={`transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 w-0"}`}>
            {syncInProgress ? "Syncing..." : "Sync Now"}
          </span>
        </button>

        {/* User profile + Logout */}
        <div className={`mt-3 flex items-center rounded-lg py-2 overflow-hidden transition-all duration-300 ${
          isOpen ? "gap-3 px-3" : "justify-center px-0"
        }`}>
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
          <div className={`flex-1 min-w-0 flex items-center gap-2 transition-all duration-300 ${
            isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
          }`}>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{userName}</div>
              <div className="text-xs text-text-muted truncate">{userEmail}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all shrink-0"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Collapsed logout button */}
        {!isOpen && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-1 flex w-full items-center justify-center rounded-lg py-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
