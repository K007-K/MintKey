// NextAuth.js v5 configuration — GitHub OAuth provider
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, persist GitHub data into the JWT
      if (account && profile) {
        token.githubId = account.providerAccountId;
        token.githubUsername = (profile as { login?: string }).login;
        token.avatar = (profile as { avatar_url?: string }).avatar_url;
        token.accessToken = account.access_token;

        // Register/login user on our backend
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/github`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                github_oauth_id: account.providerAccountId,
                email: token.email,
                name: token.name,
                avatar_url: (profile as { avatar_url?: string }).avatar_url,
                github_username: (profile as { login?: string }).login,
              }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            token.backendToken = data.data?.access_token;
            token.userId = data.data?.user_id;
            token.isOnboarded = data.data?.is_onboarded;
          }
        } catch (err) {
          console.error("Backend auth sync failed:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose custom fields to the client session
      session.user.id = token.userId as string;
      session.user.githubUsername = token.githubUsername as string;
      session.user.isOnboarded = token.isOnboarded as boolean;
      session.backendToken = token.backendToken as string;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnboarded = auth?.user?.isOnboarded;
      const isOnboardingPage = nextUrl.pathname.startsWith("/onboarding");
      const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/auth");
      const isPublic = nextUrl.pathname === "/" || isAuthPage;

      // Public pages — always accessible
      if (isPublic) return true;

      // Not logged in — redirect to login
      if (!isLoggedIn) return false;

      // Logged in but not onboarded — redirect to onboarding
      if (!isOnboarded && !isOnboardingPage) {
        return Response.redirect(new URL("/onboarding", nextUrl));
      }

      // Already onboarded but visiting onboarding — redirect to dashboard
      if (isOnboarded && isOnboardingPage) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
