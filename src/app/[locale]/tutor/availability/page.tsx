import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { EventInput } from "@fullcalendar/core";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TutorAvailabilityCalendar } from "@/components/tutor-availability-calendar";
import {
  deleteOneOffAvailabilityAction,
  deleteRecurringAvailabilityAction,
} from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TutorAvailabilityPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function TutorAvailabilityPage({
  params,
  searchParams,
}: TutorAvailabilityPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const { user, profile } = await requireProfile(locale);
  const t = await getTranslations("Availability");

  if (profile.role !== "tutor") redirect(`/${locale}/dashboard`);

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: recurringSlots }, { data: bookedSlots }] = await Promise.all([
    supabase
      .from("tutor_availability")
      .select("id, day_of_week, start_time, end_time")
      .eq("tutor_id", user.id)
      .order("day_of_week")
      .order("start_time"),
    supabase
      .from("bookings")
      .select("id, session_date, start_time, end_time, subject, payment_status, session_status")
      .eq("tutor_id", user.id)
      .in("session_status", ["upcoming"])
      .gte("session_date", today)
      .order("session_date")
      .order("start_time"),
  ]);

  let oneOffSlots: { id: string; session_date: string; start_time: string; end_time: string }[] = [];
  const oneOffResult = await supabase
    .from("tutor_availability_one_off")
    .select("id, session_date, start_time, end_time")
    .eq("tutor_id", user.id)
    .gte("session_date", today)
    .order("session_date")
    .order("start_time");
  if (!oneOffResult.error && oneOffResult.data) {
    oneOffSlots = oneOffResult.data;
  }

  const weekLabels = [t("week0"), t("week1"), t("week2"), t("week3"), t("week4"), t("week5"), t("week6")];

  const toHm = (time: string) => String(time).slice(0, 8);

  const events: EventInput[] = [
    ...((recurringSlots ?? []).map((item) => ({
      id: `availability-${item.id}`,
      title: t("available"),
      daysOfWeek: [item.day_of_week],
      startTime: toHm(item.start_time),
      endTime: toHm(item.end_time),
      backgroundColor: "#dcfce7",
      borderColor: "#22c55e",
      textColor: "#166534",
    })) satisfies EventInput[]),
    ...((oneOffSlots ?? []).map((item) => ({
      id: `oneoff-${item.id}`,
      title: t("oneOffEventLabel"),
      start: `${item.session_date}T${toHm(item.start_time)}`,
      end: `${item.session_date}T${toHm(item.end_time)}`,
      backgroundColor: "#dbeafe",
      borderColor: "#2563eb",
      textColor: "#1e3a8a",
    })) satisfies EventInput[]),
    ...((bookedSlots ?? []).map((item) => ({
      id: `booked-${item.id}`,
      title: `${t("booked")} · ${item.subject}`,
      start: `${item.session_date}T${item.start_time}`,
      end: `${item.session_date}T${item.end_time}`,
      backgroundColor: "#ef4444",
      borderColor: "#ef4444",
    })) satisfies EventInput[]),
  ];

  return (
    <main className="space-y-8">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {query.saved ? (
            <p className="ui-alert ui-alert-success mt-3">{t("saved")}</p>
          ) : null}
          {query.error ? (
            <p className="ui-alert ui-alert-error mt-3">
              {decodeURIComponent(query.error)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <TutorAvailabilityCalendar
        events={events}
        locale={locale}
        weekdayNames={weekLabels}
        labels={{
          dragHint: t("recurringDragHint"),
          slotSaved: t("slotSavedToast"),
          slotSavedOneOff: t("slotSavedOneOffToast"),
          slotDeleted: t("slotDeletedToast"),
          deleteRecurringConfirm: t("deleteRecurringConfirm"),
          deleteOneOffConfirm: t("deleteOneOffConfirm"),
          cantDeleteBooked: t("cantDeleteBooked"),
          modeTitle: t("slotModeTitle"),
          modeDescription: t("slotModeDescription"),
          modeRecurring: t("slotModeRecurring"),
          modeOneOff: t("slotModeOneOff"),
          modeCancel: t("slotModeCancel"),
          invalidRange: t("invalidRangeHint"),
        }}
      />

      <Card className="max-w-3xl">
        <CardContent className="space-y-6 p-4 md:p-5">
          <div>
            <h2 className="text-lg font-semibold text-[#1D2129]">{t("slotsSummaryTitle")}</h2>
            <p className="mt-2 text-sm text-zinc-600">{t("slotsSummaryBody")}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-800">{t("recurringListTitle")}</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {(recurringSlots ?? []).length === 0 ? (
                <li className="ui-empty-state">{t("recurringListEmpty")}</li>
              ) : (
                (recurringSlots ?? []).map((item) => (
                  <li key={item.id} className="ui-list-row flex items-center justify-between rounded-md border p-2.5">
                    <span>
                      {weekLabels[item.day_of_week] ?? item.day_of_week} · {item.start_time} - {item.end_time}
                    </span>
                    <form action={deleteRecurringAvailabilityAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={item.id} />
                      <Button variant="outline" size="sm">
                        {t("delete")}
                      </Button>
                    </form>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-800">{t("oneOffListTitle")}</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {(oneOffSlots ?? []).length === 0 ? (
                <li className="ui-empty-state">{t("oneOffListEmpty")}</li>
              ) : (
                (oneOffSlots ?? []).map((item) => (
                  <li key={item.id} className="ui-list-row flex items-center justify-between rounded-md border p-2.5">
                    <span>
                      {item.session_date} · {item.start_time} - {item.end_time}
                    </span>
                    <form action={deleteOneOffAvailabilityAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="id" value={item.id} />
                      <Button variant="outline" size="sm">
                        {t("delete")}
                      </Button>
                    </form>
                  </li>
                ))
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
