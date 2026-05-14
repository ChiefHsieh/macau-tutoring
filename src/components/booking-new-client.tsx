"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BookingCreateForm } from "@/components/booking-create-form";
import { BookingAvailabilityCalendar } from "@/components/booking-availability-calendar";
import { BookingSlotPickerRow } from "@/components/booking-slot-picker-row";
import { formatMacauCalendarDateLine } from "@/lib/macau-ymd";

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
  /** Current tutor id from URL / server (data matches this id). */
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

function firstSlotValue(slots: Slot[]): string {
  if (!slots[0]) return "";
  return `${slots[0].start_time}|${slots[0].end_time}`;
}

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

  const [slotValue, setSlotValue] = useState(() => firstSlotValue(slotsForDay));

  useEffect(() => {
    const slots = slotsByDate[sessionDate] ?? [];
    const valid = slots.some((s) => `${s.start_time}|${s.end_time}` === slotValue);
    if (!valid) {
      setSlotValue(firstSlotValue(slots));
    }
  }, [sessionDate, slotsByDate, slotValue]);

  const selectedPick: {
    sessionDate: string;
    start_time: string;
    end_time: string;
  } | null = useMemo(() => {
    if (!slotValue) return null;
    const [start_time, end_time] = slotValue.split("|");
    if (!start_time || !end_time) return null;
    return { sessionDate, start_time, end_time };
  }, [slotValue, sessionDate]);

  const fullScheduleHref = `/${locale}/tutors/${selectedTutorId}#availability`;

  const dateMin = bookingDates[0] ?? "";
  const dateMax = bookingDates.length ? bookingDates[bookingDates.length - 1] : "";

  const slotPickerRow = (
    <BookingSlotPickerRow
      slots={slotsForDay}
      slotValue={slotValue}
      onSlotValueChange={setSlotValue}
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
        {t("selectedDate")}: {formatMacauCalendarDateLine(sessionDate, locale)}
      </p>

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
          selected={selectedPick}
          loading={isPending}
          fullScheduleHref={fullScheduleHref}
          onSelect={(pick) => {
            setSessionDate(pick.sessionDate);
            setSlotValue(`${pick.start_time}|${pick.end_time}`);
            pushFilters(selectedTutorId, pick.sessionDate);
          }}
        />
      ) : null}

      {subjects.length === 0 ? (
        <p className="ui-empty-state mt-2">{t("noSubject")}</p>
      ) : slotsForDay.length === 0 ? (
        <p className="ui-empty-state mt-2">{t("noSlots")}</p>
      ) : (
        <BookingCreateForm
          locale={locale}
          tutorId={selectedTutorId}
          sessionDate={sessionDate}
          slots={slotsForDay}
          subjects={subjects}
          labels={{ bookNow: t("bookNow") }}
          slotValue={slotValue}
          onSlotValueChange={setSlotValue}
          slotDisplay={slotPickerRow}
          submitDisabled={!slotValue || slotsForDay.length === 0}
        />
      )}
    </div>
  );
}
