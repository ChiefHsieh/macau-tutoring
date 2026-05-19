"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { UNIVERSITY_LOGOS, type UniversityLogo } from "@/lib/university-logos";

const LOGO_IMAGE_CLASS =
  "h-12 w-auto max-w-[min(220px,42vw)] object-contain object-center md:h-14 lg:h-[56px]";

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
            sizes="(max-width: 768px) 140px, 220px"
          />
        </li>
      ))}
    </>
  );
}

export function UniversityTutorBanner() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const evaluateOverflow = useCallback(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) return;
    setShouldScroll(measure.scrollWidth > viewport.clientWidth + 1);
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
      className="university-tutor-banner group w-full bg-transparent py-2 md:py-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Partner universities"
    >
      <div className="mx-auto flex w-full max-w-full flex-col items-center gap-4 md:gap-5">
        <p
          className="shrink-0 px-4 text-center text-[18px] font-bold leading-tight tracking-[0.5px] text-[#F8F9FA] md:text-2xl lg:text-[32px]"
          style={{ fontFamily: 'var(--font-geist-sans), "Noto Sans TC", sans-serif' }}
        >
          星級頂尖教育導師來自
        </p>

        <div
          ref={viewportRef}
          className="relative flex h-14 w-full items-center overflow-hidden md:h-16 lg:h-[60px]"
        >
          <ul
            ref={measureRef}
            className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 list-none items-center gap-6 p-0 opacity-0 md:gap-8 lg:gap-12"
            aria-hidden
          >
            <LogoItems logos={UNIVERSITY_LOGOS} keyPrefix="measure-" hideAlt />
          </ul>

          {shouldScroll ? (
            <div className="flex h-full w-full items-center overflow-hidden">
              <ul
                className={`university-marquee-track flex w-max list-none items-center gap-6 p-0 md:gap-8 lg:gap-12 ${isPaused ? "is-paused" : ""}`}
                aria-label="University logos"
              >
                <LogoItems logos={UNIVERSITY_LOGOS} keyPrefix="set1-" hideAlt />
                <LogoItems logos={UNIVERSITY_LOGOS} keyPrefix="set2-" hideAlt />
              </ul>
            </div>
          ) : (
            <ul className="flex h-full w-full list-none items-center justify-center gap-6 p-0 px-4 md:gap-8 lg:gap-12">
              <LogoItems logos={UNIVERSITY_LOGOS} />
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
