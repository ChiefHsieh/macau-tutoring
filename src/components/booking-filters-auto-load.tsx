"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type TutorOption = {
  id: string;
  display_name: string;
  district: string;
  hourly_rate: number;
};

type BookingFiltersAutoLoadProps = {
  locale: string;
  tutors: TutorOption[];
  selectedTutorId?: string;
  selectedDate: string;
  isTutorLocked: boolean;
  lockedTutorLabel?: string;
};

export function BookingFiltersAutoLoad({
  locale,
  tutors,
  selectedTutorId,
  selectedDate,
  isTutorLocked,
  lockedTutorLabel,
}: BookingFiltersAutoLoadProps) {
  const router = useRouter();
  const [tutorId, setTutorId] = useState(selectedTutorId ?? tutors[0]?.id ?? "");
  const [date, setDate] = useState(selectedDate);
  const basePath = useMemo(() => `/${locale}/booking/new`, [locale]);

  const pushFilters = (nextTutorId: string, nextDate: string) => {
    const params = new URLSearchParams();
    if (nextTutorId) params.set("tutorId", nextTutorId);
    if (nextDate) params.set("date", nextDate);
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath);
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {isTutorLocked ? (
        <>
          <input type="hidden" name="tutorId" value={tutorId} />
          <div className="flex h-10 items-center rounded-md border border-[#D1FAE5] bg-white/95 px-3 text-sm text-[#064E3B]">
            {lockedTutorLabel}
          </div>
        </>
      ) : (
        <Select
          name="tutorId"
          value={tutorId}
          onChange={(e) => {
            const nextTutorId = e.target.value;
            setTutorId(nextTutorId);
            pushFilters(nextTutorId, date);
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
        value={date}
        onChange={(e) => {
          const nextDate = e.target.value;
          setDate(nextDate);
          pushFilters(tutorId, nextDate);
        }}
      />
      <div className="hidden md:block" />
    </div>
  );
}
