// Dashboard layout — sidebar + topbar with dynamic sidebar width
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import { useSidebarStore, usePreferencesStore } from "@/lib/store";
import { Bell, Menu } from "lucide-react";

/** Format a relative time string like "3 mins ago" */
function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return "Just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const { isOpen, toggle } = useSidebarStore();
  const { lastSyncedAt, syncInProgress } = usePreferencesStore();
  const { data: session } = useSession();
  const router = useRouter();

  // Prevent hydration mismatch — defer localStorage-dependent UI until client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const userName = session?.user?.name?.split(" ")[0] || "there";
  const userInitial = (session?.user?.name || "U").charAt(0).toUpperCase();
  const userAvatar = session?.user?.image;

  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />

      {/* Main content — shifts based on sidebar width */}
      <div
        className="flex flex-1 flex-col overflow-hidden transition-[margin-left] duration-300 ease-in-out"
        style={{ marginLeft: isOpen ? 240 : 60 }}
      >
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-6 py-3.5">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={toggle}
              className="rounded-lg p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary md:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {title || `Good morning, ${userName}`}
              </h1>
              {subtitle && (
                <p className="text-sm text-text-muted">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Last synced — real timestamp (deferred to avoid SSR mismatch) */}
            <div className="hidden items-center gap-1.5 text-xs text-text-muted sm:flex">
              {!mounted ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                  Not synced yet
                </>
              ) : syncInProgress ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Syncing...
                </>
              ) : (
                <>
                  <span className={`h-1.5 w-1.5 rounded-full ${lastSyncedAt ? "bg-green-500" : "bg-gray-300"}`} />
                  {lastSyncedAt ? `Last synced: ${timeAgo(lastSyncedAt)}` : "Not synced yet"}
                </>
              )}
            </div>

            {/* Notification bell */}
            <button className="relative rounded-lg p-2 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors">
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
            </button>

            {/* Profile — navigates to /profile */}
            <button
              onClick={() => router.push("/profile")}
              className="flex items-center gap-2 rounded-lg border border-border-default px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-hover transition-colors"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-mint-light flex items-center justify-center text-xs font-semibold text-mint-darker">
                  {userInitial}
                </div>
              )}
              <span className="hidden sm:inline">My Profile</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
