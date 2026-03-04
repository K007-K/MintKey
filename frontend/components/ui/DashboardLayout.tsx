// Dashboard layout — sidebar + topbar (matches reference design)
"use client";

import Sidebar from "@/components/ui/Sidebar";
import { useSidebarStore } from "@/lib/store";
import { Bell, Maximize2, Menu } from "lucide-react";

export default function DashboardLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const { toggle } = useSidebarStore();

  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border-default bg-bg-card px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary md:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {title || "Good morning, Karthik"}
              </h1>
              {subtitle && (
                <p className="text-sm text-text-muted">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Last synced */}
            <div className="hidden items-center gap-1.5 text-xs text-text-muted sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              Last synced: 14 mins ago
            </div>

            {/* Notification bell */}
            <button className="relative rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors">
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>

            {/* Profile */}
            <button className="flex items-center gap-2 rounded-lg border border-border-default px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover transition-colors">
              <div className="h-6 w-6 rounded-full bg-mint-light flex items-center justify-center text-xs font-semibold text-mint-darker">K</div>
              <span className="hidden sm:inline">Public Profile</span>
            </button>

            {/* Expand */}
            <button className="rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors">
              <Maximize2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
