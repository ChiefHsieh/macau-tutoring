import { unstable_cache } from "next/cache";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getDemoRecentLeadRows } from "@/lib/demo-recent-leads";
import { createPublicServerClient } from "@/lib/supabase/public-server";

export type LandingFeaturedTutor = {
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
};

export type LandingDemandFeedRow = {
  lead_id: string;
  child_grade: string;
  subject: string;
  district: string | null;
  budget_max: number | null;
  created_at: string;
};

export type LandingHomeData = {
  tutorCount: number;
  studentCount: number;
  reviewActivityCount: number;
  verifiedTutorCount: number;
  activeLeadCount: number;
  bookingMatchCount: number;
  featured: LandingFeaturedTutor[];
  demandFeedRows: LandingDemandFeedRow[];
  demandsFromLiveFeed: boolean;
};

async function queryLandingHomeData(locale: string): Promise<LandingHomeData> {
  const empty: LandingHomeData = {
    tutorCount: 0,
    studentCount: 0,
    reviewActivityCount: 0,
    verifiedTutorCount: 0,
    activeLeadCount: 0,
    bookingMatchCount: 0,
    featured: [],
    demandFeedRows: getDemoRecentLeadRows(locale),
    demandsFromLiveFeed: false,
  };

  if (!hasSupabaseEnv()) return empty;

  const supabase = createPublicServerClient();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const landingStatsQueryStart = Date.now();
  const [
    { count: tutorCountResult },
    { count: studentCountResult },
    { count: reviewActivityCountResult },
    { count: verifiedTutorCountResult },
    { count: bookingMatchCountResult },
    { count: activeLeadCountResult },
    { data: featuredRows },
    { data: feedData, error: feedError },
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
    supabase
      .from("parent_lead_public_feed")
      .select("lead_id, child_grade, subject, district, budget_max, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  console.info("[perf][landing][stats-featured-feed-query-ms]", Date.now() - landingStatsQueryStart, {
    locale,
    featuredCount: featuredRows?.length ?? 0,
    feedCount: feedData?.length ?? 0,
    hasFeedError: !!feedError,
  });

  const featured: LandingFeaturedTutor[] = (featuredRows ?? []).map((row) => ({
    ...row,
    subjectSummary: "",
  }));

  const featuredIds = featured.map((item) => item.id);
  if (featuredIds.length > 0) {
    const featuredMetaQueryStart = Date.now();
    const { data: subjectLines } = await supabase
      .from("tutor_subjects")
      .select("tutor_id, subject")
      .in("tutor_id", featuredIds);
    console.info("[perf][landing][featured-subjects-query-ms]", Date.now() - featuredMetaQueryStart, {
      locale,
      featuredCount: featuredIds.length,
      subjectRows: subjectLines?.length ?? 0,
    });

    const subjectMap = new Map<string, string[]>();
    (subjectLines ?? []).forEach((row) => {
      const label = row.subject?.trim() ?? "";
      if (!label) return;
      const list = subjectMap.get(row.tutor_id) ?? [];
      if (!list.includes(label)) list.push(label);
      subjectMap.set(row.tutor_id, list);
    });

    featured.forEach((row) => {
      row.subjectSummary = (subjectMap.get(row.id) ?? []).slice(0, 3).join(" · ");
    });
  }

  if (feedError) {
    console.warn("[Landing] parent_lead_public_feed:", feedError.message);
  }

  const hasLiveFeed = !feedError && !!feedData && feedData.length > 0;
  return {
    tutorCount: tutorCountResult ?? 0,
    studentCount: studentCountResult ?? 0,
    reviewActivityCount: reviewActivityCountResult ?? 0,
    verifiedTutorCount: verifiedTutorCountResult ?? 0,
    bookingMatchCount: bookingMatchCountResult ?? 0,
    activeLeadCount: activeLeadCountResult ?? 0,
    featured,
    demandFeedRows: hasLiveFeed ? (feedData as LandingDemandFeedRow[]) : getDemoRecentLeadRows(locale),
    demandsFromLiveFeed: hasLiveFeed,
  };
}

export async function getCachedLandingHomeData(locale: string): Promise<LandingHomeData> {
  const run = unstable_cache(() => queryLandingHomeData(locale), ["landing-home-data", locale], {
    revalidate: 120,
    tags: [`landing-home:${locale}`],
  });
  return run();
}
