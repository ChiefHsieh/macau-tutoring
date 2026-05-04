"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { CalendarApi, DateSelectArg, EventClickArg, EventInput } from "@fullcalendar/core";
import { toast } from "sonner";
import {
  deleteOneOffSlotFromCalendarAction,
  deleteRecurringSlotFromCalendarAction,
  saveOneOffSlotFromCalendarAction,
  saveRecurringSlotFromCalendarAction,
} from "@/app/[locale]/tutor/availability/actions";
import { slotRangeFromSelection } from "@/lib/availability-slot-selection";
import { Button } from "@/components/ui/button";

export type TutorAvailabilityCalendarLabels = {
  dragHint: string;
  slotSaved: string;
  slotSavedOneOff: string;
  slotDeleted: string;
  deleteRecurringConfirm: string;
  deleteOneOffConfirm: string;
  cantDeleteBooked: string;
  modeTitle: string;
  modeDescription: string;
  modeRecurring: string;
  modeOneOff: string;
  modeCancel: string;
  invalidRange: string;
};

type PendingSlot = {
  day_of_week: number;
  session_date: string;
  start_time: string;
  end_time: string;
  summaryLine: string;
  calendarApi: CalendarApi;
};

type TutorAvailabilityCalendarProps = {
  events: EventInput[];
  locale: string;
  weekdayNames: string[];
  labels: TutorAvailabilityCalendarLabels;
};

export function TutorAvailabilityCalendar({
  events,
  locale,
  weekdayNames,
  labels,
}: TutorAvailabilityCalendarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choice, setChoice] = useState<PendingSlot | null>(null);

  const closeChoice = () => {
    choice?.calendarApi.unselect();
    setChoice(null);
  };

  const onSelect = (info: DateSelectArg) => {
    const mapped = slotRangeFromSelection(info.start, info.end);
    if (!mapped) {
      toast.error(labels.invalidRange);
      info.view.calendar.unselect();
      return;
    }

    const wn = weekdayNames[mapped.day_of_week] ?? String(mapped.day_of_week);
    const st = mapped.start_time.slice(0, 5);
    const en = mapped.end_time.slice(0, 5);
    const summaryLine = `${wn} · ${mapped.session_date} · ${st}–${en}`;

    setChoice({
      day_of_week: mapped.day_of_week,
      session_date: mapped.session_date,
      start_time: mapped.start_time,
      end_time: mapped.end_time,
      summaryLine,
      calendarApi: info.view.calendar,
    });
  };

  const saveRecurring = () => {
    if (!choice) return;
    const { day_of_week, start_time, end_time, calendarApi } = choice;
    startTransition(async () => {
      const res = await saveRecurringSlotFromCalendarAction(locale, day_of_week, start_time, end_time);
      calendarApi.unselect();
      setChoice(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(labels.slotSaved);
      router.refresh();
    });
  };

  const saveOneOff = () => {
    if (!choice) return;
    const { session_date, start_time, end_time, calendarApi } = choice;
    startTransition(async () => {
      const res = await saveOneOffSlotFromCalendarAction(locale, session_date, start_time, end_time);
      calendarApi.unselect();
      setChoice(null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(labels.slotSavedOneOff);
      router.refresh();
    });
  };

  const onEventClick = (info: EventClickArg) => {
    const id = String(info.event.id ?? "");

    if (id.startsWith("availability-")) {
      const rowId = id.slice("availability-".length);
      if (!window.confirm(labels.deleteRecurringConfirm)) {
        return;
      }
      startTransition(async () => {
        const res = await deleteRecurringSlotFromCalendarAction(locale, rowId);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success(labels.slotDeleted);
        router.refresh();
      });
      return;
    }

    if (id.startsWith("oneoff-")) {
      const rowId = id.slice("oneoff-".length);
      if (!window.confirm(labels.deleteOneOffConfirm)) {
        return;
      }
      startTransition(async () => {
        const res = await deleteOneOffSlotFromCalendarAction(locale, rowId);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success(labels.slotDeleted);
        router.refresh();
      });
      return;
    }

    if (id.startsWith("booked-")) {
      toast.message(labels.cantDeleteBooked);
    }
  };

  return (
    <div className="relative rounded-xl border bg-white p-4 shadow-sm md:p-5">
      {pending ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 text-sm font-medium text-zinc-600">
          …
        </div>
      ) : null}

      {choice ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="slot-mode-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeChoice();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") closeChoice();
          }}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="slot-mode-title" className="text-lg font-semibold text-[#1D2129]">
              {labels.modeTitle}
            </h3>
            <p className="mt-1 text-sm text-zinc-600">{labels.modeDescription}</p>
            <p className="ui-readable-light-slab mt-3 rounded-md px-3 py-2 font-mono text-sm">{choice.summaryLine}</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button type="button" className="w-full" disabled={pending} onClick={saveRecurring}>
                {labels.modeRecurring}
              </Button>
              <Button type="button" variant="outline" className="w-full" disabled={pending} onClick={saveOneOff}>
                {labels.modeOneOff}
              </Button>
              <Button type="button" variant="ghost" className="w-full" disabled={pending} onClick={closeChoice}>
                {labels.modeCancel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <p className="mb-3 text-sm text-zinc-600">{labels.dragHint}</p>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        allDaySlot={false}
        slotMinTime="07:00:00"
        slotMaxTime="24:00:00"
        slotDuration="00:30:00"
        height={720}
        selectable
        selectMirror
        selectOverlap={(stillEvent) => {
          const eid = String(stillEvent.id ?? "");
          if (
            eid.startsWith("booked-") ||
            eid.startsWith("blocked-") ||
            eid.startsWith("availability-") ||
            eid.startsWith("oneoff-")
          ) {
            return false;
          }
          return true;
        }}
        editable={false}
        eventStartEditable={false}
        eventDurationEditable={false}
        select={onSelect}
        eventClick={onEventClick}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,dayGridMonth",
        }}
      />
    </div>
  );
}
