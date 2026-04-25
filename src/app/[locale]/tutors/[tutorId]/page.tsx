import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { parseServiceAreasFromDb } from "@/lib/tutor-setup-form-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TutorPublicPageProps = {
  params: Promise<{ locale: string; tutorId: string }>;
  searchParams?: Promise<{ reviewed?: string }>;
};

function initialsFromDisplayName(displayName: string) {
  const chars = [...displayName.trim()].filter((c) => !/\s/u.test(c));
  const joined = chars.slice(0, 2).join("");
  return joined ? joined.toUpperCase() : "?";
}

function serviceTypeLabel(
  serviceType: string,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (serviceType === "online") return t("tagOnline");
  if (serviceType === "in-person") return t("tagInPerson");
  if (serviceType === "both") return t("tagBoth");
  return serviceType;
}

export default async function TutorPublicProfilePage({ params, searchParams }: TutorPublicPageProps) {
  const { locale, tutorId } = await params;
  const query = (await searchParams) ?? {};
  const t = await getTranslations("TutorPublic");

  const supabase = await createClient();
  const viewer = await getCurrentProfile();
  const { data: tutor, error } = await supabase
    .from("tutor_profiles")
    .select(
      "id, display_name, district, exact_location, hourly_rate, service_type, is_verified, average_rating, total_reviews, education_background, bio, profile_photo, working_period_start, working_period_end",
    )
    .eq("id", tutorId)
    .maybeSingle();

  if (error || !tutor) notFound();

  const { data: subjects } = await supabase
    .from("tutor_subjects")
    .select("subject, grade_level")
    .eq("tutor_id", tutorId);
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false })
    .limit(8);
  const { data: ratingRows } = await supabase.from("reviews").select("rating").eq("tutor_id", tutorId);
  const realtimeReviewCount = (ratingRows ?? []).length;
  const realtimeAverageRating =
    realtimeReviewCount > 0
      ? (ratingRows ?? []).reduce((sum, row) => sum + Number(row.rating ?? 0), 0) / realtimeReviewCount
      : 0;
  const displayReviewCount = realtimeReviewCount > 0 ? realtimeReviewCount : (tutor.total_reviews ?? 0);
  const displayAverageRating =
    realtimeReviewCount > 0 ? realtimeAverageRating : Number(tutor.average_rating ?? 0);

  const uniqueSubjects = Array.from(
    new Set((subjects ?? []).map((s) => String(s.subject ?? "").trim()).filter(Boolean)),
  );
  const uniqueGradeLevels = Array.from(
    new Set((subjects ?? []).map((s) => String(s.grade_level ?? "").trim()).filter(Boolean)),
  );
  const subjectText = uniqueSubjects.length > 0 ? uniqueSubjects.join(" · ") : t("noSubjects");
  const gradeLevelText = uniqueGradeLevels.length > 0 ? uniqueGradeLevels.join(" · ") : "—";
  const serviceAreas = parseServiceAreasFromDb(tutor.exact_location, tutor.district);
  const shownAreas = serviceAreas.slice(0, 3);
  const remainingAreas = Math.max(0, serviceAreas.length - shownAreas.length);
  const photoInitials = initialsFromDisplayName(tutor.display_name);

  return (
    <main className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/tutors`}>{t("back")}</Link>
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit lg:sticky lg:top-4">
          <Card>
            <CardContent className="space-y-4 pt-5">
              <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-full bg-[#F7F9FC]">
                {tutor.profile_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tutor.profile_photo}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-[#4E5969]">
                    {photoInitials}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-[#1D2129]">{tutor.display_name}</h1>
                {tutor.is_verified ? (
                  <Badge variant="default" className="w-fit font-semibold">
                    {t("verified")}
                  </Badge>
                ) : null}
                <p className="text-sm text-zinc-600">
                  ⭐ {displayAverageRating.toFixed(1)} · {displayReviewCount} {t("reviews")}
                </p>
                <p className="text-2xl font-bold text-[#000225]">MOP{tutor.hourly_rate}/hr</p>
                <p className="text-sm text-zinc-700">{tutor.district}</p>
                {shownAreas.length > 0 ? (
                  <p className="text-sm text-zinc-700">
                    {t("serviceAreasLabel")}: {shownAreas.join(" · ")}
                    {remainingAreas > 0 ? ` +${remainingAreas}` : ""}
                  </p>
                ) : null}
                <p className="text-sm text-zinc-700">{serviceTypeLabel(tutor.service_type, t)}</p>
              </div>

              <Button asChild className="w-full">
                <Link href={`/${locale}/booking/new?tutorId=${tutor.id}`}>{t("book")}</Link>
              </Button>
              {viewer?.role === "student" && viewer.id !== tutor.id ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/${locale}/messages/${tutor.id}`}>{t("messageTutor")}</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </aside>

        <Card>
          <CardContent className="space-y-6 pt-5">
            {query.reviewed === "1" ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {t("reviewPostedToast")}
              </div>
            ) : null}
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">{t("subjectsTitle")}</h2>
              <p className="mt-1 text-sm text-zinc-700">{subjectText}</p>
              <p className="mt-2 text-sm font-semibold text-zinc-900">{t("gradeLevelsTitle")}</p>
              <p className="mt-1 text-sm text-zinc-700">{gradeLevelText}</p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-zinc-900">{t("educationTitle")}</h2>
              <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{tutor.education_background}</p>
            </div>

            {tutor.bio ? (
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">{t("bioTitle")}</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{tutor.bio}</p>
              </div>
            ) : null}

            <Card className="border border-[#1A2456] bg-[#0A0F35] shadow-lg shadow-black/40">
              <CardHeader className="space-y-1 p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-white">{t("availabilityTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4 pt-0 text-sm text-[#E2E8F0]">
                <p>
                  {tutor.working_period_start} → {tutor.working_period_end}
                </p>
                <p className="text-xs text-[#94A3B8]">{t("availabilityNote")}</p>
              </CardContent>
            </Card>

            <div id="reviews">
              <h2 className="text-sm font-semibold text-zinc-900">{t("publicReviewsTitle")}</h2>
              {(reviews ?? []).length === 0 ? (
                <p className="mt-1 text-sm text-zinc-700">{t("publicReviewsEmpty")}</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {(reviews ?? []).map((r, idx) => (
                    <li key={`${r.created_at}-${idx}`} className="rounded-lg border border-zinc-200 p-3">
                      <p className="text-sm font-medium text-[#1D2129]">
                        {"★".repeat(Math.max(1, Math.min(5, Number(r.rating))))}
                        <span className="ml-2 text-zinc-500">{t("publicReviewerName")}</span>
                      </p>
                      {r.comment ? <p className="mt-1 text-sm text-zinc-700">{r.comment}</p> : null}
                      <p className="mt-1 text-xs text-zinc-500">{String(r.created_at).slice(0, 10)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
