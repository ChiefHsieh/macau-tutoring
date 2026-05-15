/**
 * Homepage public stat cards: starting baseline + live counts from Supabase.
 *
 * Set in Netlify / .env.local (optional):
 *   LANDING_STAT_BASE_TUTORS=0
 *   LANDING_STAT_BASE_STUDENTS=22
 */
function parseBase(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const LANDING_STAT_BASE_TUTORS = parseBase("LANDING_STAT_BASE_TUTORS", 0);
export const LANDING_STAT_BASE_STUDENTS = parseBase("LANDING_STAT_BASE_STUDENTS", 22);

/** Shown on homepage = baseline you set + rows counted in the database. */
export function landingDisplayCount(base: number, liveCount: number): number {
  return base + Math.max(0, liveCount);
}
