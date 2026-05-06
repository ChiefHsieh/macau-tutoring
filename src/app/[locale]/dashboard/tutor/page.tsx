import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageSection } from "@/components/page-section";
import { ButtonLink } from "@/components/button-link";
import { SubmitButton } from "@/components/submit-button";
import { DashboardNameForm } from "@/components/dashboard-name-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptBookingAction, rejectBookingAction } from "./actions";

type TutorDashboardProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ setup?: string; accepted?: string; rejected?: string; error?: string; nameUpdated?: string }>;
};

export default async function TutorDashboard({
  params,
  searchParams,
}: TutorDashboardProps) {
  const { locale } = await params;
  const query = await searchParams;
  const { profile, user } = await requireProfile(locale);
  if (profile.role !== "tutor") redirect(`/${locale}/dashboard`);
  const t = await getTranslations("Dashboard");
  const tCommon = await getTranslations("Common");

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: myProfile } = await supabase
    .from("tutor_profiles")
    .select("average_rating, total_reviews, is_verified, created_at")
    .eq("id", user.id)
    .maybeSingle();
  const [{ data: latestSubjectRow }, { data: latestVerificationRow }] = await Promise.all([
    supabase
      .from("tutor_subjects")
      .select("created_at")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tutor_verification_documents")
      .select("created_at")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const { data: ratingRows } = await supabase.from("reviews").select("rating").eq("tutor_id", user.id);
  const { data: latestReviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const realtimeReviewCount = (ratingRows ?? []).length;
  const realtimeAverageRating =
    realtimeReviewCount > 0
      ? (ratingRows ?? []).reduce((sum, row) => sum + Number(row.rating ?? 0), 0) / realtimeReviewCount
      : 0;
  const displayReviewCount = realtimeReviewCount > 0 ? realtimeReviewCount : (myProfile?.total_reviews ?? 0);
  const displayAverageRating =
    realtimeReviewCount > 0 ? realtimeAverageRating : Number(myProfile?.average_rating ?? 0);
  const portfolioUpdatedAtCandidates = [
    myProfile?.created_at ?? null,
    latestSubjectRow?.created_at ?? null,
    latestVerificationRow?.created_at ?? null,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => new Date(value));
  const portfolioUpdatedAt =
    portfolioUpdatedAtCandidates.length > 0
      ? new Date(Math.max(...portfolioUpdatedAtCandidates.map((d) => d.getTime())))
      : null;

  const { data: upcoming } = await supabase
    .from("bookings")
    .select("id, session_date, start_time, end_time, subject, payment_status, student_id, tutor_decision")
    .eq("tutor_id", user.id)
    .eq("session_status", "upcoming")
    .gte("session_date", today)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(12);

  const studentIds = [...new Set((upcoming ?? []).map((b) => b.student_id))];
  const { data: students } =
    studentIds.length > 0
      ? await supabase.from("users").select("id, full_name").in("id", studentIds)
      : { data: [] as { id: string; full_name: string }[] };

  const nameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));

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
      <PageSection title={t("tutorTitle")} description={`${t("welcome")}: ${profile.full_name}`}>
        <div className="space-y-4">
          {query.setup === "done" ? (
            <p className="ui-alert ui-alert-success">{t("setupSuccess")}</p>
          ) : null}
          {query.accepted ? (
            <p className="ui-alert ui-alert-success">{t("bookingAcceptedToast")}</p>
          ) : null}
          {query.rejected ? (
            <p className="ui-alert ui-alert-warning">{t("bookingRejectedToast")}</p>
          ) : null}
          {query.error ? (
            <p className="ui-alert ui-alert-error">
              {query.error === "name_invalid_length" ? t("nameInvalidLength") : decodeURIComponent(query.error)}
            </p>
          ) : null}
          {query.nameUpdated ? <p className="ui-alert ui-alert-success">{t("nameUpdated")}</p> : null}
          <DashboardNameForm
            locale={locale}
            returnTo={`/${locale}/dashboard/tutor`}
            currentName={profile.full_name ?? ""}
            label={t("nameFieldLabel")}
            submitText={t("nameSave")}
            pendingText={tCommon("loading")}
          />
          <p
            className={`ui-alert ${
              myProfile?.is_verified
                ? "ui-alert-success"
                : "ui-alert-warning"
            }`}
          >
            {myProfile?.is_verified ? t("tutorVerifiedStatus") : t("tutorPendingStatus")}
          </p>
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
            <li>{t("tutorTodo1")}</li>
            <li>{t("tutorTodo2")}</li>
            <li>{t("tutorTodo3")}</li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-1">
            <ButtonLink href={`/${locale}/tutor/profile/setup`} pendingLabel={tCommon("loading")}>
              {t("tutorSetupCta")}
            </ButtonLink>
            <ButtonLink href={`/${locale}/tutor/availability`} variant="outline" pendingLabel={tCommon("loading")}>
              {t("availabilityCta")}
            </ButtonLink>
          </div>
          <Card className="border-[#1A2456] bg-[#0A0F35]">
            <CardContent className="space-y-3 pt-5">
              <p className="text-base font-semibold text-white">{t("portfolioSectionTitle")}</p>
              <p className="text-sm text-[#E2E8F0]">{t("portfolioSectionBody")}</p>
              <p className="text-xs text-[#94A3B8]">
                {t("portfolioLastUpdated", {
                  date: portfolioUpdatedAt
                    ? portfolioUpdatedAt.toLocaleString(locale === "en" ? "en-GB" : "zh-HK")
                    : "—",
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={`/${locale}/tutor/profile/setup`} pendingLabel={tCommon("loading")}>
                  {t("portfolioSectionCta")}
                </ButtonLink>
                <ButtonLink href={`/${locale}/tutor/availability`} variant="outline" pendingLabel={tCommon("loading")}>
                  {t("availabilityCta")}
                </ButtonLink>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageSection>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("upcomingBookingsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {(upcoming ?? []).length === 0 ? (
            <p className="ui-empty-state">{t("noUpcomingBookings")}</p>
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
                      {nameById.get(b.student_id) ?? t("unknownStudent")} · {b.payment_status} ·{" "}
                      {b.tutor_decision === "accepted" ? t("decisionAccepted") : t("decisionPending")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {b.tutor_decision !== "accepted" ? (
                      <>
                        <form action={acceptBookingAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="booking_id" value={b.id} />
                          <SubmitButton type="submit" size="sm" pendingLabel={tCommon("loading")}>
                            {t("acceptBooking")}
                          </SubmitButton>
                        </form>
                        <form action={rejectBookingAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="booking_id" value={b.id} />
                          <SubmitButton
                            type="submit"
                            size="sm"
                            variant="outline"
                            className="text-red-700"
                            pendingLabel={tCommon("loading")}
                          >
                            {t("rejectBooking")}
                          </SubmitButton>
                        </form>
                      </>
                    ) : null}
                    <ButtonLink
                      href={`/${locale}/messages/${b.student_id}`}
                      variant="outline"
                      size="sm"
                      pendingLabel={tCommon("loading")}
                    >
                      {t("messageStudent")}
                    </ButtonLink>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("reviewsOverviewTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-sm text-zinc-700">
            ⭐ {displayAverageRating.toFixed(1)} · {displayReviewCount} {t("reviewsWord")}
          </p>
          {(latestReviews ?? []).length === 0 ? (
            <p className="ui-empty-state">{t("noReviewsYet")}</p>
          ) : (
            <ul className="space-y-2">
              {(latestReviews ?? []).map((r, idx) => (
                <li key={`${r.created_at}-${idx}`} className="ui-list-row rounded-md border border-zinc-100 px-3 py-2">
                  <p className="text-sm font-medium text-[#1D2129]">{"★".repeat(Math.max(1, Math.min(5, Number(r.rating))))}</p>
                  {r.comment ? <p className="text-sm text-zinc-700">{r.comment}</p> : null}
                  <p className="text-xs text-zinc-500">{String(r.created_at).slice(0, 10)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
