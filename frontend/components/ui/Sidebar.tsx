// Dashboard sidebar — matches MintKey reference design exactly
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useSidebarStore } from "@/lib/store";
import { MintKeyLogoMark } from "@/components/ui/MintKeyLogo";
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
  { href: "/profile", label: "Profile", Icon: User },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();
  const { data: session } = useSession();

  // User data from NextAuth session
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();
  const userAvatar = session?.user?.image;

  const NavItem = ({ href, label, Icon, badge }: {
    href: string; label: string; Icon: React.ElementType; badge?: string;
  }) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? "bg-mint-bg text-mint-darker font-semibold"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-mint-dark" : "text-gray-400 group-hover:text-gray-600"}`} strokeWidth={isActive ? 2.2 : 1.8} />
        <span className="truncate">{label}</span>
        {badge && (
          <span className="ml-auto rounded-md bg-mint-light px-1.5 py-0.5 text-[9px] font-bold text-mint-darker tracking-wide">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 flex h-full w-[240px] flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <MintKeyLogoMark />
        </div>

        {/* Platform section */}
        <nav className="flex-1 overflow-y-auto px-3">
          <div className="mb-1">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
              Platform
            </span>
          </div>
          <div className="space-y-0.5 mb-6">
            {PLATFORM_NAV.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>

          <div className="mb-1">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
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
        <div className="border-t border-border-light px-3 py-3 space-y-0.5">
          {BOTTOM_NAV.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}

          {/* Sync Now button */}
          <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-mint-dark px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-mint-darker active:scale-[0.98]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Now
          </button>

          {/* User profile — real data from session */}
          <div className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 group">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-light text-sm font-semibold text-mint-darker">
                {userInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">{userName}</div>
              <div className="text-xs text-text-muted truncate">{userEmail}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
