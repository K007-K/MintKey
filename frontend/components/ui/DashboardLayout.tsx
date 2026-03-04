// Dashboard layout — wraps all authenticated pages with sidebar + topbar
"use client";

import Sidebar from "@/components/ui/Sidebar";
import { useSidebarStore } from "@/lib/store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toggle } = useSidebarStore();

  return (
    <div className="flex h-screen bg-bg-base">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border/20 bg-bg-surface/50 px-6 py-3 backdrop-blur-lg">
          <button
            onClick={toggle}
            className="rounded-lg p-2 text-text-muted hover:bg-bg-elevated/50 md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-indigo to-accent-violet" />
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
