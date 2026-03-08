// React Query + NextAuth Session provider wrapper for MintKey
"use client";

import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";
import { queryClient, setAuthToken, clearAuthToken } from "@/lib/api";

/**
 * Syncs the backend JWT from NextAuth session → localStorage
 * so the Axios interceptor can attach it to all API requests.
 */
function TokenSync({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.backendToken) {
      setAuthToken(session.backendToken);
    } else if (status === "unauthenticated") {
      clearAuthToken();
    }
  }, [session?.backendToken, status]);

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

