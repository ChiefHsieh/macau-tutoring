"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BookingCreateForm } from "@/components/booking-create-form";
import { BookingAvailabilityCalendar } from "@/components/booking-availability-calendar";
import { BookingSlotPickerRow } from "@/components/booking-slot-picker-row";
import { BookingSelectedSlotsSummary } from "@/components/booking-selected-slots-summary";
import { formatMacauCalendarDateLine } from "@/lib/macau-ymd";
import { toggleSlotPick, type BookingSlotPick } from "@/lib/booking-slot-picks";

type TutorOption = {
  id: string;
  display_name: string;
  district: string;
  hourly_rate: number;
};

type Slot = { start_time: string; end_time: string };
type TutorSubject = { subject: string; grade_level: string };

type HourCellKind = import("@/lib/tutor-booking-slots").HourCellKind;

type BookingNewClientProps = {
  locale: string;
  tutors: TutorOption[];
  selectedTutorId: string;
  selectedDate: string;
  isTutorLocked: boolean;
  lockedTutorLabel?: string;
  tutorDisplayName: string;
  subjects: TutorSubject[];
  bookingDates: string[];
  slotsByDate: Record<string, Slot[]>;
  hourGridByDate: Record<string, HourCellKind[]>;
};

export function BookingNewClient({
  locale,
  tutors,
  selectedTutorId,
  selectedDate,
  isTutorLocked,
  lockedTutorLabel,
  tutorDisplayName,
  subjects,
  bookingDates,
  slotsByDate,
  hourGridByDate,
}: BookingNewClientProps) {
  const router = useRouter();
  const t = useTranslations("Booking");
  const [isPending, startTransition] = useTransition();
  const [sessionDate, setSessionDate] = useState(selectedDate);
  const [selectedSlots, setSelectedSlots] = useState<BookingSlotPick[]>([]);

  const basePath = useMemo(() => `/${locale}/booking/new`, [locale]);

  const pushFilters = (nextTutorId: string, nextDate: string) => {
    const params = new URLSearchParams();
    if (nextTutorId) params.set("tutorId", nextTutorId);
    if (nextDate) params.set("date", nextDate);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${basePath}?${qs}` : basePath);
    });
  };

  useEffect(() => {
    setSessionDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!bookingDates.length) return;
    if (!bookingDates.includes(sessionDate)) {
      const next = bookingDates.includes(selectedDate) ? selectedDate : bookingDates[0];
      setSessionDate(next);
    }
  }, [bookingDates, selectedDate, sessionDate]);

  const slotsForDay = slotsByDate[sessionDate] ?? [];

  const fullScheduleHref = `/${locale}/tutors/${selectedTutorId}#availability`;

  const dateMin = bookingDates[0] ?? "";
  const dateMax = bookingDates.length ? bookingDates[bookingDates.length - 1] : "";

  const slotPickerRow = (
    <BookingSlotPickerRow
      slots={slotsForDay}
      selectedSlots={selectedSlots}
      onSelectedSlotsChange={setSelectedSlots}
      sessionDate={sessionDate}
    />
  );

  return (
    <div className="booking-flow min-w-0 max-w-full space-y-5 md:space-y-6">
      <h2 className="break-words text-lg font-semibold leading-snug text-[#1D2129] dark:text-white">
        {t("availableSlots")}
      </h2>
      <p className="break-words text-sm text-zinc-600 dark:text-[#94a3b8]">
        {t("selectedTutor")}: {tutorDisplayName}
      </p>
      <p className="break-words text-sm text-zinc-600 dark:text-[#94a3b8]">
        {t("browseDate")}: {formatMacauCalendarDateLine(sessionDate, locale)}
      </p>
      <p className="break-words text-xs text-zinc-500 dark:text-[#64748b]">{t("multiSlotHint")}</p>

      <div className="grid min-w-0 max-w-full gap-3 md:grid-cols-3">
        {isTutorLocked ? (
          <>
            <input type="hidden" name="tutorId" value={selectedTutorId} />
            <div className="flex min-h-12 min-w-0 items-center rounded-md border border-[#D1FAE5] bg-white/95 px-3 py-2 text-left text-sm leading-snug text-[#064E3B] md:min-h-0 md:h-10 md:py-0">
              {lockedTutorLabel}
            </div>
          </>
        ) : (
          <Select
            name="tutorId"
            value={selectedTutorId}
            onChange={(e) => {
              const next = e.target.value;
              setSelectedSlots([]);
              pushFilters(next, sessionDate);
            }}
          >
            {tutors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.display_name} · {item.district} · MOP{item.hourly_rate}
              </option>
            ))}
          </Select>
        )}

        <Input
          type="date"
          name="date"
          min={dateMin || undefined}
          max={dateMax || undefined}
          value={sessionDate}
          onChange={(e) => {
            const next = e.target.value;
            if (!next) return;
            setSessionDate(next);
            pushFilters(selectedTutorId, next);
          }}
          className="md:col-span-1"
        />

        <div className="hidden md:block" />
      </div>

      {bookingDates.length > 0 ? (
        <BookingAvailabilityCalendar
          locale={locale}
          dates={bookingDates}
          slotsByDate={slotsByDate}
          hourGridByDate={hourGridByDate}
          selectedSlots={selectedSlots}
          loading={isPending}
          fullScheduleHref={fullScheduleHref}
          onToggleSlot={(pick) => {
            setSelectedSlots((prev) => toggleSlotPick(prev, pick));
          }}
        />
      ) : null}

      <BookingSelectedSlotsSummary
        locale={locale}
        picks={selectedSlots}
        onRemove={(pick) => setSelectedSlots((prev) => toggleSlotPick(prev, pick))}
      />

      {subjects.length === 0 ? (
        <p className="ui-empty-state mt-2">{t("noSubject")}</p>
      ) : slotsForDay.length === 0 && selectedSlots.length === 0 ? (
        <p className="ui-empty-state mt-2">{t("noSlots")}</p>
      ) : (
        <BookingCreateForm
          locale={locale}
          tutorId={selectedTutorId}
          selectedSlots={selectedSlots}
          subjects={subjects}
          labels={{ bookNow: t("bookNow") }}
          slotDisplay={slotPickerRow}
          submitDisabled={selectedSlots.length === 0}
        />
      )}
    </div>
  );
}
