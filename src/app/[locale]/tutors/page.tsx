import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { TutorFiltersMobileDrawer } from "@/components/tutor-filters-mobile-drawer";
import { PageSection } from "@/components/page-section";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { TutorDirectoryFilterForm } from "@/components/tutor-directory-filter-form";
import { parseServiceAreasFromDb } from "@/lib/tutor-setup-form-helpers";
import {
  clampRateRange,
  parseAreasFromSearchParams,
  parseSubjectsFromSearchParams,
} from "@/lib/tutor-directory-filters";
import { displayMacauRegion, displayMacauSubarea } from "@/lib/macau-location-display";

type TutorsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    subject?: string | string[];
    grade?: string;
    district?: string;
    area?: string | string[];
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

export default async function TutorsDirectoryPage({ params, searchParams }: TutorsPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations("Directory");
  const tBooking = await getTranslations("Booking");
  const tCommon = await getTranslations("Common");

  const supabase = await createClient();

  const subjects = parseSubjectsFromSearchParams(query.subject);
  const grade = query.grade?.trim() ?? "";
  const district = query.district?.trim() ?? "";
  const areas = parseAreasFromSearchParams(query.area);
  const { min, max } = clampRateRange(
    query.min ? Number(query.min) : 0,
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
  ].join("|");

  const hasActiveFilters =
    subjects.length > 0 ||
    Boolean(grade) ||
    Boolean(district) ||
    areas.length > 0 ||
    query.min !== undefined ||
    query.max !== undefined;

  /** null = no subject/grade filter; [] = filter applied but no tutor_subjects rows match; non-empty = restrict to these ids */
  let tutorIdsFilter: string[] | null = null;
  let subjectQueryErrorMessage: string | null = null;

  if (subjects.length > 0 || grade) {
    const subjectFilterStart = Date.now();
    const [{ data: subjectMatches, error: subjectError }, { data: gradeMatches, error: gradeError }] =
      await Promise.all([
        subjects.length > 0
          ? supabase.from("tutor_subjects").select("tutor_id").in("subject", subjects)
          : Promise.resolve({ data: null, error: null }),
        grade
          ? supabase.from("tutor_subjects").select("tutor_id").eq("grade_level", grade)
          : Promise.resolve({ data: null, error: null }),
      ]);
    console.info("[perf][tutors-directory][subject-filter-query-ms]", Date.now() - subjectFilterStart);

    if (subjectError || gradeError) {
      subjectQueryErrorMessage = subjectError?.message ?? gradeError?.message ?? "Subject filter query failed.";
    } else {
      const subjectTutorIds = new Set((subjectMatches ?? []).map((row) => row.tutor_id));
      const gradeTutorIds = new Set((gradeMatches ?? []).map((row) => row.tutor_id));

      if (subjects.length > 0 && grade) {
        tutorIdsFilter = [...subjectTutorIds].filter((id) => gradeTutorIds.has(id));
      } else if (subjects.length > 0) {
        tutorIdsFilter = [...subjectTutorIds];
      } else {
        tutorIdsFilter = [...gradeTutorIds];
      }
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
    const tutorsQueryStart = Date.now();
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
    console.info("[perf][tutors-directory][tutor-profiles-query-ms]", Date.now() - tutorsQueryStart);
    tutors = data as TutorRow[] | null;
    tutorsError = error;
  }

  const tutorIds = (tutors ?? []).map((item) => item.id);
  const subjectRowsStart = Date.now();
  const { data: subjectRows } =
    tutorIds.length > 0
      ? await supabase
          .from("tutor_subjects")
          .select("tutor_id, subject, grade_level")
          .in("tutor_id", tutorIds)
      : { data: [] as { tutor_id: string; subject: string; grade_level: string }[] };
  console.info("[perf][tutors-directory][subjects-query-ms]", Date.now() - subjectRowsStart);

  const subjectMap = new Map<string, string[]>();
  (subjectRows ?? []).forEach((row) => {
    const label = row.subject?.trim() ?? "";
    if (!label) return;
    const list = subjectMap.get(row.tutor_id) ?? [];
    if (!list.includes(label)) {
      list.push(label);
    }
    subjectMap.set(row.tutor_id, list);
  });

  const sortedTutors = [...(tutors ?? [])].sort((a, b) => {
    const aSubjects = subjectMap.get(a.id) ?? [];
    const bSubjects = subjectMap.get(b.id) ?? [];
    const aMatchCount = subjects.length > 0 ? aSubjects.filter((s) => subjects.includes(s)).length : 0;
    const bMatchCount = subjects.length > 0 ? bSubjects.filter((s) => subjects.includes(s)).length : 0;

    // 1) Always rank by how many selected subjects the tutor matches.
    if (bMatchCount !== aMatchCount) return bMatchCount - aMatchCount;

    // 2) Secondary sorting follows the chosen sort option in the UI.
    if (sort === "price") {
      if (a.hourly_rate !== b.hourly_rate) return a.hourly_rate - b.hourly_rate;
      return a.display_name.localeCompare(b.display_name);
    }

    if (sort === "rating") {
      const aRating = Number(a.average_rating ?? 0);
      const bRating = Number(b.average_rating ?? 0);
      if (bRating !== aRating) return bRating - aRating;

      const aReviews = Number(a.total_reviews ?? 0);
      const bReviews = Number(b.total_reviews ?? 0);
      if (bReviews !== aReviews) return bReviews - aReviews;

      return a.display_name.localeCompare(b.display_name);
    }

    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    if (bTime !== aTime) return bTime - aTime;
    return a.display_name.localeCompare(b.display_name);
  });

  return (
    <main className="space-y-8">
      <PageSection
        title={t("title")}
        description={t("subtitle")}
        action={
          <>
            <ButtonLink href={`/${locale}`} variant="outline" size="sm" pendingLabel={tCommon("loading")}>
              {t("home")}
            </ButtonLink>
            <ButtonLink href={`/${locale}/booking/new`} size="sm" pendingLabel={tCommon("loading")}>
              {t("book")}
            </ButtonLink>
          </>
        }
      >
        <p className="mb-4 text-sm leading-relaxed text-[#94A3B8]">{tBooking("studentsOnlyBookingNote")}</p>
        {tutorsError ? (
          <p className="ui-alert ui-alert-error">{tutorsError.message}</p>
        ) : null}
      </PageSection>

      <section className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <aside className="hidden h-fit lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
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
            {sortedTutors.map((tutor) => {
              const displayRating = Number(tutor.average_rating ?? 0);
              const displayReviews = Number(tutor.total_reviews ?? 0);
              const serviceAreas = parseServiceAreasFromDb(tutor.exact_location, tutor.district);
              const shownAreas = serviceAreas.slice(0, 3);
              const remainingAreas = Math.max(0, serviceAreas.length - shownAreas.length);
              return (
                <Card key={tutor.id} className="ui-hover-lift">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-[#1D2129]">{tutor.display_name}</h2>
                        <span className="rounded-full border border-[#E6C699]/40 bg-[#E6C699]/10 px-2 py-0.5 text-xs font-semibold text-[#E6C699]">
                          MOP {tutor.hourly_rate}/hr
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-zinc-600">{displayMacauRegion(locale, tutor.district)}</span>
                        <span className="text-zinc-400">·</span>
                        <span className="text-zinc-600">{tutor.service_type}</span>
                      </div>
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
                      {t("serviceAreasLabel")}:{" "}
                      {shownAreas.map((a) => displayMacauSubarea(locale, a)).join(" · ")}
                      {remainingAreas > 0 ? ` +${remainingAreas}` : ""}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink href={`/${locale}/tutors/${tutor.id}`} variant="outline" size="sm" pendingLabel={tCommon("loading")}>
                      {t("viewProfile")}
                    </ButtonLink>
                    <ButtonLink href={`/${locale}/booking/new?tutorId=${tutor.id}`} size="sm" pendingLabel={tCommon("loading")}>
                      {t("bookThis")}
                    </ButtonLink>
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
