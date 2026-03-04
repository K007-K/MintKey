// Company brand logos — inline SVG icons matching each company's brand identity
"use client";

interface LogoProps {
  size?: number;
}

/* ── Individual brand logos ──────────────────────────────────── */

function GoogleLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-white border border-[#E5E7EB]" style={{ width: size, height: size }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    </div>
  );
}

function MetaLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#0668E1]" style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.4} viewBox="0 0 36 20" fill="white">
        <path d="M6.5 2C4.5 2 3 4 2 6.5C0.5 10 0 14 0 16c0 2 1 3 2.5 3s3-1.5 5-5c1.5-2.5 3-6 4.5-8.5C13.5 3 15 2 17 2c2.5 0 4 2 4 5.5 0 2-.5 4-1.5 6-1.5 3-3.5 5.5-6 5.5-1.5 0-2.5-1-2.5-2.5h0c0-.5.2-1 .5-1.5l1-1.5c1-1.5 2-3.5 2-5.5 0-1.5-.5-2.5-1.5-2.5s-2 1-3 3L7 13c-1.5 2.5-3 5-5.5 5S0 16.5 0 14"/>
      </svg>
    </div>
  );
}

function AirbnbLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#FF5A5F]" style={{ width: size, height: size }}>
      <svg width={size * 0.5} height={size * 0.55} viewBox="0 0 24 28" fill="white">
        <path d="M12 0C8.5 5 5.5 9 4 12c-2 4-2.5 7-1 9s4 2 7 0c-1.5-1-2.5-2.5-2-4.5.5-1.5 2-2.5 4-2.5s3.5 1 4 2.5c.5 2-.5 3.5-2 4.5 3 2 5.5 2 7 0s1-5-1-9C18.5 9 15.5 5 12 0z"/>
      </svg>
    </div>
  );
}

function StripeLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#635BFF]" style={{ width: size, height: size }}>
      <span className="text-white text-[10px] font-bold tracking-tight" style={{ fontSize: size * 0.25 }}>stripe</span>
    </div>
  );
}

function AmazonLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#232F3E]" style={{ width: size, height: size }}>
      <span className="font-bold" style={{ fontSize: size * 0.45, color: "#FF9900" }}>a</span>
    </div>
  );
}

function MicrosoftLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-white border border-[#E5E7EB]" style={{ width: size, height: size }}>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 21 21">
        <rect x="0" y="0" width="10" height="10" fill="#F25022"/>
        <rect x="11" y="0" width="10" height="10" fill="#7FBA00"/>
        <rect x="0" y="11" width="10" height="10" fill="#00A4EF"/>
        <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
      </svg>
    </div>
  );
}

function AppleLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#333333]" style={{ width: size, height: size }}>
      <svg width={size * 0.45} height={size * 0.55} viewBox="0 0 17 21" fill="white">
        <path d="M14.94 11.13c-.04-3.43 2.8-5.07 2.92-5.15-1.59-2.33-4.07-2.64-4.95-2.68-2.11-.21-4.12 1.24-5.19 1.24-1.07 0-2.72-1.21-4.47-1.18C1.07 3.4-1.03 4.78-.03 7.37c2.14 3.71 1.01 9.21 1.61 10.01.72 1.05 2.14 3.57 4.47 3.5 1.8-.04 2.48-1.16 4.65-1.16 2.17 0 2.8 1.16 4.7 1.13 2.06-.04 3.27-2.22 3.97-3.28 1.25-1.88 1.77-3.71 1.8-3.8-.04-.02-3.45-1.32-3.48-5.26zM11.68 1.68C12.27.95 12.67 0 12.56-.73c-.88.04-1.95.59-2.58 1.33-.57.66-1.07 1.71-.93 2.72.98.08 1.98-.5 2.63-1.64z"/>
      </svg>
    </div>
  );
}

function NetflixLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#E50914]" style={{ width: size, height: size }}>
      <span className="text-white font-bold" style={{ fontSize: size * 0.5 }}>N</span>
    </div>
  );
}

function UberLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#000000]" style={{ width: size, height: size }}>
      <span className="text-white font-bold" style={{ fontSize: size * 0.3 }}>Uber</span>
    </div>
  );
}

function SalesforceLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#00A1E0]" style={{ width: size, height: size }}>
      <svg width={size * 0.6} height={size * 0.45} viewBox="0 0 24 16" fill="white">
        <path d="M10 1a5.5 5.5 0 014.7 2.7 4.5 4.5 0 016.3 4.1A4 4 0 0120 15H5a4.5 4.5 0 01-.6-9A5.5 5.5 0 0110 1z"/>
      </svg>
    </div>
  );
}

function TwitterLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#1DA1F2]" style={{ width: size, height: size }}>
      <svg width={size * 0.5} height={size * 0.4} viewBox="0 0 24 20" fill="white">
        <path d="M24 2.56a9.94 9.94 0 01-2.83.77A4.96 4.96 0 0023.34.4a9.93 9.93 0 01-3.13 1.2A4.93 4.93 0 0016.62 0c-2.73 0-4.94 2.21-4.94 4.94 0 .39.04.77.13 1.13C7.73 5.87 4.1 3.9 1.67.9A4.92 4.92 0 001 3.4c0 1.72.87 3.23 2.2 4.11a4.9 4.9 0 01-2.24-.62v.06c0 2.4 1.7 4.39 3.96 4.85a4.94 4.94 0 01-2.23.08 4.94 4.94 0 004.6 3.43A9.9 9.9 0 010 17.54a13.94 13.94 0 007.55 2.21c9.05 0 14-7.5 14-14 0-.21 0-.42-.02-.63A9.94 9.94 0 0024 2.56z"/>
      </svg>
    </div>
  );
}

function LinkedInLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#0A66C2]" style={{ width: size, height: size }}>
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="white">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/>
      </svg>
    </div>
  );
}

function ShopifyLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#96BF48]" style={{ width: size, height: size }}>
      <svg width={size * 0.4} height={size * 0.5} viewBox="0 0 16 20" fill="white">
        <path d="M13.5 4.2s-.3-.1-.8 0c-.3-1-1-1.8-2-1.8h-.3c-.4-.5-.8-.7-1.2-.7C6.9 1.7 5.8 4.5 5.3 6c-.8.2-1.4.4-1.4.4s-.4.1-.5.5C3.4 7.3 1 18.4 1 18.4l10.2 1.6 5.2-1.3S13.6 4.3 13.5 4.2zM9 4.8V5c-.7.2-1.5.5-2.3.7.5-1.8 1.3-2.7 2-3 .1.3.3 1.2.3 2.1z"/>
      </svg>
    </div>
  );
}

function SlackLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-white border border-[#E5E7EB]" style={{ width: size, height: size }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24">
        <path d="M5.04 15.16a2.53 2.53 0 01-2.52 2.52A2.53 2.53 0 010 15.16a2.53 2.53 0 012.52-2.52h2.52v2.52zm1.27 0a2.53 2.53 0 012.52-2.52 2.53 2.53 0 012.52 2.52v6.32A2.53 2.53 0 018.83 24a2.53 2.53 0 01-2.52-2.52v-6.32z" fill="#E01E5A"/>
        <path d="M8.83 5.04a2.53 2.53 0 01-2.52-2.52A2.53 2.53 0 018.83 0a2.53 2.53 0 012.52 2.52v2.52H8.83zm0 1.27a2.53 2.53 0 012.52 2.52 2.53 2.53 0 01-2.52 2.52H2.52A2.53 2.53 0 010 8.83a2.53 2.53 0 012.52-2.52h6.31z" fill="#36C5F0"/>
        <path d="M18.96 8.83a2.53 2.53 0 012.52-2.52A2.53 2.53 0 0124 8.83a2.53 2.53 0 01-2.52 2.52h-2.52V8.83zm-1.27 0a2.53 2.53 0 01-2.52 2.52 2.53 2.53 0 01-2.52-2.52V2.52A2.53 2.53 0 0115.17 0a2.53 2.53 0 012.52 2.52v6.31z" fill="#2EB67D"/>
        <path d="M15.17 18.96a2.53 2.53 0 012.52 2.52A2.53 2.53 0 0115.17 24a2.53 2.53 0 01-2.52-2.52v-2.52h2.52zm0-1.27a2.53 2.53 0 01-2.52-2.52 2.53 2.53 0 012.52-2.52h6.31A2.53 2.53 0 0124 15.17a2.53 2.53 0 01-2.52 2.52h-6.31z" fill="#ECB22E"/>
      </svg>
    </div>
  );
}

function SpotifyLogo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#1DB954]" style={{ width: size, height: size }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="white">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.52 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.7 1.32.42.18.48.66.24 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-.96-.12-1.08-.6-.12-.48.12-.96.6-1.08 4.38-1.32 9.78-.66 13.5 1.62.36.18.48.78.18 1.14zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.14-.18-1.32-.72-.18-.6.18-1.14.72-1.32 4.2-1.26 11.28-1.02 15.72 1.56.54.3.72 1.02.42 1.56-.3.42-.96.6-1.5.3z"/>
      </svg>
    </div>
  );
}

/* ── Logo Mapper ─────────────────────────────────────────────── */

const LOGO_MAP: Record<string, React.FC<LogoProps>> = {
  google: GoogleLogo,
  meta: MetaLogo,
  airbnb: AirbnbLogo,
  stripe: StripeLogo,
  amazon: AmazonLogo,
  microsoft: MicrosoftLogo,
  apple: AppleLogo,
  netflix: NetflixLogo,
  uber: UberLogo,
  salesforce: SalesforceLogo,
  twitter: TwitterLogo,
  linkedin: LinkedInLogo,
  shopify: ShopifyLogo,
  slack: SlackLogo,
  spotify: SpotifyLogo,
};

export function CompanyLogoIcon({ slug, size = 40 }: { slug: string; size?: number }) {
  const LogoComponent = LOGO_MAP[slug];
  if (LogoComponent) {
    return <LogoComponent size={size} />;
  }
  // Fallback: colored square with first letter
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-[#6B7280] text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {slug.charAt(0).toUpperCase()}
    </div>
  );
}
