"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { UNIVERSITY_LOGOS, type UniversityLogo } from "@/lib/university-logos";

const MOBILE_MARQUEE_BREAKPOINT_PX = 768;

const LOGO_IMAGE_CLASS =
  "h-9 w-auto max-w-[min(112px,26vw)] object-contain object-center sm:h-10 sm:max-w-[min(140px,32vw)] md:h-12 md:max-w-[min(180px,36vw)] lg:h-14 lg:max-w-[min(220px,42vw)]";

function LogoItems({
  logos,
  keyPrefix = "",
  hideAlt,
}: {
  logos: UniversityLogo[];
  keyPrefix?: string;
  hideAlt?: boolean;
}) {
  return (
    <>
      {logos.map((logo) => (
        <li key={`${keyPrefix}${logo.src}`} className="flex shrink-0 items-center">
          <Image
            src={logo.src}
            alt={hideAlt ? "" : logo.alt}
            width={240}
            height={56}
            unoptimized
            className={LOGO_IMAGE_CLASS}
            sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, 220px"
          />
        </li>
      ))}
    </>
  );
}

type UniversityTutorBannerProps = {
  title: string;
  ariaLabel: string;
};

export function UniversityTutorBanner({ title, ariaLabel }: UniversityTutorBannerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const [shouldScroll, setShouldScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const evaluateOverflow = useCallback(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) return;
    const isNarrow = viewport.clientWidth < MOBILE_MARQUEE_BREAKPOINT_PX;
    setShouldScroll(isNarrow || measure.scrollWidth > viewport.clientWidth + 1);
  }, []);

  useEffect(() => {
    evaluateOverflow();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => evaluateOverflow());
    observer.observe(viewport);
    if (measureRef.current) observer.observe(measureRef.current);

    window.addEventListener("resize", evaluateOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", evaluateOverflow);
    };
  }, [evaluateOverflow]);

  return (
    <section
      className="university-tutor-banner group -mx-1 w-full max-w-[100vw] overflow-x-clip py-2 sm:mx-0 md:py-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      aria-label={ariaLabel}
    >
      <div className="mx-auto flex w-full min-w-0 max-w-full flex-col items-center gap-3 sm:gap-4 md:gap-5">
        <p
          className="max-w-[20rem] shrink-0 px-3 text-center text-base font-bold leading-snug tracking-[0.02em] text-balance text-[#F8F9FA] sm:max-w-[28rem] sm:px-4 sm:text-lg md:max-w-none md:text-2xl md:leading-tight md:tracking-[0.5px] lg:text-[32px]"
          style={{ fontFamily: 'var(--font-geist-sans), "Noto Sans TC", sans-serif' }}
        >
          {title}
        </p>

        <div
          ref={viewportRef}
          className="relative flex min-h-[44px] w-full min-w-0 items-center overflow-hidden sm:min-h-[48px] md:min-h-[56px] lg:min-h-[60px]"
        >
          <ul
            ref={measureRef}
            className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 list-none items-center gap-4 p-0 opacity-0 sm:gap-6 md:gap-8 lg:gap-12"
            aria-hidden
          >
            <LogoItems logos={UNIVERSITY_LOGOS} keyPrefix="measure-" hideAlt />
          </ul>

          {shouldScroll ? (
            <div className="flex h-full w-full min-w-0 items-center overflow-hidden">
              <ul
                className={`university-marquee-track flex w-max list-none items-center gap-4 p-0 sm:gap-6 md:gap-8 lg:gap-12 ${isPaused ? "is-paused" : ""}`}
                aria-label={ariaLabel}
              >
                <LogoItems logos={UNIVERSITY_LOGOS} keyPrefix="set1-" hideAlt />
                <LogoItems logos={UNIVERSITY_LOGOS} keyPrefix="set2-" hideAlt />
              </ul>
            </div>
          ) : (
            <ul className="flex h-full w-full min-w-0 list-none items-center justify-center gap-4 p-0 px-2 sm:gap-6 sm:px-4 md:gap-8 lg:gap-12">
              <LogoItems logos={UNIVERSITY_LOGOS} />
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
