// NextAuth.js v5 proxy for route protection (Next.js 16 convention)
export { auth as proxy } from "@/auth";

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
