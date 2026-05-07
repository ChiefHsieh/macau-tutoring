"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, ActionPerformed } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";

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

      await LocalNotifications.requestPermissions().catch(() => null);
      await PushNotifications.createChannel({
        id: "messages-high",
        name: "Messages",
        importance: 5,
        visibility: 1,
        sound: "default",
      }).catch(() => null);

      const reg = await PushNotifications.addListener("registration", (token: Token) => {
        registerToken(token.value);
      });
      removeRegistration = () => {
        reg.remove();
      };

      await PushNotifications.addListener("pushNotificationReceived", async (notification) => {
        const title = String(notification.title ?? "New message");
        const body = String(notification.body ?? "");
        const path = String(notification.data?.path ?? `/${locale}/notifications`);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now() % 2147483000,
              title,
              body,
              channelId: "messages-high",
              extra: { path },
            },
          ],
        }).catch(() => null);
      });

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

      await LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
        const path = String(event.notification.extra?.path ?? "").trim();
        if (path.startsWith("/")) {
          router.push(path);
          return;
        }
        router.push(`/${locale}/notifications`);
      });

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
