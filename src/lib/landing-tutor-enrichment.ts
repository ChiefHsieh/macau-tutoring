import type { SupabaseClient } from "@supabase/supabase-js";
import { aggregateRatingsByTutorId, mergeTutorRatingDisplay } from "@/lib/tutor-rating-display";

export type LandingTutorCardModel = {
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

export async function enrichLandingTutorCards(
  supabase: SupabaseClient,
  tutors: LandingTutorCardModel[],
): Promise<LandingTutorCardModel[]> {
  const ids = tutors.map((t) => t.id);
  if (ids.length === 0) return tutors;

  const [{ data: subjectLines }, { data: reviewRows }] = await Promise.all([
    supabase.from("tutor_subjects").select("tutor_id, subject").in("tutor_id", ids),
    supabase.from("reviews").select("tutor_id, rating").in("tutor_id", ids),
  ]);

  const subjectMap = new Map<string, string[]>();
  (subjectLines ?? []).forEach((row) => {
    const label = row.subject?.trim() ?? "";
    if (!label) return;
    const list = subjectMap.get(row.tutor_id) ?? [];
    if (!list.includes(label)) list.push(label);
    subjectMap.set(row.tutor_id, list);
  });

  const ratingAgg = aggregateRatingsByTutorId(reviewRows);

  return tutors.map((row) => {
    const merged = mergeTutorRatingDisplay(row.average_rating, row.total_reviews, ratingAgg.get(row.id));
    return {
      ...row,
      subjectSummary: (subjectMap.get(row.id) ?? []).slice(0, 3).join(" · "),
      average_rating: merged.displayAverageRating,
      total_reviews: merged.displayReviewCount,
    };
  });
}
