type AnalyticsProps = Record<string, string | number | boolean | undefined | null>;

/**
 * Lightweight client events (dev console + optional beacon to /api/analytics).
 * Extend later with GA4 / PostHog without changing call sites.
 */
export function trackEvent(name: string, props?: AnalyticsProps) {
  if (typeof window === "undefined") return;

  const cleaned: Record<string, string | number | boolean> = {};
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null) continue;
      cleaned[k] = typeof v === "boolean" ? v : typeof v === "number" ? v : String(v);
    }
  }

  const payload = { name, props: cleaned, ts: Date.now() };

  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", payload);
  }

  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch {
    // non-blocking
  }
}
