export function Logo({ size = 28 }) {
  return (
    <span className="inline-flex items-center gap-2 font-display font-semibold tracking-tight">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7c3aed" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#lg)" />
        <path d="M9 22V10h11v3h-7v3h6v3h-6v3z" fill="#fff" />
      </svg>
      <span className="text-[1.05rem]">FundSight<span className="text-primary">AI</span></span>
    </span>
  )
}
