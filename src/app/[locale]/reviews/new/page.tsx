import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitReviewAction } from "../actions";

type ReviewNewPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ bookingId?: string }>;
};

export default async function ReviewNewPage({ params, searchParams }: ReviewNewPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const bookingId = query.bookingId ?? "";
  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "student") redirect(`/${locale}/dashboard`);

  const t = await getTranslations("Reviews");
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, tutor_id, student_id, subject, session_date, start_time, end_time, tutor_decision")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.student_id !== user.id || booking.tutor_decision !== "accepted") {
    redirect(`/${locale}/dashboard/student?error=${encodeURIComponent(t("notEligible"))}`);
  }

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", booking.id)
    .maybeSingle();
  if (existingReview) {
    redirect(`/${locale}/dashboard/student?error=${encodeURIComponent(t("alreadyReviewed"))}`);
  }

  const { data: tutor } = await supabase
    .from("tutor_profiles")
    .select("display_name")
    .eq("id", booking.tutor_id)
    .maybeSingle();

  return (
    <main className="space-y-6">
      <PageSection
        title={t("title")}
        description={t("subtitle")}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/dashboard/student`}>{t("back")}</Link>
          </Button>
        }
      >
        <Card>
          <CardContent className="space-y-4 pt-5">
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">{t("tutorLabel")}:</span> {tutor?.display_name ?? t("unknownTutor")}
            </p>
            <p className="text-sm text-zinc-700">
              <span className="font-semibold">{t("bookingLabel")}:</span> {booking.session_date} ·{" "}
              {String(booking.start_time).slice(0, 5)}-{String(booking.end_time).slice(0, 5)} · {booking.subject}
            </p>

            <form action={submitReviewAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="booking_id" value={booking.id} />

              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("ratingLabel")}</label>
                <Select name="rating" defaultValue="5">
                  <option value="5">5 - {t("rating5")}</option>
                  <option value="4">4 - {t("rating4")}</option>
                  <option value="3">3 - {t("rating3")}</option>
                  <option value="2">2 - {t("rating2")}</option>
                  <option value="1">1 - {t("rating1")}</option>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">{t("commentLabel")}</label>
                <Textarea name="comment" rows={5} maxLength={1000} placeholder={t("commentPlaceholder")} />
              </div>

              <Button type="submit">{t("submit")}</Button>
            </form>
          </CardContent>
        </Card>
      </PageSection>
    </main>
  );
}
