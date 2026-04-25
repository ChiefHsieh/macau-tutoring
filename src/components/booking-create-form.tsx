"use client";

import { useMemo, useState } from "react";
import { createBookingAction } from "@/app/[locale]/booking/actions";
import { trackEvent } from "@/lib/analytics";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Slot = { start_time: string; end_time: string };
type TutorSubject = { subject: string; grade_level: string };

type BookingCreateFormProps = {
  locale: string;
  tutorId: string;
  sessionDate: string;
  slots: Slot[];
  subjects: TutorSubject[];
  labels: {
    bookNow: string;
  };
};

export function BookingCreateForm({
  locale,
  tutorId,
  sessionDate,
  slots,
  subjects,
  labels,
}: BookingCreateFormProps) {
  const [slotValue, setSlotValue] = useState(
    slots[0] ? `${slots[0].start_time}|${slots[0].end_time}` : "",
  );

  const [start, end] = useMemo(() => slotValue.split("|"), [slotValue]);

  return (
    <form
      action={async (formData) => {
        trackEvent("match_created", { tutor_id: tutorId });
        await createBookingAction(formData);
      }}
      className="mt-4 grid gap-4"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="tutor_id" value={tutorId} />
      <input type="hidden" name="session_date" value={sessionDate} />

      <Select name="subject">
        {subjects.map((s) => (
          <option key={`${s.subject}-${s.grade_level}`} value={s.subject}>
            {s.subject} ({s.grade_level})
          </option>
        ))}
      </Select>

      <Select name="grade_level">
        {subjects.map((s) => (
          <option key={`${s.grade_level}-${s.subject}`} value={s.grade_level}>
            {s.grade_level}
          </option>
        ))}
      </Select>

      <Select
        name="slot"
        value={slotValue}
        onChange={(e) => setSlotValue(e.target.value)}
      >
        {slots.map((slot) => (
          <option key={`${slot.start_time}-${slot.end_time}`} value={`${slot.start_time}|${slot.end_time}`}>
            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
          </option>
        ))}
      </Select>

      <input type="hidden" name="start_time" value={start ?? ""} />
      <input type="hidden" name="end_time" value={end ?? ""} />

      <Button>{labels.bookNow}</Button>
    </form>
  );
}
