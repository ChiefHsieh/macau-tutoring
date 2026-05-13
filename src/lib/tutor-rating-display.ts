/**
 * Merge denormalized tutor_profiles rating fields with live rows from public.reviews
 * so directory / landing cards match the tutor public profile when triggers are stale.
 */

export type TutorRatingAgg = { sum: number; count: number };

export function statsFromReviewRows(rows: { rating: number | string | null }[] | null | undefined): TutorRatingAgg | null {
  const list = rows ?? [];
  if (list.length === 0) return null;
  const sum = list.reduce((acc, row) => acc + Number(row.rating ?? 0), 0);
  return { sum, count: list.length };
}

export function aggregateRatingsByTutorId(
  rows: { tutor_id: string; rating: number | string | null }[] | null | undefined,
): Map<string, TutorRatingAgg> {
  const map = new Map<string, TutorRatingAgg>();
  for (const row of rows ?? []) {
    const id = row.tutor_id;
    if (!id) continue;
    const r = Number(row.rating ?? 0);
    const cur = map.get(id) ?? { sum: 0, count: 0 };
    cur.sum += r;
    cur.count += 1;
    map.set(id, cur);
  }
  return map;
}

export function mergeTutorRatingDisplay(
  profileAvg: unknown,
  profileTotal: unknown,
  fromReviews: TutorRatingAgg | null | undefined,
): { displayAverageRating: number; displayReviewCount: number } {
  const agg = fromReviews && fromReviews.count > 0 ? fromReviews : null;
  if (agg) {
    return {
      displayAverageRating: agg.sum / agg.count,
      displayReviewCount: agg.count,
    };
  }
  return {
    displayAverageRating: Number(profileAvg ?? 0),
    displayReviewCount: Number(profileTotal ?? 0),
  };
}
