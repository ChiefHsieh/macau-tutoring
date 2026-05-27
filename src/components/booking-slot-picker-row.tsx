"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { isSlotPickSelected, slotPickKey, toggleSlotPick, type BookingSlotPick } from "@/lib/booking-slot-picks";

type Slot = { start_time: string; end_time: string };

function slotToPick(sessionDate: string, slot: Slot): BookingSlotPick {
  return { sessionDate, start_time: slot.start_time, end_time: slot.end_time };
}

export function BookingSlotPickerRow({
  slots,
  selectedSlots,
  onSelectedSlotsChange,
  sessionDate,
}: {
  slots: Slot[];
  selectedSlots: BookingSlotPick[];
  onSelectedSlotsChange: (picks: BookingSlotPick[]) => void;
  sessionDate: string;
}) {
  const t = useTranslations("Booking");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const slotsSig = useMemo(() => slots.map((s) => slotPickKey(slotToPick(sessionDate, s))).join(","), [slots, sessionDate]);

  const selectedForDay = useMemo(
    () => selectedSlots.filter((p) => p.sessionDate === sessionDate),
    [selectedSlots, sessionDate],
  );

  useEffect(() => {
    setOpen(false);
  }, [sessionDate, slotsSig]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-[8px] px-1 py-2 text-left text-sm outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-[#e5c598]/50 md:min-h-0 md:px-0.5 md:py-1"
        aria-expanded={open}
        aria-haspopup="listbox"
        title={t("slotPickerRowTitle")}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="min-w-0 flex-1">
          {selectedForDay.length > 0 ? (
            <span>
              <span className="text-[#94a3b8]">{t("selectedForDayLabel", { count: selectedForDay.length })}</span>{" "}
              <span className="font-medium text-white">{t("slotPickerTapToEdit")}</span>
            </span>
          ) : (
            <span className="text-[#94a3b8]">{t("slotPickerAddForDay")}</span>
          )}
        </span>
        <span className="shrink-0 text-[#94a3b8]" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && slots.length > 0 ? (
        <ul
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+6px)] z-[100] max-h-[50dvh] overflow-y-auto rounded-[12px] border border-[#1A2456] bg-[#1e295b] py-1 shadow-xl shadow-black/40 md:max-h-56",
            "[scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.45)_rgba(10,15,53,0.9)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#94a3b8]/35 [&::-webkit-scrollbar-track]:bg-[#0A0F35]",
            "pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]",
          )}
          role="listbox"
          aria-label={t("slotPickerListAria")}
          aria-multiselectable="true"
        >
          {slots.map((slot) => {
            const pick = slotToPick(sessionDate, slot);
            const active = isSlotPickSelected(selectedSlots, pick);
            return (
              <li key={slotPickKey(pick)} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-[#F8F9FA] transition-colors hover:bg-white/[0.06]",
                    active && "bg-white/[0.08] font-medium text-[#e5c598]",
                  )}
                  onClick={() => {
                    onSelectedSlotsChange(toggleSlotPick(selectedSlots, pick));
                  }}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                      active ? "border-[#e5c598] bg-[#e5c598] text-[#000225]" : "border-[#94a3b8]/60",
                    )}
                    aria-hidden
                  >
                    {active ? "✓" : ""}
                  </span>
                  {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
