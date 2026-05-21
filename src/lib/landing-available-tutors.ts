import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchTutorQuickSlotFlags } from "@/lib/tutor-booking-slots";
import { enrichLandingTutorCards, type LandingTutorCardModel } from "@/lib/landing-tutor-enrichment";
import { addDaysMacauYmd, macauTodayYmd } from "@/lib/macau-ymd";

export type LandingAvailableTutors = {
  today: LandingTutorCardModel[];
  tomorrow: LandingTutorCardModel[];
};

const CANDIDATE_LIMIT = 80;
const DEFAULT_SECTION_LIMIT = 6;

function rowToCard(row: {
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
}): LandingTutorCardModel {
  return { ...row, subjectSummary: "" };
}

/** Tutors with at least one bookable slot today / tomorrow (Macau calendar). */
export async function fetchLandingAvailableTutors(
  supabase: SupabaseClient,
  options?: { perSectionLimit?: number },
): Promise<LandingAvailableTutors> {
  const perSectionLimit = options?.perSectionLimit ?? DEFAULT_SECTION_LIMIT;
  const todayYmd = macauTodayYmd();
  const tomorrowYmd = addDaysMacauYmd(todayYmd, 1);

  const { data: profileRows } = await supabase
    .from("tutor_profiles")
    .select(
      "id, display_name, district, hourly_rate, service_type, is_verified, average_rating, total_reviews, education_background, profile_photo, created_at",
    )
    .neq("display_name", "")
    .order("is_verified", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(CANDIDATE_LIMIT);

  const candidates = (profileRows ?? []).map(rowToCard);
  if (candidates.length === 0) {
    return { today: [], tomorrow: [] };
  }

  const flags = await fetchTutorQuickSlotFlags(
    supabase,
    candidates.map((c) => c.id),
    todayYmd,
    tomorrowYmd,
  );

  const todayRaw = candidates.filter((t) => flags.get(t.id)?.today);
  const tomorrowRaw = candidates.filter((t) => flags.get(t.id)?.tomorrow);

  const sortByVerifiedThenRecent = (list: LandingTutorCardModel[]) => {
    const order = new Map((profileRows ?? []).map((r, i) => [r.id, i]));
    return [...list].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
  };

  const todaySlice = sortByVerifiedThenRecent(todayRaw).slice(0, perSectionLimit);
  const tomorrowSlice = sortByVerifiedThenRecent(tomorrowRaw).slice(0, perSectionLimit);

  const enrichIds = new Set([...todaySlice, ...tomorrowSlice].map((t) => t.id));
  const toEnrich = candidates.filter((c) => enrichIds.has(c.id));
  const enrichedMap = new Map(
    (await enrichLandingTutorCards(supabase, toEnrich)).map((t) => [t.id, t] as const),
  );

  return {
    today: todaySlice.map((t) => enrichedMap.get(t.id)!),
    tomorrow: tomorrowSlice.map((t) => enrichedMap.get(t.id)!),
  };
}
