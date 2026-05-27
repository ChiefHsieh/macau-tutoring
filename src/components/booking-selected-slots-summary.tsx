"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BookingSlotPick } from "@/lib/booking-slot-picks";
import { slotPickKey } from "@/lib/booking-slot-picks";
import { formatMacauCalendarDateLine } from "@/lib/macau-ymd";

export function BookingSelectedSlotsSummary({
  locale,
  picks,
  onRemove,
}: {
  locale: string;
  picks: BookingSlotPick[];
  onRemove: (pick: BookingSlotPick) => void;
}) {
  const t = useTranslations("Booking");

  if (picks.length === 0) {
    return (
      <p className="rounded-[12px] border border-dashed border-[#1A2456] bg-[#0A0F35]/60 px-3 py-3 text-sm text-[#94a3b8]">
        {t("slotSummaryEmpty")}
      </p>
    );
  }

  return (
    <div className="rounded-[12px] border border-[#1A2456] bg-[#0A0F35] px-3 py-3">
      <p className="text-sm font-medium text-[#F8F9FA]">
        {t("selectedSessionsTitle", { count: picks.length })}
      </p>
      <ul className="mt-2 space-y-2">
        {picks.map((pick) => (
          <li
            key={slotPickKey(pick)}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm"
          >
            <span className="min-w-0 text-[#E2E8F0]">
              <span className="font-medium text-white">
                {formatMacauCalendarDateLine(pick.sessionDate, locale)}
              </span>
              <span className="mx-1.5 text-[#94a3b8]">·</span>
              <span>
                {pick.start_time.slice(0, 5)} – {pick.end_time.slice(0, 5)}
              </span>
            </span>
            <button
              type="button"
              className="shrink-0 rounded-md p-1 text-[#94a3b8] transition-colors hover:bg-white/10 hover:text-[#F8F9FA]"
              aria-label={t("removeSelectedSession")}
              onClick={() => onRemove(pick)}
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
