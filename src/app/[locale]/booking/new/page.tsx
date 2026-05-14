import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { displayMacauRegion } from "@/lib/macau-location-display";
import { macauTodayYmd } from "@/lib/macau-ymd";
import { fetchSlotsAndGridsForTutor } from "@/lib/tutor-booking-slots";
import { BookingNewClient } from "@/components/booking-new-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type BookingNewPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    tutorId?: string;
    date?: string;
    error?: string;
    success?: string;
  }>;
};

export default async function BookingNewPage({ params, searchParams }: BookingNewPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile(locale);
  if (profile.role !== "student") redirect(`/${locale}/dashboard`);
  const t = await getTranslations("Booking");

  const supabase = await createClient();
  const todayMacau = macauTodayYmd();
  const rawDate = query.date ?? todayMacau;
  const selectedDate = rawDate < todayMacau ? todayMacau : rawDate;

  if (query.date && query.date < todayMacau) {
    const p = new URLSearchParams();
    if (query.tutorId) p.set("tutorId", query.tutorId);
    p.set("date", todayMacau);
    redirect(`/${locale}/booking/new?${p.toString()}`);
  }

  const { data: tutors } = await supabase
    .from("tutor_profiles")
    .select("id, display_name, district, hourly_rate, service_type, is_verified")
    .order("created_at", { ascending: false });

  const tutorIds = (tutors ?? []).map((item) => item.id);

  const { data: subjects } =
    tutorIds.length > 0
      ? await supabase.from("tutor_subjects").select("tutor_id, subject, grade_level").in("tutor_id", tutorIds)
      : { data: [] as { tutor_id: string; subject: string; grade_level: string }[] };

  const selectedTutorId = query.tutorId ?? tutors?.[0]?.id;
  const selectedTutor = (tutors ?? []).find((item) => item.id === selectedTutorId);
  const isTutorLocked = Boolean(query.tutorId);

  let bookingDates: string[] = [];
  let slotsByDate: Record<string, { start_time: string; end_time: string }[]> = {};
  let hourGridByDate: Record<string, import("@/lib/tutor-booking-slots").HourCellKind[]> = {};
  let selectedTutorSubjects: { subject: string; grade_level: string }[] = [];

  if (selectedTutorId) {
    const multi = await fetchSlotsAndGridsForTutor(supabase, selectedTutorId, todayMacau, 42);
    bookingDates = multi.dates;
    slotsByDate = multi.slotsByDate;
    hourGridByDate = multi.hourGridByDate;

    selectedTutorSubjects = (subjects ?? []).filter((item) => item.tutor_id === selectedTutorId);
  }

  return (
    <main className="space-y-8">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription className="space-y-2">
            <span className="block">{t("subtitle")}</span>
            <span className="block text-xs text-zinc-500">{t("studentsOnlyBookingNote")}</span>
          </CardDescription>
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
          {query.error ? <p className="ui-alert ui-alert-error mt-3">{decodeURIComponent(query.error)}</p> : null}
        </CardContent>
      </Card>

      {selectedTutor && selectedTutorId ? (
        <Card className="min-w-0 max-w-full overflow-visible">
          <CardContent className="min-w-0 max-w-full p-4 md:p-5">
            <BookingNewClient
              locale={locale}
              tutors={(tutors ?? []).map((item) => ({
                id: item.id,
                display_name: item.display_name,
                district: displayMacauRegion(locale, item.district),
                hourly_rate: item.hourly_rate,
              }))}
              selectedTutorId={selectedTutorId}
              selectedDate={selectedDate}
              isTutorLocked={isTutorLocked}
              lockedTutorLabel={
                isTutorLocked
                  ? `${selectedTutor.display_name} · ${displayMacauRegion(locale, selectedTutor.district)} · MOP${selectedTutor.hourly_rate}`
                  : undefined
              }
              tutorDisplayName={selectedTutor.display_name}
              subjects={selectedTutorSubjects}
              bookingDates={bookingDates}
              slotsByDate={slotsByDate}
              hourGridByDate={hourGridByDate}
            />
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
