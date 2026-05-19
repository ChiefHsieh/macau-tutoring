"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UNIVERSITY_LOGOS, type UniversityLogo } from "@/lib/university-logos";

const DESKTOP_MARQUEE_MIN_PX = 768;

function LogoImg({ logo, hideAlt }: { logo: UniversityLogo; hideAlt?: boolean }) {
  return (
    <img
      src={logo.src}
      alt={hideAlt ? "" : logo.alt}
      width={220}
      height={56}
      loading="lazy"
      decoding="async"
      className="university-logo-img"
      draggable={false}
    />
  );
}

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
        <li key={`${keyPrefix}${logo.src}`} className="university-logo-item">
          <LogoImg logo={logo} hideAlt={hideAlt} />
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
  const [useMarquee, setUseMarquee] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const evaluateLayout = useCallback(() => {
    const viewport = viewportRef.current;
    const measure = measureRef.current;
    if (!viewport || !measure) return;
    const isMobile = viewport.clientWidth < DESKTOP_MARQUEE_MIN_PX;
    const overflows = measure.scrollWidth > viewport.clientWidth + 1;
    setUseMarquee(!isMobile && overflows);
  }, []);

  useEffect(() => {
    evaluateLayout();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(() => evaluateLayout());
    observer.observe(viewport);
    if (measureRef.current) observer.observe(measureRef.current);

    window.addEventListener("resize", evaluateLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", evaluateLayout);
    };
  }, [evaluateLayout]);

  return (
    <section
      className="university-tutor-banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label={ariaLabel}
    >
      <div className="university-tutor-banner-inner">
        <p className="university-tutor-banner-title">{title}</p>

        <div
          ref={viewportRef}
          className={`university-logo-viewport ${useMarquee ? "is-marquee" : "is-static"}`}
        >
          <ul ref={measureRef} className="university-logo-measure" aria-hidden>
            <LogoItems logos={UNIVERSITY_LOGOS} keyPrefix="measure-" hideAlt />
          </ul>

          {useMarquee ? (
            <div className="university-logo-marquee-shell">
              <ul
                className={`university-marquee-track ${isPaused ? "is-paused" : ""}`}
                aria-label={ariaLabel}
              >
                <LogoItems logos={UNIVERSITY_LOGOS} keyPrefix="set1-" hideAlt />
                <LogoItems logos={UNIVERSITY_LOGOS} keyPrefix="set2-" hideAlt />
              </ul>
            </div>
          ) : (
            <ul className="university-logo-scroll" aria-label={ariaLabel}>
              <LogoItems logos={UNIVERSITY_LOGOS} />
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
