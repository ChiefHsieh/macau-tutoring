export type WebPushSubscriptionJson = {
  endpoint: string;
  expirationTime?: number | null;
  keys?: { p256dh?: string; auth?: string };
};

export function parseWebPushSubscription(token: string): WebPushSubscriptionJson | null {
  try {
    const parsed = JSON.parse(token) as WebPushSubscriptionJson;
    if (!parsed?.endpoint || typeof parsed.endpoint !== "string") return null;
    if (!parsed.keys?.p256dh || !parsed.keys?.auth) return null;
    return parsed;
  } catch {
    return null;
  }
}
