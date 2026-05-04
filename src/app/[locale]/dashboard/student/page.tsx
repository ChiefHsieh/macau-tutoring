import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageSection } from "@/components/page-section";
import { ButtonLink } from "@/components/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StudentDashboardProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reviewed?: string; error?: string }>;
};

export default async function StudentDashboard({ params, searchParams }: StudentDashboardProps) {
  const { locale } = await params;
  const query = await searchParams;
  const { profile, user } = await requireProfile(locale);
  if (profile.role !== "student") redirect(`/${locale}/dashboard`);
  const t = await getTranslations("Dashboard");
  const tCommon = await getTranslations("Common");

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: upcoming } = await supabase
    .from("bookings")
    .select("id, session_date, start_time, end_time, subject, payment_status, tutor_id, tutor_decision")
    .eq("student_id", user.id)
    .eq("session_status", "upcoming")
    .gte("session_date", today)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(12);

  const { data: reviewCandidates } = await supabase
    .from("bookings")
    .select("id, tutor_id, subject, session_date, start_time, end_time, tutor_decision")
    .eq("student_id", user.id)
    .eq("tutor_decision", "accepted")
    .order("session_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(20);

  const tutorIds = [...new Set((upcoming ?? []).map((b) => b.tutor_id))];
  const reviewTutorIds = [...new Set((reviewCandidates ?? []).map((b) => b.tutor_id))];
  const allTutorIds = [...new Set([...tutorIds, ...reviewTutorIds])];
  const { data: tutors } =
    allTutorIds.length > 0
      ? await supabase.from("tutor_profiles").select("id, display_name").in("id", allTutorIds)
      : { data: [] as { id: string; display_name: string }[] };

  const nameById = new Map((tutors ?? []).map((x) => [x.id, x.display_name]));

  const candidateIds = (reviewCandidates ?? []).map((x) => x.id);
  const { data: existingReviews } =
    candidateIds.length > 0
      ? await supabase.from("reviews").select("booking_id").in("booking_id", candidateIds)
      : { data: [] as { booking_id: string }[] };
  const reviewedSet = new Set((existingReviews ?? []).map((r) => r.booking_id));
  const readyToReview = (reviewCandidates ?? []).filter((x) => !reviewedSet.has(x.id));

  const [{ count: unreadNotif, error: notifCountErr }, { count: unreadMsg, error: msgCountErr }] =
    await Promise.all([
      supabase
        .from("notifications")
        .select("id", { head: true, count: "exact" })
        .eq("user_id", user.id)
        .eq("is_read", false),
      supabase
        .from("messages")
        .select("id", { head: true, count: "exact" })
        .eq("receiver_id", user.id)
        .eq("is_read", false),
    ]);

  const notifBadge = notifCountErr ? 0 : (unreadNotif ?? 0);
  const msgBadge = msgCountErr ? 0 : (unreadMsg ?? 0);

  return (
    <main className="space-y-8">
      <PageSection title={t("studentTitle")} description={`${t("welcome")}: ${profile.full_name}`}>
        <div className="space-y-4">
          {query.reviewed ? (
            <p className="ui-alert ui-alert-success">{t("reviewSuccess")}</p>
          ) : null}
          {query.error ? (
            <p className="ui-alert ui-alert-error">{decodeURIComponent(query.error)}</p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/${locale}/notifications`} variant="outline" size="sm" pendingLabel={tCommon("loading")}>
              {t("notificationsCta")}
              {notifBadge > 0 ? ` (${notifBadge > 99 ? "99+" : notifBadge})` : ""}
            </ButtonLink>
            <ButtonLink href={`/${locale}/messages`} variant="outline" size="sm" pendingLabel={tCommon("loading")}>
              {t("messagesCta")}
              {msgBadge > 0 ? ` (${msgBadge > 99 ? "99+" : msgBadge})` : ""}
            </ButtonLink>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
            <li>{t("studentTodo1")}</li>
            <li>{t("studentTodo2")}</li>
            <li>{t("studentTodo3")}</li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-1">
            <ButtonLink href={`/${locale}/tutors`} pendingLabel={tCommon("loading")}>
              {t("studentBookCta")}
            </ButtonLink>
            <ButtonLink href={`/${locale}/tutors`} variant="outline" pendingLabel={tCommon("loading")}>
              {t("studentDirectoryCta")}
            </ButtonLink>
          </div>
        </div>
      </PageSection>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("studentUpcomingTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {(upcoming ?? []).length === 0 ? (
            <p className="ui-empty-state">{t("studentNoUpcoming")}</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {(upcoming ?? []).map((b) => (
                <li
                  key={b.id}
                  className="ui-list-row flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-[#1D2129]">
                      {b.session_date} · {String(b.start_time).slice(0, 5)} · {b.subject}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {nameById.get(b.tutor_id) ?? t("unknownTutor")} · {b.payment_status} ·{" "}
                      {b.tutor_decision === "accepted" ? t("decisionAccepted") : t("decisionPending")}
                    </p>
                  </div>
                  <ButtonLink
                    href={`/${locale}/messages/${b.tutor_id}`}
                    variant="outline"
                    size="sm"
                    pendingLabel={tCommon("loading")}
                  >
                    {t("messageTutor")}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("readyToReviewTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {readyToReview.length === 0 ? (
            <p className="ui-empty-state">{t("readyToReviewEmpty")}</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {readyToReview.map((b) => (
                <li
                  key={b.id}
                  className="ui-list-row flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-[#1D2129]">
                      {b.session_date} · {String(b.start_time).slice(0, 5)} · {b.subject}
                    </p>
                    <p className="text-xs text-zinc-600">{nameById.get(b.tutor_id) ?? t("unknownTutor")}</p>
                  </div>
                  <ButtonLink href={`/${locale}/reviews/new?bookingId=${b.id}`} size="sm" pendingLabel={tCommon("loading")}>
                    {t("reviewTutor")}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
