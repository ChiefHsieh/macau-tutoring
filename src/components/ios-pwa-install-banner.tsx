"use client";

import { useEffect, useState } from "react";
import { Share2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { shouldShowIosInstallBanner } from "@/lib/pwa-detect";

const DISMISS_KEY = "astar-pwa-ios-install-dismissed-v1";

export function IosPwaInstallBanner() {
  const t = useTranslations("Pwa");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldShowIosInstallBanner()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* private mode */
    }
    setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label={t("iosBannerAria")}
      className="rounded-xl border-2 border-[#E6C699]/60 bg-gradient-to-r from-[#101742] via-[#0f2c59] to-[#101742] px-4 py-3.5 shadow-lg shadow-black/30 ring-1 ring-[#E6C699]/25"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E6C699]/45 bg-[#E6C699]/15 text-[#E6C699]"
          aria-hidden
        >
          <Share2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug text-[#F8F9FA] md:text-base">{t("iosBannerTitle")}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#94A3B8] md:text-sm">{t("iosBannerBody")}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-[#E2E8F0] md:text-sm">
            <li>{t("iosStep1")}</li>
            <li>{t("iosStep2")}</li>
            <li>{t("iosStep3")}</li>
          </ol>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md p-1.5 text-[#94A3B8] transition-colors hover:bg-[#2D4263] hover:text-[#F8F9FA]"
          aria-label={t("iosBannerDismiss")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
