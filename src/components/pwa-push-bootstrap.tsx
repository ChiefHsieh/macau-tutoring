"use client";

import { useEffect } from "react";
import { syncWebPushIfGranted } from "@/lib/pwa-web-push";

/** On load: only sync subscription if user already granted notification permission. */
export function PwaPushBootstrap() {
  useEffect(() => {
    if (document.readyState === "complete") {
      void syncWebPushIfGranted();
    } else {
      window.addEventListener("load", () => void syncWebPushIfGranted(), { once: true });
    }
  }, []);

  return null;
}
