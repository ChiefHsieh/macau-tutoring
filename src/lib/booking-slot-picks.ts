export type BookingSlotPick = {
  sessionDate: string;
  start_time: string;
  end_time: string;
};

export function slotPickKey(pick: BookingSlotPick): string {
  return `${pick.sessionDate}|${pick.start_time}|${pick.end_time}`;
}

export function parseSlotPickKey(key: string): BookingSlotPick | null {
  const parts = key.split("|");
  if (parts.length !== 3) return null;
  const [sessionDate, start_time, end_time] = parts;
  if (!sessionDate || !start_time || !end_time) return null;
  return { sessionDate, start_time, end_time };
}

export function isSlotPickSelected(picks: BookingSlotPick[], pick: BookingSlotPick): boolean {
  const key = slotPickKey(pick);
  return picks.some((p) => slotPickKey(p) === key);
}

export function toggleSlotPick(picks: BookingSlotPick[], pick: BookingSlotPick): BookingSlotPick[] {
  const key = slotPickKey(pick);
  if (picks.some((p) => slotPickKey(p) === key)) {
    return picks.filter((p) => slotPickKey(p) !== key);
  }
  return [...picks, pick].sort((a, b) => {
    if (a.sessionDate !== b.sessionDate) return a.sessionDate.localeCompare(b.sessionDate);
    return a.start_time.localeCompare(b.start_time);
  });
}

export function hourIndexFromTime(time: string): number {
  const [h] = time.split(":").map(Number);
  return h;
}

export function isHourSelectedForDate(
  picks: BookingSlotPick[],
  sessionDate: string,
  hourIndex: number,
): boolean {
  return picks.some(
    (p) => p.sessionDate === sessionDate && hourIndexFromTime(p.start_time) === hourIndex,
  );
}
