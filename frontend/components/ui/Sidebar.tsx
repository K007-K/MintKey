// Dashboard sidebar component — shared across all authenticated pages
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/companies", label: "Companies", icon: "🏢" },
  { href: "/roadmap", label: "Roadmap", icon: "🗺️" },
  { href: "/skills", label: "Skill Graph", icon: "🧠" },
  { href: "/dsa", label: "DSA Tracker", icon: "💻" },
  { href: "/trends", label: "Trends", icon: "📈" },
  { href: "/coach", label: "AI Coach", icon: "🤖" },
  { href: "/simulate", label: "Simulator", icon: "🎯" },
];

const BOTTOM_ITEMS = [
  { href: "/profile", label: "Profile", icon: "👤" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggle}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border/30 bg-bg-surface/95 backdrop-blur-xl transition-transform duration-300 md:relative md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-border/20 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-indigo to-accent-violet">
            <span className="text-lg font-bold text-white">M</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">MintKey</span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-accent-indigo/10 text-accent-indigo"
                      : "text-text-muted hover:bg-bg-elevated/50 hover:text-text-primary"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom nav */}
        <div className="border-t border-border/20 px-3 py-4 space-y-1">
          {BOTTOM_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent-indigo/10 text-accent-indigo"
                    : "text-text-muted hover:bg-bg-elevated/50 hover:text-text-primary"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
