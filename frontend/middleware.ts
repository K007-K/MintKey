// NextAuth.js v5 middleware for route protection
export { auth as middleware } from "@/auth";

export const config = {
  // Protect dashboard and authenticated routes
  matcher: [
    "/dashboard/:path*",
    "/roadmap/:path*",
    "/profile/:path*",
    "/companies/:path*",
    "/company/:path*",
    "/match/:path*",
    "/skills/:path*",
    "/dsa/:path*",
    "/trends/:path*",
    "/simulate/:path*",
    "/coach/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
