"use client";

import NextTopLoader from "nextjs-toploader";

/**
 * Top progress bar on client-side navigations (App Router).
 * z-index below mobile menu (10000+) so the drawer stays on top when open.
 */
export function NavigationTopLoader() {
  return (
    <NextTopLoader
      color="#E6C699"
      height={3}
      showSpinner
      speed={200}
      crawlSpeed={200}
      shadow="0 0 12px rgba(230, 198, 153, 0.45)"
      zIndex={9990}
    />
  );
}
