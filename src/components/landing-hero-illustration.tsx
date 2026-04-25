type LandingHeroIllustrationProps = {
  className?: string;
  caption?: string;
};

/** Decorative hero art (no external asset); matches education / trust tone from UI guideline. */
export function LandingHeroIllustration({ className = "", caption }: LandingHeroIllustrationProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#F2F3F5] bg-gradient-to-br from-[#F5F8FF] via-white to-[#E8F0FF] p-6 shadow-sm ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 400 280" className="h-auto w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000225" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000225" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect x="24" y="32" width="352" height="200" rx="16" fill="url(#heroGrad)" />
        <rect x="48" y="56" width="120" height="14" rx="7" fill="#000225" fillOpacity="0.35" />
        <rect x="48" y="82" width="200" height="10" rx="5" fill="#4E5969" fillOpacity="0.2" />
        <rect x="48" y="98" width="160" height="10" rx="5" fill="#4E5969" fillOpacity="0.15" />
        <circle cx="92" cy="168" r="28" fill="#000225" fillOpacity="0.9" />
        <path d="M82 168 L90 176 L104 158" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="140" y="146" width="180" height="12" rx="6" fill="#1D2129" fillOpacity="0.12" />
        <rect x="140" y="168" width="140" height="12" rx="6" fill="#1D2129" fillOpacity="0.08" />
        <rect x="140" y="190" width="100" height="12" rx="6" fill="#1D2129" fillOpacity="0.06" />
        <circle cx="300" cy="96" r="8" fill="#FF7D00" fillOpacity="0.85" />
        <circle cx="324" cy="120" r="5" fill="#00B42A" fillOpacity="0.7" />
      </svg>
      {caption ? <p className="mt-2 text-center text-xs text-zinc-500">{caption}</p> : null}
    </div>
  );
}
