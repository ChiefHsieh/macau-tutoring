import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { computeAvailableSlots } from "@/lib/availability";
import { BookingCreateForm } from "@/components/booking-create-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type BookingNewPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    tutorId?: string;
    date?: string;
    error?: string;
    success?: string; // "1" after createBookingAction redirect
  }>;
};

function getWeekDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).getDay();
}

export default async function BookingNewPage({ params, searchParams }: BookingNewPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile(locale);
  if (profile.role !== "student") redirect(`/${locale}/dashboard`);
  const t = await getTranslations("Booking");

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = query.date ?? today;

  const { data: tutors } = await supabase
    .from("tutor_profiles")
    .select("id, display_name, district, hourly_rate, service_type, is_verified")
    .order("created_at", { ascending: false });

  const tutorIds = (tutors ?? []).map((item) => item.id);

  const { data: subjects } =
    tutorIds.length > 0
      ? await supabase
          .from("tutor_subjects")
          .select("tutor_id, subject, grade_level")
          .in("tutor_id", tutorIds)
      : { data: [] as { tutor_id: string; subject: string; grade_level: string }[] };

  const selectedTutorId = query.tutorId ?? tutors?.[0]?.id;
  const selectedTutor = (tutors ?? []).find((item) => item.id === selectedTutorId);
  const isTutorLocked = Boolean(query.tutorId);

  let availableSlots: { start_time: string; end_time: string }[] = [];
  let selectedTutorSubjects: { subject: string; grade_level: string }[] = [];

  if (selectedTutorId) {
    const weekDay = getWeekDay(selectedDate);
    const [{ data: availRows }, { data: bookingRows }, blocksResult] = await Promise.all([
      supabase
        .from("tutor_availability")
        .select("start_time, end_time")
        .eq("tutor_id", selectedTutorId)
        .eq("day_of_week", weekDay),
      supabase
        .from("bookings")
        .select("start_time, end_time")
        .eq("tutor_id", selectedTutorId)
        .eq("session_date", selectedDate)
        .in("session_status", ["upcoming"]),
      supabase
        .from("tutor_unavailability_blocks")
        .select("start_time, end_time")
        .eq("tutor_id", selectedTutorId)
        .eq("block_date", selectedDate),
    ]);

    const oneOffRes = await supabase
      .from("tutor_availability_one_off")
      .select("start_time, end_time")
      .eq("tutor_id", selectedTutorId)
      .eq("session_date", selectedDate);
    const oneOffRows = oneOffRes.error ? [] : oneOffRes.data ?? [];

    const baseRanges = [...(availRows ?? []), ...oneOffRows];

    availableSlots = computeAvailableSlots(
      baseRanges,
      bookingRows ?? [],
      blocksResult.error ? [] : blocksResult.data ?? [],
      60,
    );

    selectedTutorSubjects = (subjects ?? []).filter(
      (item) => item.tutor_id === selectedTutorId,
    );
  }

  return (
    <main className="space-y-8">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
        {query.success ? (
          <div className="ui-alert ui-alert-success mt-3 space-y-2">
            <p>{t("success")}</p>
            {query.tutorId ? (
              <Link
                href={`/${locale}/messages/${query.tutorId}`}
                className="inline-block font-medium text-emerald-900 underline underline-offset-2"
              >
                {t("messageTutorAfterBook")}
              </Link>
            ) : null}
          </div>
        ) : null}
        {query.error ? (
          <p className="ui-alert ui-alert-error mt-3">
            {decodeURIComponent(query.error)}
          </p>
        ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 md:p-5">
        <form className="grid gap-3 md:grid-cols-3" method="get">
          {isTutorLocked && selectedTutor ? (
            <>
              <input type="hidden" name="tutorId" value={selectedTutor.id} />
              <div className="flex h-10 items-center rounded-md border border-[#D1FAE5] bg-white/95 px-3 text-sm text-[#064E3B]">
                {selectedTutor.display_name} · {selectedTutor.district} · MOP{selectedTutor.hourly_rate}
              </div>
            </>
          ) : (
            <Select name="tutorId" defaultValue={selectedTutorId}>
              {(tutors ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.display_name} · {item.district} · MOP{item.hourly_rate}
                </option>
              ))}
            </Select>
          )}
          <Input type="date" name="date" defaultValue={selectedDate} />
          <Button>{t("load")}</Button>
        </form>
        </CardContent>
      </Card>

      {selectedTutor ? (
        <Card>
          <CardContent className="p-4 md:p-5">
          <h2 className="text-lg font-semibold text-[#1D2129]">{t("availableSlots")}</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {t("selectedTutor")}: {selectedTutor.display_name}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {t("selectedDate")}: {selectedDate}
          </p>

          {availableSlots.length === 0 ? (
            <p className="ui-empty-state mt-4">{t("noSlots")}</p>
          ) : selectedTutorSubjects.length === 0 ? (
            <p className="ui-empty-state mt-4">{t("noSubject")}</p>
          ) : (
            <BookingCreateForm
              locale={locale}
              tutorId={selectedTutor.id}
              sessionDate={selectedDate}
              slots={availableSlots}
              subjects={selectedTutorSubjects}
              labels={{ bookNow: t("bookNow") }}
            />
          )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 md:p-5">
            <p className="ui-empty-state">{t("noTutor")}</p>
          </CardContent>
        </Card>
      )}

      <Link href={`/${locale}/dashboard/student`} className="inline-flex w-fit rounded-md border px-4 py-2 text-sm font-medium">
        {t("back")}
      </Link>
    </main>
  );
}
