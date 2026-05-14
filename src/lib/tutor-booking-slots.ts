import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysMacauYmd, getMacauWeekdayIndex } from "@/lib/macau-ymd";
import { computeAvailableSlots, toMinutes, type ComputedSlot, type TimeRange } from "@/lib/availability";

export type HourCellKind = "available" | "busy" | "off";

function rangeOverlapsHour(range: TimeRange, hourIndex: number): boolean {
  const h0 = hourIndex * 60;
  const h1 = h0 + 60;
  const a = toMinutes(range.start_time);
  const b = toMinutes(range.end_time);
  return a < h1 && h0 < b;
}

function hourHasAvailableSlot(slots: ComputedSlot[], hourIndex: number): boolean {
  return slots.some((s) => Math.floor(toMinutes(s.start_time) / 60) === hourIndex);
}

function hourCoveredByWorkingRanges(ranges: TimeRange[], hourIndex: number): boolean {
  return ranges.some((r) => rangeOverlapsHour(r, hourIndex));
}

/** 24 cells: available (bookable), busy (within working hours but blocked/booked), off (outside working hours). */
export function buildHourGrid(workingRanges: TimeRange[], availableSlots: ComputedSlot[]): HourCellKind[] {
  const grid: HourCellKind[] = [];
  for (let h = 0; h < 24; h++) {
    if (!hourCoveredByWorkingRanges(workingRanges, h)) {
      grid.push("off");
      continue;
    }
    if (hourHasAvailableSlot(availableSlots, h)) {
      grid.push("available");
    } else {
      grid.push("busy");
    }
  }
  return grid;
}

export async function fetchSlotsAndGridsForTutor(
  supabase: SupabaseClient,
  tutorId: string,
  anchorYmd: string,
  numDays: number,
): Promise<{
  dates: string[];
  slotsByDate: Record<string, ComputedSlot[]>;
  hourGridByDate: Record<string, HourCellKind[]>;
}> {
  const dates: string[] = [];
  for (let i = 0; i < numDays; i++) {
    dates.push(addDaysMacauYmd(anchorYmd, i));
  }

  const [{ data: availRows }, { data: bookingRows }, blocksRes, { data: oneOffRows }] = await Promise.all([
    supabase.from("tutor_availability").select("day_of_week, start_time, end_time").eq("tutor_id", tutorId),
    supabase
      .from("bookings")
      .select("session_date, start_time, end_time")
      .eq("tutor_id", tutorId)
      .in("session_date", dates)
      .eq("session_status", "upcoming"),
    supabase.from("tutor_unavailability_blocks").select("block_date, start_time, end_time").eq("tutor_id", tutorId).in("block_date", dates),
    supabase.from("tutor_availability_one_off").select("session_date, start_time, end_time").eq("tutor_id", tutorId).in("session_date", dates),
  ]);

  const blocks = blocksRes.error ? [] : blocksRes.data ?? [];

  const slotsByDate: Record<string, ComputedSlot[]> = {};
  const hourGridByDate: Record<string, HourCellKind[]> = {};

  const weekly = (availRows ?? []).map((r) => ({
    day_of_week: r.day_of_week as number,
    start_time: r.start_time as string,
    end_time: r.end_time as string,
  }));

  for (const d of dates) {
    const dow = getMacauWeekdayIndex(d);
    const recurring: TimeRange[] = weekly
      .filter((r) => r.day_of_week === dow)
      .map((r) => ({ start_time: r.start_time, end_time: r.end_time }));
    const oneOffForDay: TimeRange[] = (oneOffRows ?? [])
      .filter((o) => o.session_date === d)
      .map((o) => ({ start_time: o.start_time as string, end_time: o.end_time as string }));
    const workingRanges = [...recurring, ...oneOffForDay];

    const booked: TimeRange[] = (bookingRows ?? [])
      .filter((b) => b.session_date === d)
      .map((b) => ({ start_time: b.start_time as string, end_time: b.end_time as string }));
    const blocked: TimeRange[] = blocks
      .filter((b) => b.block_date === d)
      .map((b) => ({ start_time: b.start_time as string, end_time: b.end_time as string }));

    const slots = computeAvailableSlots(workingRanges, booked, blocked, 60);
    slotsByDate[d] = slots;
    hourGridByDate[d] = buildHourGrid(workingRanges, slots);
  }

  return { dates, slotsByDate, hourGridByDate };
}

export type QuickSlotFlags = { today: boolean; tomorrow: boolean };

export async function fetchTutorQuickSlotFlags(
  supabase: SupabaseClient,
  tutorIds: string[],
  todayYmd: string,
  tomorrowYmd: string,
): Promise<Map<string, QuickSlotFlags>> {
  const map = new Map<string, QuickSlotFlags>();
  if (tutorIds.length === 0) return map;
  for (const id of tutorIds) {
    map.set(id, { today: false, tomorrow: false });
  }

  const [{ data: availAll }, { data: bookTwo }, { data: blockTwo }, { data: oneOffTwo }] = await Promise.all([
    supabase.from("tutor_availability").select("tutor_id, day_of_week, start_time, end_time").in("tutor_id", tutorIds),
    supabase
      .from("bookings")
      .select("tutor_id, session_date, start_time, end_time")
      .in("tutor_id", tutorIds)
      .in("session_date", [todayYmd, tomorrowYmd])
      .eq("session_status", "upcoming"),
    supabase
      .from("tutor_unavailability_blocks")
      .select("tutor_id, block_date, start_time, end_time")
      .in("tutor_id", tutorIds)
      .in("block_date", [todayYmd, tomorrowYmd]),
    supabase
      .from("tutor_availability_one_off")
      .select("tutor_id, session_date, start_time, end_time")
      .in("tutor_id", tutorIds)
      .in("session_date", [todayYmd, tomorrowYmd]),
  ]);

  const blocks = blockTwo ?? [];

  for (const tutorId of tutorIds) {
    for (const [dayYmd, key] of [
      [todayYmd, "today"],
      [tomorrowYmd, "tomorrow"],
    ] as const) {
      const dow = getMacauWeekdayIndex(dayYmd);
      const recurring: TimeRange[] = (availAll ?? [])
        .filter((r) => r.tutor_id === tutorId && Number(r.day_of_week) === dow)
        .map((r) => ({ start_time: r.start_time as string, end_time: r.end_time as string }));
      const oneOffForDay: TimeRange[] = (oneOffTwo ?? [])
        .filter((o) => o.tutor_id === tutorId && o.session_date === dayYmd)
        .map((o) => ({ start_time: o.start_time as string, end_time: o.end_time as string }));
      const working = [...recurring, ...oneOffForDay];
      const booked: TimeRange[] = (bookTwo ?? [])
        .filter((b) => b.tutor_id === tutorId && b.session_date === dayYmd)
        .map((b) => ({ start_time: b.start_time as string, end_time: b.end_time as string }));
      const blocked: TimeRange[] = blocks
        .filter((b) => b.tutor_id === tutorId && b.block_date === dayYmd)
        .map((b) => ({ start_time: b.start_time as string, end_time: b.end_time as string }));
      const slots = computeAvailableSlots(working, booked, blocked, 60);
      const cur = map.get(tutorId)!;
      if (key === "today") cur.today = slots.length > 0;
      else cur.tomorrow = slots.length > 0;
    }
  }

  return map;
}
