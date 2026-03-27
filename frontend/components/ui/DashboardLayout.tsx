// Dashboard layout — sidebar + topbar with dynamic sidebar width
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import ToastContainer from "@/components/ui/ToastContainer";
import { useSidebarStore, usePreferencesStore } from "@/lib/store";
import { useAutoSync } from "@/lib/useAutoSync";
import { Bell, Menu, X, Inbox } from "lucide-react";

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

/* ─── Notification Dropdown ─── */

function NotificationDropdown({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[#e5e7eb] bg-white shadow-lg z-50 overflow-hidden"
      style={{ animation: "fadeInDown 150ms ease-out" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 mb-3">
          <Inbox className="h-5 w-5 text-gray-300" strokeWidth={1.8} />
        </div>
        <p className="text-sm font-medium text-gray-500">No notifications yet</p>
        <p className="text-xs text-gray-400 mt-1 text-center">
          You&apos;ll see sync updates, milestone alerts, and company insights here.
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2.5">
        <p className="text-xs text-gray-400 text-center">
          Configure in{" "}
          <a href="/settings" className="text-teal-500 hover:text-teal-600 font-medium">
            Settings
          </a>
        </p>
      </div>
    </div>
  );
}

/* ─── Main Layout ─── */

export default function DashboardLayout({
  children,
  title,
  subtitle,
  headerAction,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}) {
  const { isOpen, toggle } = useSidebarStore();
  const { lastSyncedAt, syncInProgress } = usePreferencesStore();
  const { data: session } = useSession();
  const router = useRouter();

  // Prevent hydration mismatch — defer localStorage-dependent UI until client mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Notification dropdown state
  const [notifOpen, setNotifOpen] = useState(false);
  const toggleNotif = useCallback(() => setNotifOpen((prev) => !prev), []);
  const closeNotif = useCallback(() => setNotifOpen(false), []);

  // Auto-sync engine — triggers on mount if data is stale
  useAutoSync();

  const userName = session?.user?.name?.split(" ")[0] || "there";
  const userInitial = (session?.user?.name || "U").charAt(0).toUpperCase();
  const userAvatar = session?.user?.image;

  return (
    <div className="flex h-screen bg-bg-page">
      <Sidebar />

      {/* Main content — shifts based on sidebar width (260px expanded, 64px collapsed) */}
      <div
        className="flex flex-1 flex-col overflow-hidden"
        style={{
          marginLeft: isOpen ? 260 : 64,
          transition: "margin-left 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
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
            {headerAction}
            {/* Sync indicator — real timestamp (deferred to avoid SSR mismatch) */}
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

            {/* Notification bell with dropdown */}
            <div className="relative">
              <button
                onClick={toggleNotif}
                className={`relative rounded-lg p-2 transition-colors ${
                  notifOpen
                    ? "bg-gray-100 text-gray-700"
                    : "text-text-muted hover:bg-bg-hover hover:text-text-primary"
                }`}
                title="Notifications"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </button>
              <NotificationDropdown isOpen={notifOpen} onClose={closeNotif} />
            </div>

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

      {/* Toast notifications */}
      <ToastContainer />

      {/* Animation keyframe for notification dropdown */}
      <style jsx global>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
