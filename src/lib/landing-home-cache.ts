import { unstable_cache } from "next/cache";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getDemoRecentLeadRows } from "@/lib/demo-recent-leads";
import { createPublicServerClient } from "@/lib/supabase/public-server";
import { getCachedPlatformRegistrationCounts } from "@/lib/platform-registration-stats";
import { countTutorDirectoryFilterEventsLast30Days } from "@/lib/tutor-directory-filter-demand";
import { fetchLandingAvailableTutors } from "@/lib/landing-available-tutors";
import { enrichLandingTutorCards, type LandingTutorCardModel } from "@/lib/landing-tutor-enrichment";

export type LandingFeaturedTutor = LandingTutorCardModel;

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
  availableToday: LandingFeaturedTutor[];
  availableTomorrow: LandingFeaturedTutor[];
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
    availableToday: [],
    availableTomorrow: [],
    demandFeedRows: getDemoRecentLeadRows(locale),
    demandsFromLiveFeed: false,
  };

  if (!hasSupabaseEnv()) return empty;

  const supabase = createPublicServerClient();
  const registrationCounts = await getCachedPlatformRegistrationCounts();
  const landingStatsQueryStart = Date.now();

  const [
    { count: reviewActivityCountResult },
    { count: verifiedTutorCountResult },
    { count: bookingMatchCountResult },
    activeLeadCountResult,
    { data: featuredRows },
    availableBuckets,
    { data: feedData, error: feedError },
  ] = await Promise.all([
    supabase.from("reviews").select("id", { head: true, count: "exact" }),
    supabase.from("tutor_profiles").select("id", { head: true, count: "exact" }).eq("is_verified", true),
    supabase.from("bookings").select("id", { head: true, count: "exact" }),
    countTutorDirectoryFilterEventsLast30Days(),
    supabase
      .from("tutor_profiles")
      .select(
        "id, display_name, district, hourly_rate, service_type, is_verified, average_rating, total_reviews, education_background, profile_photo",
      )
      .neq("display_name", "")
      .order("created_at", { ascending: false })
      .limit(9),
    fetchLandingAvailableTutors(supabase),
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

  const featured: LandingFeaturedTutor[] = await enrichLandingTutorCards(
    supabase,
    (featuredRows ?? []).map((row) => ({ ...row, subjectSummary: "" })),
  );

  if (feedError) {
    console.warn("[Landing] parent_lead_public_feed:", feedError.message);
  }

  const hasLiveFeed = !feedError && !!feedData && feedData.length > 0;

  return {
    tutorCount: registrationCounts.liveTutorCount,
    studentCount: registrationCounts.liveStudentCount,
    reviewActivityCount: reviewActivityCountResult ?? 0,
    verifiedTutorCount: verifiedTutorCountResult ?? 0,
    bookingMatchCount: bookingMatchCountResult ?? 0,
    activeLeadCount: activeLeadCountResult,
    featured,
    availableToday: availableBuckets.today,
    availableTomorrow: availableBuckets.tomorrow,
    demandFeedRows: hasLiveFeed ? (feedData as LandingDemandFeedRow[]) : getDemoRecentLeadRows(locale),
    demandsFromLiveFeed: hasLiveFeed,
  };
}

export async function getCachedLandingHomeData(locale: string): Promise<LandingHomeData> {
  const run = unstable_cache(() => queryLandingHomeData(locale), ["landing-home-data-v2", locale], {
    revalidate: 120,
    tags: [`landing-home:${locale}`, "landing-active-demand", "landing-availability"],
  });
  return run();
}
