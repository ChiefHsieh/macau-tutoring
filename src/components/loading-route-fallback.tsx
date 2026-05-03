"use client";

import { usePathname } from "next/navigation";

/**
 * Shown by `app/[locale]/loading.tsx` while the next route segment is loading.
 */
export function LoadingRouteFallback() {
  const pathname = usePathname();
  const isEn = pathname?.startsWith("/en") ?? false;
  const label = isEn ? "Loading…" : "載入中…";
  const hint = isEn ? "Please wait a moment." : "請稍候";

  return (
    <div
      className="fixed inset-0 z-[9980] flex items-center justify-center bg-[#000225]/55 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-4 max-w-sm rounded-2xl border border-[#2D4263] bg-[#0a0f35] px-8 py-6 text-center shadow-2xl shadow-black/40">
        <div
          className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#E6C699] border-t-transparent"
          aria-hidden
        />
        <p className="text-base font-semibold text-[#F8F9FA]">{label}</p>
        <p className="mt-1 text-sm text-[#94A3B8]">{hint}</p>
      </div>
    </div>
  );
}
