import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Activity, BookOpen, CalendarCheck2, Search, ShieldCheck, Star, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getDemoRecentLeadRows } from "@/lib/demo-recent-leads";
import { formatRelativeTimeShort } from "@/lib/format-relative-time";
import { FeaturedTutorCard } from "@/components/featured-tutor-card";
import { RecentDemandSection, type RecentDemandCardModel } from "@/components/recent-demand-section";
import { LandingSiteFooter } from "@/components/landing-site-footer";
import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  const t = await getTranslations("Landing");
  const tHome = await getTranslations("Home");

  let tutorCount = 0;
  let subjectCount = 0;
  let reviewCount = 0;
  let leadCount = 0;
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
      { count: subjectCountResult },
      { count: reviewCountResult },
      { count: leadCountResult },
      { count: verifiedTutorCountResult },
      { count: bookingMatchCountResult },
      { count: activeLeadCountResult },
      { data: featuredRows },
    ] = await Promise.all([
      supabase.from("tutor_profiles").select("id", { head: true, count: "exact" }),
      supabase.from("tutor_subjects").select("id", { head: true, count: "exact" }),
      supabase.from("reviews").select("id", { head: true, count: "exact" }),
      supabase.from("parent_leads").select("id", { head: true, count: "exact" }),
      supabase.from("tutor_profiles").select("id", { head: true, count: "exact" }).eq("is_verified", true),
      supabase.from("bookings").select("id", { head: true, count: "exact" }),
      supabase.from("parent_leads").select("id", { head: true, count: "exact" }).gte("created_at", sinceIso),
      supabase
        .from("tutor_profiles")
        .select(
          "id, display_name, district, hourly_rate, service_type, is_verified, average_rating, total_reviews, education_background, profile_photo",
        )
        .neq("display_name", "")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    tutorCount = tutorCountResult ?? 0;
    subjectCount = subjectCountResult ?? 0;
    reviewCount = reviewCountResult ?? 0;
    leadCount = leadCountResult ?? 0;
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
      const { data: subjectLines } = await supabase
        .from("tutor_subjects")
        .select("tutor_id, subject, grade_level")
        .in("tutor_id", featuredIds);

      const map = new Map<string, string[]>();
      (subjectLines ?? []).forEach((row) => {
        const label = `${row.subject} (${row.grade_level})`;
        const list = map.get(row.tutor_id) ?? [];
        list.push(label);
        map.set(row.tutor_id, list);
      });

      featured.forEach((row) => {
        row.subjectSummary = (map.get(row.id) ?? []).slice(0, 3).join(" · ");
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

  const recentDemandItems: RecentDemandCardModel[] = demandFeedRows.map((row) => ({
    id: row.lead_id,
    grade: row.child_grade,
    subject: row.subject,
    districtLine: row.district?.trim() ? row.district.trim() : t("recentDemandsDistrictUnknown"),
    budgetLine:
      row.budget_max != null && row.budget_max > 0
        ? t("recentDemandsBudget", { amount: row.budget_max })
        : t("recentDemandsBudgetOpen"),
    postedLabel: formatRelativeTimeShort(row.created_at, locale),
    isDemo: !demandsFromLiveFeed,
  }));

  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() ?? "";
  const contactWeChat = process.env.NEXT_PUBLIC_CONTACT_WECHAT?.trim() ?? "";
  const contactHours = process.env.NEXT_PUBLIC_CONTACT_HOURS?.trim() ?? "";

  return (
    <main className="flex flex-col gap-0 md:gap-0">
      <Card className="rounded-2xl bg-[radial-gradient(circle_at_top_right,rgba(218,192,163,0.08),transparent_70%)] p-4 shadow-sm md:p-5">
        <div className="grid gap-8 lg:grid-cols-9 lg:items-center">
          <div className="space-y-4 lg:col-span-5">
            <div className="flex gap-2">
              <Button asChild variant={locale === "zh-HK" ? "default" : "outline"} size="sm">
                <Link href="/zh-HK">{tHome("langZh")}</Link>
              </Button>
              <Button asChild variant={locale === "en" ? "default" : "outline"} size="sm">
                <Link href="/en">{tHome("langEn")}</Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#F8F9FA] md:text-5xl">{t("heroTitle")}</h1>
            <p className="text-base font-normal leading-relaxed text-[#E2E8F0] md:text-lg">{t("heroSubtitle")}</p>
            <ul className="list-inside list-disc space-y-1 text-sm font-normal leading-relaxed text-[#E2E8F0] md:text-base">
              <li>{t("heroValue1")}</li>
              <li>{t("heroValue2")}</li>
              <li>{t("heroValue3")}</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/${locale}/tutors`}>{t("ctaBrowse")}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/auth`}>{t("ctaAuth")}</Link>
              </Button>
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

      <PageSection
        title={t("featuredTitle")}
        action={
          <Button asChild variant="ghost" size="sm" className="h-auto px-0 text-[#0F2C59] underline">
            <Link href={`/${locale}/tutors`}>{t("featuredAll")}</Link>
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <p className="mt-2 text-3xl font-bold text-[#DAC0A3]">{activeLeadCount}</p>
          </CardContent>
        </Card>
        <Card className="ui-hover-lift">
          <CardContent className="pt-5">
            <CalendarCheck2 className="h-5 w-5 text-[#0F2C59]" />
            <p className="text-sm text-zinc-600">{t("statMatches")}</p>
            <p className="mt-2 text-3xl font-bold text-[#DAC0A3]">{bookingMatchCount}</p>
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
            <Star className="h-5 w-5 text-zinc-400" />
            <p className="text-sm text-zinc-600">{t("statReviews")}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-800">{reviewCount}</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="pt-5">
            <CalendarCheck2 className="h-5 w-5 text-zinc-400" />
            <p className="text-sm text-zinc-600">{t("statLeads")}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-800">{leadCount}</p>
          </CardContent>
        </Card>
      </section>

      <PageSection title={t("assuranceTitle")}>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-[#1D2129]">{t("assurance1Title")}</h3>
              <p className="mt-2 text-sm text-zinc-700">{t("assurance1Body")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-[#1D2129]">{t("assurance2Title")}</h3>
              <p className="mt-2 text-sm text-zinc-700">{t("assurance2Body")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-[#1D2129]">{t("assurance3Title")}</h3>
              <p className="mt-2 text-sm text-zinc-700">{t("assurance3Body")}</p>
            </CardContent>
          </Card>
        </div>
      </PageSection>

      <div className="grid gap-6 lg:grid-cols-2">
        <PageSection title={t("howParentsTitle")}>
          <ol className="space-y-3 text-sm text-zinc-700">
            <li className="flex items-start gap-2">
              <Search className="mt-0.5 h-4 w-4 shrink-0 text-[#0F2C59]" />
              {t("howParents1")}
            </li>
            <li className="flex items-start gap-2">
              <Star className="mt-0.5 h-4 w-4 shrink-0 text-[#0F2C59]" />
              {t("howParents2")}
            </li>
            <li className="flex items-start gap-2">
              <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F2C59]" />
              {t("howParents3")}
            </li>
          </ol>
        </PageSection>
        <PageSection title={t("howTutorsTitle")}>
          <ol className="space-y-3 text-sm text-zinc-700">
            <li className="flex items-start gap-2">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#0F2C59]" />
              {t("howTutors1")}
            </li>
            <li className="flex items-start gap-2">
              <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0F2C59]" />
              {t("howTutors2")}
            </li>
            <li className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#0F2C59]" />
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

      <PageSection title={t("contactTitle")} description={t("contactBody")}>
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-zinc-500">{t("contactWechatLabel")}</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {contactWeChat || t("contactMissing")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-zinc-500">{t("contactPhoneLabel")}</p>
              {contactPhone ? (
                <a
                  className="mt-2 block text-lg font-semibold text-zinc-900 underline"
                  href={`tel:${contactPhone}`}
                >
                  {contactPhone}
                </a>
              ) : (
                <p className="mt-2 text-lg font-semibold text-zinc-900">{t("contactMissing")}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs font-semibold text-zinc-500">{t("contactHoursLabel")}</p>
              <p className="mt-2 text-sm text-zinc-800">{contactHours || t("contactHoursMissing")}</p>
            </CardContent>
          </Card>
        </div>
      </PageSection>

      <Card className="border-transparent bg-[#0F2C59] text-white shadow-sm">
        <CardContent className="space-y-4 p-6 pt-6 md:p-8">
          <h2 className="text-3xl font-bold text-white">{t("ctaSectionTitle")}</h2>
          <p className="max-w-2xl text-sm text-white/90 md:text-base">{t("ctaSectionBody")}</p>
          <Button
            asChild
            className="border border-[#DAC0A3] bg-[#DAC0A3] font-semibold text-[#0F2C59] hover:bg-[#E5D2BC]"
          >
            <Link href={`/${locale}/tutors`}>{t("ctaSectionButton")}</Link>
          </Button>
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
