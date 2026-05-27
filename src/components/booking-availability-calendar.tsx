"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { toMinutes } from "@/lib/availability";
import type { HourCellKind } from "@/lib/tutor-booking-slots";
import { formatMacauWeekdayDay, formatMacauCalendarDateLine } from "@/lib/macau-ymd";
import type { BookingSlotPick } from "@/lib/booking-slot-picks";
import { isHourSelectedForDate } from "@/lib/booking-slot-picks";
import { cn } from "@/lib/utils";

export type SlotPick = BookingSlotPick;

type Slot = { start_time: string; end_time: string };

const QUARTERS = [0, 1, 2, 3, 4, 5] as const;

const HOUR_LABEL_KEYS = ["hourBand0", "hourBand1", "hourBand2", "hourBand3", "hourBand4", "hourBand5"] as const;

function slotForHour(slots: Slot[], hourIndex: number): Slot | undefined {
  return slots.find((s) => Math.floor(toMinutes(s.start_time) / 60) === hourIndex);
}

function HourCell({
  kind,
  selected,
  onPick,
  ariaBookable,
}: {
  kind: HourCellKind;
  selected: boolean;
  onPick: () => void;
  ariaBookable: string;
}) {
  const clickable = kind === "available";
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={(e) => {
        e.stopPropagation();
        if (clickable) onPick();
      }}
      className={cn(
        "booking-avail-hour relative h-8 w-full min-h-0 touch-manipulation rounded-[4px] transition-colors active:opacity-90",
        kind === "off" && "cursor-default bg-[#0A0F35]/90",
        kind === "busy" && "cursor-not-allowed bg-white/[0.08]",
        kind === "available" && "cursor-pointer bg-[#10b981] hover:bg-[#0ea271]",
        selected && "ring-2 ring-[#e5c598] ring-offset-1 ring-offset-[#1e295b]",
      )}
      aria-label={clickable ? ariaBookable : undefined}
    />
  );
}

function CalendarSkeleton({ dayCount }: { dayCount: number }) {
  return (
    <div className="flex animate-pulse gap-2 pt-2">
      <div className="mt-8 w-[3rem] shrink-0 space-y-1 pr-0.5 sm:w-14">
        {QUARTERS.map((q) => (
          <div key={q} className="h-8 rounded bg-white/5" />
        ))}
      </div>
      <div className="flex flex-1 gap-2 overflow-hidden">
        {Array.from({ length: Math.min(dayCount, 7) }).map((_, i) => (
          <div key={i} className="min-w-[5.5rem] flex-1 space-y-1 sm:space-y-2">
            <div className="mx-auto h-4 w-12 rounded bg-white/10" />
            {QUARTERS.map((q) => (
              <div key={q} className="grid grid-cols-4 gap-0.5">
                {Array.from({ length: 4 }).map((__, j) => (
                  <div key={j} className="h-7 rounded bg-white/5 md:h-8" />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookingAvailabilityCalendar({
  locale,
  dates,
  slotsByDate,
  hourGridByDate,
  selectedSlots,
  onToggleSlot,
  fullScheduleHref,
  loading,
  className,
}: {
  locale: string;
  dates: string[];
  slotsByDate: Record<string, Slot[]>;
  hourGridByDate: Record<string, HourCellKind[]>;
  selectedSlots: SlotPick[];
  onToggleSlot: (p: SlotPick) => void;
  fullScheduleHref: string;
  loading?: boolean;
  className?: string;
}) {
  const t = useTranslations("Booking");
  const ariaBookable = t("ariaSlotBookable");

  return (
    <section
      className={cn(
        "w-full min-w-0 max-w-full rounded-[12px] border border-[#1A2456] bg-[#1e295b] p-3 shadow-lg shadow-black/30 sm:p-4 md:p-5",
        className,
      )}
      aria-label={t("slotCalendarAria")}
    >
          <div className="mb-3 border-b border-white/10 pb-3">
        <h3 className="text-base font-semibold leading-snug text-white">{t("slotCalendarSectionTitle")}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[#94a3b8] sm:text-sm">{t("slotCalendarHint")}</p>
      </div>

      {loading ? (
        <CalendarSkeleton dayCount={dates.length} />
      ) : (
        <>
          <div className="flex max-h-[min(62dvh,520px)] w-full min-w-0 gap-1 sm:max-h-[min(70vh,560px)]">
            <div className="mt-9 w-[3rem] shrink-0 pr-0.5 text-[10px] leading-none text-[#94a3b8] sm:w-14 sm:text-[11px] md:mt-10 md:text-xs">
              {QUARTERS.map((q) => (
                <div key={q} className="mb-[3px] flex h-8 items-center md:h-8">
                  <span className="block whitespace-nowrap">{t(HOUR_LABEL_KEYS[q])}</span>
                </div>
              ))}
            </div>
            <div
              className={cn(
                "min-w-0 flex-1 touch-pan-x overflow-x-auto overscroll-x-contain scroll-smooth pb-3 pl-0.5 pr-3 pt-0.5 [-webkit-overflow-scrolling:touch]",
                "[scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.45)_rgba(10,15,53,0.9)]",
                "[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#94a3b8]/35",
                "[&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0A0F35]",
              )}
            >
              <div className="flex min-w-min snap-x snap-mandatory gap-2 pr-2 sm:gap-2.5 sm:pr-4">
                {dates.map((d) => {
                  const grid = hourGridByDate[d] ?? Array(24).fill("off" as HourCellKind);
                  const slots = slotsByDate[d] ?? [];
                  return (
                    <div
                      key={d}
                      className="w-[5.5rem] shrink-0 snap-start sm:w-[6.75rem] md:w-[7.25rem]"
                    >
                      <div className="mb-2 min-h-[2.75rem] text-center sm:min-h-[2.5rem]">
                        <p className="text-[13px] font-medium leading-tight text-white sm:text-xs">
                          {formatMacauWeekdayDay(d, locale)}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-[#94a3b8] sm:text-[10px]">
                          {formatMacauCalendarDateLine(d, locale)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 sm:gap-[3px]">
                        {QUARTERS.map((qi) => (
                          <div key={qi} className="grid grid-cols-4 gap-1 sm:gap-[3px]">
                            {[0, 1, 2, 3].map((k) => {
                              const hour = qi * 4 + k;
                              const kind = grid[hour] ?? "off";
                              const isSel = isHourSelectedForDate(selectedSlots, d, hour);
                              return (
                                <HourCell
                                  key={hour}
                                  kind={kind}
                                  selected={isSel}
                                  ariaBookable={ariaBookable}
                                  onPick={() => {
                                    const slot = slotForHour(slots, hour);
                                    if (!slot) return;
                                    onToggleSlot({
                                      sessionDate: d,
                                      start_time: slot.start_time,
                                      end_time: slot.end_time,
                                    });
                                  }}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-3 text-center">
            <Link
              href={fullScheduleHref}
              className="text-xs font-medium text-[#e5c598] underline-offset-2 hover:underline"
            >
              {t("fullScheduleLink")}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
