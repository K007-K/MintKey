// Extend NextAuth types with our custom fields
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      githubUsername?: string;
      isOnboarded?: boolean;
    };
    backendToken?: string;
    githubId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubId?: string;
    githubUsername?: string;
    avatar?: string;
    accessToken?: string;
    backendToken?: string;
    userId?: string;
    isOnboarded?: boolean;
  }
}
