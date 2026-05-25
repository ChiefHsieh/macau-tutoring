"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isCapacitorNative, isIosSafariForPwa, isStandaloneDisplayMode } from "@/lib/pwa-detect";
import { urlBase64ToUint8Array } from "@/lib/web-push-client";

const SW_URL = "/sw.js";
const PUSH_PROMPT_KEY = "astar-pwa-push-prompted-v1";

function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || null;
}

function canAttemptWebPushSubscribe(): boolean {
  if (typeof window === "undefined") return false;
  if (isCapacitorNative()) return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (!getVapidPublicKey()) return false;
  if (isIosSafariForPwa() && !isStandaloneDisplayMode()) return false;
  return true;
}

async function registerWebSubscription(subscription: PushSubscription) {
  await fetch("/api/push/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      platform: "web",
      token: JSON.stringify(subscription.toJSON()),
    }),
  });
}

export function PwaPushBootstrap() {
  useEffect(() => {
    if (!canAttemptWebPushSubscribe()) return;

    const vapidPublicKey = getVapidPublicKey();
    if (!vapidPublicKey) return;

    let cancelled = false;

    const run = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      try {
        let registration = await navigator.serviceWorker.getRegistration(SW_URL);
        if (!registration) {
          registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
        }
        await navigator.serviceWorker.ready;

        let permission = Notification.permission;
        if (permission === "default") {
          try {
            if (localStorage.getItem(PUSH_PROMPT_KEY) === "1") return;
            localStorage.setItem(PUSH_PROMPT_KEY, "1");
          } catch {
            /* private mode */
          }
          permission = await Notification.requestPermission();
        }
        if (permission !== "granted" || cancelled) return;

        const existing = await registration.pushManager.getSubscription();
        const subscription =
          existing ??
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
          }));

        await registerWebSubscription(subscription);
      } catch (err) {
        console.warn("[pwa-push] subscribe failed", err);
      }
    };

    if (document.readyState === "complete") {
      void run();
    } else {
      window.addEventListener("load", () => void run(), { once: true });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
