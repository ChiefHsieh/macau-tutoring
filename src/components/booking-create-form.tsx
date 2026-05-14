"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createBookingAction } from "@/app/[locale]/booking/actions";
import { trackEvent } from "@/lib/analytics";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/submit-button";
import { useTranslations } from "next-intl";

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
  slotValue: string;
  onSlotValueChange: (v: string) => void;
  /** When set, replaces the time-slot dropdown. */
  slotDisplay?: ReactNode;
  submitDisabled?: boolean;
};

export function BookingCreateForm({
  locale,
  tutorId,
  sessionDate,
  slots,
  subjects,
  labels,
  slotValue,
  onSlotValueChange,
  slotDisplay,
  submitDisabled,
}: BookingCreateFormProps) {
  const tCommon = useTranslations("Common");
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

  const [start, end] = useMemo(() => slotValue.split("|"), [slotValue]);

  return (
    <form
      action={async (formData) => {
        trackEvent("match_created", { tutor_id: tutorId });
        await createBookingAction(formData);
      }}
      className="mt-4 grid min-w-0 max-w-full gap-4"
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

      {slotDisplay ? (
        <div className="relative rounded-[12px] border border-[#1A2456] bg-[#0A0F35] px-3 py-2 text-sm text-[#F8F9FA]">
          {slotDisplay}
        </div>
      ) : (
        <Select name="slot" value={slotValue} onChange={(e) => onSlotValueChange(e.target.value)}>
          {slots.map((slot) => (
            <option key={`${slot.start_time}-${slot.end_time}`} value={`${slot.start_time}|${slot.end_time}`}>
              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
            </option>
          ))}
        </Select>
      )}

      <input type="hidden" name="start_time" value={start ?? ""} />
      <input type="hidden" name="end_time" value={end ?? ""} />

      <SubmitButton className="w-full" pendingLabel={tCommon("loading")} disabled={submitDisabled}>
        {labels.bookNow}
      </SubmitButton>
    </form>
  );
}
