/** Helpers for mapping FullCalendar drag-select into DB `time` + `day_of_week`. */

function sameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Local wall-clock HH:MM:SS (no TZ conversion beyond Date's local getters). */
export function formatLocalHMS(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/**
 * FullCalendar `select` uses [start, end) where `end` may be next calendar day at 00:00
 * for "through end of day" picks. Maps to inclusive DB convention on the **start** weekday.
 */
export function slotRangeFromSelection(
  start: Date,
  endExclusive: Date,
): { day_of_week: number; start_time: string; end_time: string; session_date: string } | null {
  const lastIncluded = new Date(endExclusive.getTime() - 1);
  if (!sameLocalCalendarDay(start, lastIncluded)) {
    return null;
  }

  const day_of_week = start.getDay();
  const start_time = formatLocalHMS(start);

  let end_time: string;
  if (
    endExclusive.getHours() === 0 &&
    endExclusive.getMinutes() === 0 &&
    endExclusive.getSeconds() === 0 &&
    endExclusive.getMilliseconds() === 0 &&
    endExclusive.getTime() > start.getTime() &&
    !sameLocalCalendarDay(start, endExclusive)
  ) {
    end_time = "23:59:59";
  } else {
    end_time = formatLocalHMS(endExclusive);
  }

  if (start_time >= end_time) {
    return null;
  }

  const session_date = `${start.getFullYear()}-${pad2(start.getMonth() + 1)}-${pad2(start.getDate())}`;

  return { day_of_week, start_time, end_time, session_date };
}
