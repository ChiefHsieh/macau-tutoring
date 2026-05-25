"use client";

import { useEffect } from "react";
import { isCapacitorNative } from "@/lib/pwa-detect";

const SW_URL = "/sw.js";

export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (isCapacitorNative()) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register(SW_URL, { scope: "/" });
      } catch (err) {
        console.warn("[pwa] service worker registration failed", err);
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", () => void register(), { once: true });
    }
  }, []);

  return null;
}
