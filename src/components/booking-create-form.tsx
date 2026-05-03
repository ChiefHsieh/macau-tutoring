"use client";

import { useEffect, useMemo, useState } from "react";
import { createBookingAction } from "@/app/[locale]/booking/actions";
import { trackEvent } from "@/lib/analytics";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type Slot = { start_time: string; end_time: string };
type TutorSubject = { subject: string; grade_level: string };

function uniqueSubjectsInOrder(rows: TutorSubject[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    if (!seen.has(r.subject)) {
      seen.add(r.subject);
      out.push(r.subject);
    }
  }
  return out;
}

function gradeLevelsForSubject(rows: TutorSubject[], subject: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    if (r.subject !== subject) continue;
    if (!seen.has(r.grade_level)) {
      seen.add(r.grade_level);
      out.push(r.grade_level);
    }
  }
  return out;
}

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
  const subjectOptions = useMemo(() => uniqueSubjectsInOrder(subjects), [subjects]);

  const [subject, setSubject] = useState(subjectOptions[0] ?? "");
  const gradeOptions = useMemo(() => gradeLevelsForSubject(subjects, subject), [subjects, subject]);
  const [gradeLevel, setGradeLevel] = useState(gradeOptions[0] ?? "");

  useEffect(() => {
    const subs = uniqueSubjectsInOrder(subjects);
    setSubject((prev) => (subs.includes(prev) ? prev : subs[0] ?? ""));
  }, [subjects]);

  useEffect(() => {
    const grades = gradeLevelsForSubject(subjects, subject);
    setGradeLevel((prev) => (grades.includes(prev) ? prev : grades[0] ?? ""));
  }, [subjects, subject]);

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

      <Select name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required>
        {subjectOptions.map((sub) => (
          <option key={sub} value={sub}>
            {sub}
          </option>
        ))}
      </Select>

      <Select name="grade_level" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} required>
        {gradeOptions.map((gl) => (
          <option key={gl} value={gl}>
            {gl}
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
