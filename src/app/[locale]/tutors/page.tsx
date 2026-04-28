import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { TutorFiltersMobileDrawer } from "@/components/tutor-filters-mobile-drawer";
import { PageSection } from "@/components/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TutorDirectoryFilterForm } from "@/components/tutor-directory-filter-form";
import { parseServiceAreasFromDb } from "@/lib/tutor-setup-form-helpers";
import {
  clampRateRange,
  parseAreasFromSearchParams,
  parseSubjectsFromSearchParams,
} from "@/lib/tutor-directory-filters";

type TutorsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    subject?: string | string[];
    grade?: string;
    district?: string;
    area?: string | string[];
    verified?: string;
    min?: string;
    max?: string;
    sort?: string;
  }>;
};

type TutorRow = {
  id: string;
  display_name: string;
  district: string;
  hourly_rate: number;
  service_type: string;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  education_background: string;
  exact_location: string | null;
  profile_photo: string | null;
  created_at: string;
};
type ReviewRatingRow = {
  tutor_id: string;
  rating: number;
};

export default async function TutorsDirectoryPage({ params, searchParams }: TutorsPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations("Directory");

  const supabase = await createClient();

  const subjects = parseSubjectsFromSearchParams(query.subject);
  const grade = query.grade?.trim() ?? "";
  const district = query.district?.trim() ?? "";
  const areas = parseAreasFromSearchParams(query.area);
  const verifiedOnly = query.verified === "1";
  const { min, max } = clampRateRange(
    query.min ? Number(query.min) : 100,
    query.max ? Number(query.max) : 1000,
  );
  const sort = query.sort ?? "rating";

  const filterFormKey = [
    subjects.join(","),
    grade,
    district,
    areas.join(","),
    String(min),
    String(max),
    sort,
    verifiedOnly ? "1" : "0",
  ].join("|");

  const hasActiveFilters =
    subjects.length > 0 ||
    Boolean(grade) ||
    Boolean(district) ||
    areas.length > 0 ||
    verifiedOnly ||
    query.min !== undefined ||
    query.max !== undefined;

  /** null = no subject/grade filter; [] = filter applied but no tutor_subjects rows match; non-empty = restrict to these ids */
  let tutorIdsFilter: string[] | null = null;
  let subjectQueryErrorMessage: string | null = null;

  if (subjects.length > 0 || grade) {
    let subjectQuery = supabase.from("tutor_subjects").select("tutor_id");
    if (subjects.length > 0) subjectQuery = subjectQuery.in("subject", subjects);
    if (grade) subjectQuery = subjectQuery.eq("grade_level", grade);

    const { data: subjectMatches, error: subjectError } = await subjectQuery;
    if (subjectError) {
      subjectQueryErrorMessage = subjectError.message;
    } else {
      tutorIdsFilter = Array.from(new Set((subjectMatches ?? []).map((row) => row.tutor_id)));
    }
  }

  let tutors: TutorRow[] | null = null;
  let tutorsError: { message: string } | null = null;

  if (subjectQueryErrorMessage) {
    tutors = [];
    tutorsError = { message: subjectQueryErrorMessage };
  } else if (tutorIdsFilter !== null && tutorIdsFilter.length === 0) {
    tutors = [];
  } else {
    let tutorsQuery = supabase
      .from("tutor_profiles")
      .select(
        "id, display_name, district, exact_location, hourly_rate, service_type, is_verified, average_rating, total_reviews, education_background, profile_photo, created_at",
      )
      .gte("hourly_rate", min)
      .lte("hourly_rate", max);

    if (tutorIdsFilter && tutorIdsFilter.length > 0) {
      tutorsQuery = tutorsQuery.in("id", tutorIdsFilter);
    }

    if (district) {
      tutorsQuery = tutorsQuery.eq("district", district);
    }
    if (areas.length > 0) {
      const orExpr = areas.map((area) => `exact_location.ilike.%|${area}|%`).join(",");
      tutorsQuery = tutorsQuery.or(orExpr);
    }

    if (verifiedOnly) {
      tutorsQuery = tutorsQuery.eq("is_verified", true);
    }

    if (sort === "price") {
      tutorsQuery = tutorsQuery.order("hourly_rate", { ascending: true });
    } else if (sort === "rating") {
      tutorsQuery = tutorsQuery
        .order("average_rating", { ascending: false })
        .order("total_reviews", { ascending: false });
    } else {
      tutorsQuery = tutorsQuery.order("created_at", { ascending: false });
    }

    const { data, error } = await tutorsQuery;
    tutors = data as TutorRow[] | null;
    tutorsError = error;
  }

  const tutorIds = (tutors ?? []).map((item) => item.id);
  const { data: reviewRatingRows } =
    tutorIds.length > 0
      ? await supabase.from("reviews").select("tutor_id, rating").in("tutor_id", tutorIds)
      : { data: [] as ReviewRatingRow[] };
  const { data: subjectRows } =
    tutorIds.length > 0
      ? await supabase
          .from("tutor_subjects")
          .select("tutor_id, subject, grade_level")
          .in("tutor_id", tutorIds)
      : { data: [] as { tutor_id: string; subject: string; grade_level: string }[] };

  const subjectMap = new Map<string, string[]>();
  const reviewStatsMap = new Map<string, { total: number; avg: number }>();
  (subjectRows ?? []).forEach((row) => {
    const label = row.subject?.trim() ?? "";
    if (!label) return;
    const list = subjectMap.get(row.tutor_id) ?? [];
    if (!list.includes(label)) {
      list.push(label);
    }
    subjectMap.set(row.tutor_id, list);
  });
  (reviewRatingRows ?? []).forEach((row) => {
    const current = reviewStatsMap.get(row.tutor_id) ?? { total: 0, avg: 0 };
    const nextTotal = current.total + 1;
    const nextAvg = (current.avg * current.total + Number(row.rating ?? 0)) / nextTotal;
    reviewStatsMap.set(row.tutor_id, { total: nextTotal, avg: nextAvg });
  });

  return (
    <main className="space-y-8">
      <PageSection
        title={t("title")}
        description={t("subtitle")}
        action={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${locale}`}>{t("home")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/${locale}/booking/new`}>{t("book")}</Link>
            </Button>
          </>
        }
      >
        {tutorsError ? (
          <p className="ui-alert ui-alert-error">{tutorsError.message}</p>
        ) : null}
      </PageSection>

      <section className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <aside className="hidden h-fit lg:sticky lg:top-4 lg:block">
          <Card>
            <CardContent className="pt-5">
              <TutorDirectoryFilterForm
                key={filterFormKey}
                locale={locale}
                defaults={{
                  subjects,
                  grade,
                  district,
                  areas,
                  min,
                  max,
                  sort,
                  verifiedOnly,
                }}
              />
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-4">
          <TutorFiltersMobileDrawer
            locale={locale}
            filterKey={filterFormKey}
            defaults={{
              subjects,
              grade,
              district,
              areas,
              min,
              max,
              sort,
              verifiedOnly,
            }}
          />

          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-zinc-600">
                {tutors?.length ?? 0} {t("resultsCount")}
              </p>
              {!tutorsError && (tutors?.length ?? 0) === 0 && hasActiveFilters ? (
                <p className="ui-empty-state mt-2">{t("empty")}</p>
              ) : null}
            </CardContent>
          </Card>
          <section className="grid gap-4 md:grid-cols-2">
            {(tutors ?? []).map((tutor) => {
              const realtime = reviewStatsMap.get(tutor.id);
              const displayRating = realtime ? realtime.avg : Number(tutor.average_rating ?? 0);
              const displayReviews = realtime ? realtime.total : Number(tutor.total_reviews ?? 0);
              const serviceAreas = parseServiceAreasFromDb(tutor.exact_location, tutor.district);
              const shownAreas = serviceAreas.slice(0, 3);
              const remainingAreas = Math.max(0, serviceAreas.length - shownAreas.length);
              return (
                <Card key={tutor.id} className="ui-hover-lift">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[#1D2129]">{tutor.display_name}</h2>
                      <p className="text-sm text-zinc-600">
                        {tutor.district} · MOP{tutor.hourly_rate}/hr · {tutor.service_type}
                      </p>
                    </div>
                    {tutor.is_verified ? (
                      <Badge variant="default" className="shrink-0">
                        {t("verified")}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-zinc-700">
                    ⭐ {displayRating.toFixed(1)} · {displayReviews} {t("reviews")}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm text-zinc-700">{tutor.education_background}</p>
                  <p className="mt-2 text-xs text-zinc-600">
                    {(subjectMap.get(tutor.id) ?? []).slice(0, 4).join(" · ") || t("noSubjects")}
                  </p>
                  {shownAreas.length > 0 ? (
                    <p className="mt-1 text-xs text-zinc-600">
                      {t("serviceAreasLabel")}: {shownAreas.join(" · ")}
                      {remainingAreas > 0 ? ` +${remainingAreas}` : ""}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/${locale}/tutors/${tutor.id}`}>{t("viewProfile")}</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/${locale}/booking/new?tutorId=${tutor.id}`}>{t("bookThis")}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </section>
        </div>
      </section>
    </main>
  );
}
