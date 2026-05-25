import webpush, { type PushSubscription } from "web-push";
import { getVapidPrivateKey, getVapidPublicKey, getVapidSubject, isWebPushConfigured } from "@/lib/vapid-config";
import { parseWebPushSubscription } from "@/lib/web-push-subscription";

export type WebPushPayload = {
  title: string;
  body: string;
  url: string;
};

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();
  if (!publicKey || !privateKey) {
    throw new Error("Web Push VAPID keys are not configured.");
  }
  webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);
  vapidConfigured = true;
}

export function isExpiredWebPushError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { statusCode?: number }).statusCode;
  return code === 410 || code === 404;
}

export async function sendWebPushNotification(
  subscriptionToken: string,
  payload: WebPushPayload,
): Promise<{ ok: boolean; statusCode?: number; body?: string }> {
  if (!isWebPushConfigured()) {
    return { ok: false, body: "VAPID not configured" };
  }

  const subscription = parseWebPushSubscription(subscriptionToken);
  if (!subscription) {
    return { ok: false, body: "Invalid subscription JSON" };
  }

  ensureVapidConfigured();

  try {
    await webpush.sendNotification(subscription as PushSubscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 24,
    });
    return { ok: true, statusCode: 201 };
  } catch (err) {
    const statusCode =
      err && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;
    const body =
      err && typeof err === "object" && "body" in err
        ? String((err as { body?: string }).body ?? "").slice(0, 400)
        : err instanceof Error
          ? err.message
          : "Unknown error";
    return { ok: false, statusCode, body };
  }
}
