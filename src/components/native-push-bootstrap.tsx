"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, ActionPerformed } from "@capacitor/push-notifications";

type NativePushBootstrapProps = {
  locale: string;
};

export function NativePushBootstrap({ locale }: NativePushBootstrapProps) {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeRegistration: (() => void) | null = null;
    let removeActionPerformed: (() => void) | null = null;

    const registerToken = async (token: string) => {
      await fetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, platform: "android" }),
      }).catch(() => null);
    };

    const setup = async () => {
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== "granted") return;

      const reg = await PushNotifications.addListener("registration", (token: Token) => {
        registerToken(token.value);
      });
      removeRegistration = () => {
        reg.remove();
      };

      const action = await PushNotifications.addListener("pushNotificationActionPerformed", (event: ActionPerformed) => {
        const path = String(event.notification.data?.path ?? "").trim();
        if (path.startsWith("/")) {
          router.push(path);
          return;
        }
        router.push(`/${locale}/notifications`);
      });
      removeActionPerformed = () => {
        action.remove();
      };

      await PushNotifications.register();
    };

    void setup();

    return () => {
      removeRegistration?.();
      removeActionPerformed?.();
    };
  }, [locale, router]);

  return null;
}
