type TimeRange = {
  start_time: string;
  end_time: string;
};

export type ComputedSlot = {
  start_time: string;
  end_time: string;
};

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export function computeAvailableSlots(
  recurringAvailability: TimeRange[],
  bookedRanges: TimeRange[],
  blockedRanges: TimeRange[],
  slotMinutes = 60,
): ComputedSlot[] {
  const conflicts = [...bookedRanges, ...blockedRanges].map((item) => ({
    start: toMinutes(item.start_time),
    end: toMinutes(item.end_time),
  }));

  const candidateSlots: ComputedSlot[] = [];

  recurringAvailability.forEach((range) => {
    const start = toMinutes(range.start_time);
    const end = toMinutes(range.end_time);

    for (let current = start; current + slotMinutes <= end; current += slotMinutes) {
      const slotStart = current;
      const slotEnd = current + slotMinutes;
      const hasConflict = conflicts.some((c) =>
        overlaps(slotStart, slotEnd, c.start, c.end),
      );

      if (!hasConflict) {
        candidateSlots.push({
          start_time: toTime(slotStart),
          end_time: toTime(slotEnd),
        });
      }
    }
  });

  return candidateSlots;
}
