/** Client-side Web Push subscribe flow (PWA / iOS Home Screen). */

import { createClient } from "@/lib/supabase/client";
import { isCapacitorNative, isIosSafariForPwa, isStandaloneDisplayMode } from "@/lib/pwa-detect";
import { urlBase64ToUint8Array } from "@/lib/web-push-client";

const SW_URL = "/sw.js";

export type WebPushSubscribeResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "not_supported"
        | "not_configured"
        | "not_standalone"
        | "not_logged_in"
        | "permission_denied"
        | "permission_default"
        | "subscribe_failed";
      message?: string;
    };

function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || null;
}

export function canUseWebPushOnThisDevice(): boolean {
  if (typeof window === "undefined") return false;
  if (isCapacitorNative()) return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (!getVapidPublicKey()) return false;
  if (isIosSafariForPwa() && !isStandaloneDisplayMode()) return false;
  return true;
}

export function needsIosHomeScreenInstall(): boolean {
  return isIosSafariForPwa() && !isStandaloneDisplayMode() && !isCapacitorNative();
}

async function registerWebSubscription(subscription: PushSubscription) {
  const res = await fetch("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      platform: "web",
      token: JSON.stringify(subscription.toJSON()),
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Register failed (${res.status})`);
  }
}

/**
 * Subscribe to Web Push. On iOS, `requestPermission` must be true and called from a user click
 * (e.g. button tap); auto-calling on page load does not show the system dialog.
 */
export async function subscribeToWebPush(options?: {
  requestPermission?: boolean;
}): Promise<WebPushSubscribeResult> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "not_supported" };
  }
  if (isCapacitorNative()) {
    return { ok: false, reason: "not_supported" };
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, reason: "not_supported" };
  }

  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) {
    return { ok: false, reason: "not_configured" };
  }

  if (isIosSafariForPwa() && !isStandaloneDisplayMode()) {
    return { ok: false, reason: "not_standalone" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: "not_logged_in" };
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration(SW_URL);
    if (!registration) {
      registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    }
    await navigator.serviceWorker.ready;

    let permission = Notification.permission;

    if (permission === "default") {
      if (!options?.requestPermission) {
        return { ok: false, reason: "permission_default" };
      }
      permission = await Notification.requestPermission();
    }

    if (permission === "denied") {
      return { ok: false, reason: "permission_denied" };
    }
    if (permission !== "granted") {
      return { ok: false, reason: "permission_default" };
    }

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      }));

    await registerWebSubscription(subscription);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "subscribe_failed", message };
  }
}

/** Re-subscribe when permission was already granted (safe on page load). */
export async function syncWebPushIfGranted(): Promise<void> {
  if (!canUseWebPushOnThisDevice()) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  await subscribeToWebPush({ requestPermission: false });
}
