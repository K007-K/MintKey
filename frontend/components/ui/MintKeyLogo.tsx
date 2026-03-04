// MintKey SVG logo component — teal key icon matching brand identity
export function MintKeyLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Key head (rounded square with circle) */}
      <rect x="8" y="4" width="18" height="16" rx="4" stroke="#2DD4BF" strokeWidth="3" fill="none" />
      <circle cx="17" cy="12" r="2.5" fill="#2DD4BF" />
      {/* Key shaft */}
      <line x1="17" y1="20" x2="17" y2="36" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
      {/* Key teeth */}
      <line x1="17" y1="26" x2="24" y2="26" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
      <line x1="17" y1="31" x2="22" y2="31" stroke="#2DD4BF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MintKeyLogoMark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <MintKeyLogo size={28} />
      <span className="text-lg font-semibold tracking-tight text-text-primary">Mintkey</span>
    </div>
  );
}
