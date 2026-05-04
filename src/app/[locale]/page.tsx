import { getTranslations } from "next-intl/server";
import {
  Activity,
  BookOpen,
  CalendarCheck2,
  GraduationCap,
  Megaphone,
  Search,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getDemoRecentLeadRows } from "@/lib/demo-recent-leads";
import { teachableSubjectOptions } from "@/lib/tutor-setup-form-helpers";
import { FeaturedTutorCard } from "@/components/featured-tutor-card";
import { RecentDemandSection, type RecentDemandCardModel } from "@/components/recent-demand-section";
import { LandingSiteFooter } from "@/components/landing-site-footer";
import { PageSection } from "@/components/page-section";
import { ButtonLink } from "@/components/button-link";
import { Card, CardContent } from "@/components/ui/card";

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  const t = await getTranslations("Landing");
  const tHome = await getTranslations("Home");
  const tCommon = await getTranslations("Common");

  let tutorCount = 0;
  let subjectCount = teachableSubjectOptions.length;
  let studentCount = 0;
  let reviewActivityCount = 0;
  let verifiedTutorCount = 0;
  let activeLeadCount = 0;
  let bookingMatchCount = 0;

  const featured: Array<{
    id: string;
    display_name: string;
    district: string;
    hourly_rate: number;
    service_type: string;
    is_verified: boolean;
    average_rating: number;
    total_reviews: number;
    education_background: string;
    profile_photo: string | null;
    subjectSummary: string;
  }> = [];

  type FeedRow = {
    lead_id: string;
    child_grade: string;
    subject: string;
    district: string | null;
    budget_max: number | null;
    created_at: string;
  };
  let demandFeedRows: FeedRow[] = [];
  let demandsFromLiveFeed = false;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();

    const [
      { count: tutorCountResult },
      { count: studentCountResult },
      { count: reviewActivityCountResult },
      { count: verifiedTutorCountResult },
      { count: bookingMatchCountResult },
      { count: activeLeadCountResult },
      { data: featuredRows },
    ] = await Promise.all([
      supabase.from("tutor_profiles").select("id", { head: true, count: "exact" }),
      supabase.from("users").select("id", { head: true, count: "exact" }).eq("role", "student"),
      supabase.from("reviews").select("id", { head: true, count: "exact" }),
      supabase.from("tutor_profiles").select("id", { head: true, count: "exact" }).eq("is_verified", true),
      supabase.from("bookings").select("id", { head: true, count: "exact" }),
      supabase.from("bookings").select("id", { head: true, count: "exact" }).gte("created_at", sinceIso),
      supabase
        .from("tutor_profiles")
        .select(
          "id, display_name, district, hourly_rate, service_type, is_verified, average_rating, total_reviews, education_background, profile_photo",
        )
        .neq("display_name", "")
        .order("created_at", { ascending: false })
        .limit(9),
    ]);

    tutorCount = tutorCountResult ?? 0;
    studentCount = studentCountResult ?? 0;
    reviewActivityCount = reviewActivityCountResult ?? 0;
    verifiedTutorCount = verifiedTutorCountResult ?? 0;
    bookingMatchCount = bookingMatchCountResult ?? 0;
    activeLeadCount = activeLeadCountResult ?? 0;
    featured.push(
      ...(featuredRows ?? []).map((row) => ({
        ...row,
        subjectSummary: "",
      })),
    );

    const featuredIds = featured.map((item) => item.id);
    if (featuredIds.length > 0) {
      const [{ data: subjectLines }, { data: reviewLines }] = await Promise.all([
        supabase
          .from("tutor_subjects")
          .select("tutor_id, subject, grade_level")
          .in("tutor_id", featuredIds),
        supabase
          .from("reviews")
          .select("tutor_id, rating")
          .in("tutor_id", featuredIds),
      ]);

      const map = new Map<string, string[]>();
      const reviewStatsMap = new Map<string, { total: number; avg: number }>();
      (subjectLines ?? []).forEach((row) => {
        const label = row.subject?.trim() ?? "";
        if (!label) return;
        const list = map.get(row.tutor_id) ?? [];
        if (!list.includes(label)) {
          list.push(label);
        }
        map.set(row.tutor_id, list);
      });
      (reviewLines ?? []).forEach((row) => {
        const current = reviewStatsMap.get(row.tutor_id) ?? { total: 0, avg: 0 };
        const nextTotal = current.total + 1;
        const nextAvg = (current.avg * current.total + Number(row.rating ?? 0)) / nextTotal;
        reviewStatsMap.set(row.tutor_id, { total: nextTotal, avg: nextAvg });
      });

      featured.forEach((row) => {
        row.subjectSummary = (map.get(row.id) ?? []).slice(0, 3).join(" · ");
        const realtime = reviewStatsMap.get(row.id);
        if (realtime) {
          row.average_rating = realtime.avg;
          row.total_reviews = realtime.total;
        }
      });
    }

    const { data: feedData, error: feedError } = await supabase
      .from("parent_lead_public_feed")
      .select("lead_id, child_grade, subject, district, budget_max, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    if (feedError) {
      console.warn("[Landing] parent_lead_public_feed:", feedError.message);
    }

    if (!feedError && feedData && feedData.length > 0) {
      demandFeedRows = feedData as FeedRow[];
      demandsFromLiveFeed = true;
    }
  }

  if (!demandsFromLiveFeed) {
    demandFeedRows = getDemoRecentLeadRows(locale);
  }

  const dateLocale = locale === "en" ? "en-GB" : "zh-HK";
  const recentDemandItems: RecentDemandCardModel[] = demandFeedRows.map((row) => ({
    id: row.lead_id,
    grade: row.child_grade,
    subject: row.subject,
    districtLine: row.district?.trim() ? row.district.trim() : t("recentDemandsDistrictUnknown"),
    budgetLine:
      row.budget_max != null && row.budget_max > 0
        ? t("recentDemandsBudget", { amount: row.budget_max })
        : t("recentDemandsBudgetOpen"),
    postedLabel: new Date(row.created_at).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    isDemo: !demandsFromLiveFeed,
  }));

  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() ?? "";
  const contactWeChat = process.env.NEXT_PUBLIC_CONTACT_WECHAT?.trim() ?? "";
  const contactHours = process.env.NEXT_PUBLIC_CONTACT_HOURS?.trim() ?? "";

  /** Public stat floor: never show below 43 once we surface this metric. */
  const displayStudentCount = Math.max(43, studentCount);
  /** Public stat floor for 30-day active demand card. */
  const displayActiveLeadCount = Math.max(51, activeLeadCount);
  /** Public stat floor for cumulative bookings / matches card. */
  const displayBookingMatchCount = Math.max(45, bookingMatchCount);

  return (
    <main className="flex flex-col gap-0 md:gap-0">
      <Card className="rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(218,192,163,0.08),transparent_70%)] p-4 shadow-sm md:p-5">
        <div className="grid gap-8 lg:grid-cols-9 lg:items-center">
          <div className="space-y-4 lg:col-span-5">
            <div className="flex gap-2">
              <ButtonLink
                href="/zh-HK"
                variant={locale === "zh-HK" ? "default" : "outline"}
                size="sm"
                pendingLabel={tCommon("loading")}
              >
                {tHome("langZh")}
              </ButtonLink>
              <ButtonLink
                href="/en"
                variant={locale === "en" ? "default" : "outline"}
                size="sm"
                pendingLabel={tCommon("loading")}
              >
                {tHome("langEn")}
              </ButtonLink>
            </div>
            <h1
              className="ui-hero-brand ui-hero-brand-aurora font-extrabold leading-tight tracking-tight text-[#F8F9FA]"
              style={{ fontSize: "clamp(2.4rem, 11vw, 3.6rem)" }}
            >
              {t("heroTitle")}
            </h1>
            <p className="text-base font-normal leading-relaxed text-[#E2E8F0] md:text-lg">{t("heroSubtitle")}</p>
            <p className="text-sm font-normal leading-relaxed text-[#E2E8F0] md:text-base">{t("heroBody")}</p>
            <ul className="list-inside list-disc space-y-1 text-sm font-normal leading-relaxed text-[#E2E8F0] md:text-base">
              <li>{t("heroValue1")}</li>
              <li>{t("heroValue2")}</li>
              <li>{t("heroValue3")}</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/${locale}/tutors`} pendingLabel={tCommon("loading")}>
                {t("ctaBrowse")}
              </ButtonLink>
              <ButtonLink href={`/${locale}/auth`} variant="outline" pendingLabel={tCommon("loading")}>
                {t("ctaAuth")}
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-4 lg:flex lg:justify-center">
            {/* Pure logo display area, no border/card wrapper. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="A* Quality Tailored Service Premium Tutor Marketplace logo"
              className="mx-auto h-auto w-full max-w-[260px] object-contain lg:max-w-[320px]"
            />
          </div>

        </div>
      </Card>

      <Card className="overflow-hidden border border-[#E6C699]/35 bg-[linear-gradient(135deg,rgba(15,44,89,0.92)_0%,rgba(10,15,53,0.96)_100%)] shadow-md shadow-black/25">
        <CardContent className="space-y-4 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E6C699]/40 bg-[#101742] text-[#E6C699]">
              <Megaphone className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#DAC0A3]">
                {t("developerPostLabel")}
              </p>
              <h2 className="mt-0.5 text-lg font-semibold leading-snug text-[#F8F9FA] md:text-xl">
                {t("developerPostTitle")}
              </h2>
            </div>
          </div>
          <div className="space-y-3 border-l-2 border-[#E6C699]/50 pl-4 text-sm leading-relaxed text-[#E2E8F0] md:text-base">
            <p>{t("developerPostP1")}</p>
            <p>{t("developerPostP2")}</p>
          </div>
          <p className="whitespace-pre-line text-sm italic leading-relaxed text-[#94A3B8]">{t("developerPostSignature")}</p>
        </CardContent>
      </Card>

      <PageSection
        title={t("featuredTitle")}
        action={
          <ButtonLink
            href={`/${locale}/tutors`}
            variant="ghost"
            size="sm"
            className="h-auto px-0 font-medium text-white underline decoration-white/70 underline-offset-2 hover:text-[#E6C699] hover:decoration-[#E6C699]"
            pendingLabel={tCommon("loading")}
          >
            {t("featuredAll")}
          </ButtonLink>
        }
      >
        <div className="grid gap-5 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {featured.map((tutor) => (
            <FeaturedTutorCard
              key={tutor.id}
              locale={locale}
              tutor={tutor}
              labels={{
                verified: t("verified"),
                reviews: t("reviews"),
                noSubjects: t("noSubjects"),
                viewProfile: t("featuredView"),
                book: t("featuredBook"),
                online: t("tagOnline"),
                inPerson: t("tagInPerson"),
                both: t("tagBoth"),
              }}
            />
          ))}
        </div>
      </PageSection>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="ui-hover-lift">
          <CardContent className="pt-5">
            <ShieldCheck className="h-5 w-5 text-[#0F2C59]" />
            <p className="text-sm text-zinc-600">{t("statVerified")}</p>
            <p className="mt-2 text-3xl font-bold text-[#DAC0A3]">{verifiedTutorCount}</p>
          </CardContent>
        </Card>
        <Card className="ui-hover-lift">
          <CardContent className="pt-5">
            <Activity className="h-5 w-5 text-[#0F2C59]" />
            <p className="text-sm text-zinc-600">{t("statActiveLeads")}</p>
            <p className="mt-2 text-3xl font-bold text-[#DAC0A3]">{displayActiveLeadCount}</p>
          </CardContent>
        </Card>
        <Card className="ui-hover-lift">
          <CardContent className="pt-5">
            <CalendarCheck2 className="h-5 w-5 text-[#0F2C59]" />
            <p className="text-sm text-zinc-600">{t("statMatches")}</p>
            <p className="mt-2 text-3xl font-bold text-[#DAC0A3]">{displayBookingMatchCount}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-4 opacity-90">
        <Card className="border-dashed">
          <CardContent className="pt-5">
            <Users className="h-5 w-5 text-zinc-400" />
            <p className="text-sm text-zinc-600">{t("statTutors")}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-800">{tutorCount}</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-5">
            <BookOpen className="h-5 w-5 text-zinc-400" />
            <p className="text-sm text-zinc-600">{t("statSubjects")}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-800">{subjectCount}</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-5">
            <GraduationCap className="h-5 w-5 text-zinc-400" />
            <p className="text-sm text-zinc-600">{t("statStudents")}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-800">{displayStudentCount}</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-5">
            <Star className="h-5 w-5 text-zinc-400" />
            <p className="text-sm text-zinc-600">{t("statLeads")}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-800">{reviewActivityCount}</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PageSection title={t("howParentsTitle")}>
          <ol className="space-y-3 text-sm text-zinc-700">
            <li className="flex items-start gap-2">
              <Search className="mt-0.5 h-4 w-4 shrink-0 text-[#E6C699] drop-shadow-[0_0_4px_rgba(230,198,153,0.55)]" />
              {t("howParents1")}
            </li>
            <li className="flex items-start gap-2">
              <Star className="mt-0.5 h-4 w-4 shrink-0 text-[#E6C699] drop-shadow-[0_0_4px_rgba(230,198,153,0.55)]" />
              {t("howParents2")}
            </li>
            <li className="flex items-start gap-2">
              <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E6C699] drop-shadow-[0_0_4px_rgba(230,198,153,0.55)]" />
              {t("howParents3")}
            </li>
          </ol>
        </PageSection>
        <PageSection title={t("howTutorsTitle")}>
          <ol className="space-y-3 text-sm text-zinc-700">
            <li className="flex items-start gap-2">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#E6C699] drop-shadow-[0_0_4px_rgba(230,198,153,0.55)]" />
              {t("howTutors1")}
            </li>
            <li className="flex items-start gap-2">
              <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E6C699] drop-shadow-[0_0_4px_rgba(230,198,153,0.55)]" />
              {t("howTutors2")}
            </li>
            <li className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#E6C699] drop-shadow-[0_0_4px_rgba(230,198,153,0.55)]" />
              {t("howTutors3")}
            </li>
          </ol>
        </PageSection>
      </div>

      <RecentDemandSection
        title={t("recentDemandsTitle")}
        subtitle={t("recentDemandsSubtitle")}
        demoNote={demandsFromLiveFeed ? null : t("recentDemandsDemoNote")}
        items={recentDemandItems}
        labels={{ demoBadge: t("recentDemandsDemoBadge") }}
      />

      <PageSection title={t("whyTitle")}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-[#1D2129]">{t("why1Title")}</h3>
              <p className="mt-2 text-sm text-zinc-700">{t("why1Body")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-[#1D2129]">{t("why2Title")}</h3>
              <p className="mt-2 text-sm text-zinc-700">{t("why2Body")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-[#1D2129]">{t("why3Title")}</h3>
              <p className="mt-2 text-sm text-zinc-700">{t("why3Body")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-[#1D2129]">{t("why4Title")}</h3>
              <p className="mt-2 text-sm text-zinc-700">{t("why4Body")}</p>
            </CardContent>
          </Card>
        </div>
      </PageSection>

      <Card className="border-transparent bg-[#0F2C59] text-white shadow-sm">
        <CardContent className="space-y-4 p-6 pt-6 md:p-8">
          <h2 className="text-3xl font-bold text-white">{t("ctaSectionTitle")}</h2>
          <p className="max-w-2xl text-sm text-white/90 md:text-base">{t("ctaSectionBody")}</p>
          <ButtonLink
            href={`/${locale}/tutors`}
            className="border border-[#DAC0A3] bg-[#DAC0A3] font-semibold text-[#0F2C59] hover:bg-[#E5D2BC]"
            pendingLabel={tCommon("loading")}
          >
            {t("ctaSectionButton")}
          </ButtonLink>
        </CardContent>
      </Card>

      <LandingSiteFooter
        locale={locale}
        contactWeChat={contactWeChat}
        contactPhone={contactPhone}
        contactHours={contactHours}
      />
    </main>
  );
}
