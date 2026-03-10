// React Query + NextAuth Session provider wrapper for MintKey
"use client";

import { useEffect, useRef } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession, signIn } from "next-auth/react";
import { queryClient, api, setAuthToken, clearAuthToken } from "@/lib/api";

/**
 * Decode a JWT payload and return the exp timestamp (in seconds).
 * Returns 0 if the token is invalid.
 */
function getTokenExpiry(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp || 0;
  } catch {
    return 0;
  }
}

/**
 * Syncs the backend JWT from NextAuth session → localStorage.
 * If the token is expired, directly calls the backend auth endpoint
 * to get a fresh token without waiting for NextAuth to refresh.
 */
function TokenSync({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || !session) {
      if (status === "unauthenticated") clearAuthToken();
      return;
    }

    const backendToken = session.backendToken as string | undefined;

    if (backendToken) {
      const expiry = getTokenExpiry(backendToken);
      const now = Math.floor(Date.now() / 1000);

      if (expiry > now + 60) {
        // Token is valid (more than 1 min left) — sync to localStorage
        setAuthToken(backendToken);
        return;
      }
    }

    // Token is missing or expired — fetch a fresh one from backend directly
    if (refreshingRef.current) return;
    refreshingRef.current = true;

    const githubOAuthId = session.githubId;
    const githubUsername = session.user?.githubUsername;

    (async () => {
      try {
        // Call backend auth endpoint directly to get a fresh JWT
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/auth/github`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              github_oauth_id: githubOAuthId,
              email: session.user?.email,
              name: session.user?.name,
              avatar_url: session.user?.image,
              github_username: githubUsername,
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const freshToken = data.data?.access_token;
          if (freshToken) {
            setAuthToken(freshToken);
            // Also trigger NextAuth to update its session with the new token
            await update();
          }
        }
      } catch (err) {
        console.error("TokenSync: failed to refresh backend token:", err);
      } finally {
        refreshingRef.current = false;
      }
    })();
  }, [session, status, update]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TokenSync>{children}</TokenSync>
      </QueryClientProvider>
    </SessionProvider>
  );
}
