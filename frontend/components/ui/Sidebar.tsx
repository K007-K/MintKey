// Dashboard sidebar — matches MintKey reference design exactly
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  const NavItem = ({ href, label, Icon, badge }: {
    href: string; label: string; Icon: React.ElementType; badge?: string;
  }) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
          isActive
            ? "bg-mint-bg text-mint-darker border-l-2 border-mint-dark -ml-px"
            : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        }`}
      >
        <Icon className={`h-[18px] w-[18px] ${isActive ? "text-mint-dark" : "text-text-muted group-hover:text-text-secondary"}`} strokeWidth={1.8} />
        <span className="flex-1">{label}</span>
        {badge && (
          <span className="rounded-full bg-mint-light px-2 py-0.5 text-[10px] font-semibold text-mint-darker">{badge}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden" onClick={toggle} />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-border-default bg-bg-sidebar transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5">
          <MintKeyLogoMark />
        </div>

        {/* Platform section */}
        <nav className="flex-1 overflow-y-auto px-3">
          <div className="mb-1">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Platform
            </span>
          </div>
          <div className="space-y-0.5 mb-6">
            {PLATFORM_NAV.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </div>

          <div className="mb-1">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
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

          {/* User profile */}
          <div className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-light text-sm font-semibold text-mint-darker">
              K
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">Karthik</div>
              <div className="text-xs text-text-muted truncate">karthik@mintkey.io</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
