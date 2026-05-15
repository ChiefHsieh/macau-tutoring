import { unstable_cache } from "next/cache";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPublicServerClient } from "@/lib/supabase/public-server";

/** Baseline shown on homepage / directory before adding live DB counts. */
function parseBase(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const PLATFORM_STAT_BASE_TUTORS = parseBase("LANDING_STAT_BASE_TUTORS", 0);
export const PLATFORM_STAT_BASE_STUDENTS = parseBase("LANDING_STAT_BASE_STUDENTS", 22);

export type PlatformRegistrationCounts = {
  /** Raw DB count used for tutor display (role=tutor when available, else tutor_profiles). */
  liveTutorCount: number;
  liveStudentCount: number;
  tutorProfilesCount: number;
};

export function platformDisplayCount(base: number, liveCount: number): number {
  return base + Math.max(0, liveCount);
}

export function getDisplayTutorCount(liveTutorCount: number): number {
  return platformDisplayCount(PLATFORM_STAT_BASE_TUTORS, liveTutorCount);
}

export function getDisplayStudentCount(liveStudentCount: number): number {
  return platformDisplayCount(PLATFORM_STAT_BASE_STUDENTS, liveStudentCount);
}

async function fetchPlatformRegistrationCounts(): Promise<PlatformRegistrationCounts> {
  const empty: PlatformRegistrationCounts = {
    liveTutorCount: 0,
    liveStudentCount: 0,
    tutorProfilesCount: 0,
  };

  if (!hasSupabaseEnv()) return empty;

  const supabase = createPublicServerClient();
  const admin = getAdminSupabaseClient();
  const roleClient = admin ?? supabase;

  const [
    { count: tutorUsersCount },
    { count: studentUsersCount },
    { count: tutorProfilesCount },
  ] = await Promise.all([
    roleClient.from("users").select("id", { head: true, count: "exact" }).eq("role", "tutor"),
    roleClient.from("users").select("id", { head: true, count: "exact" }).eq("role", "student"),
    supabase.from("tutor_profiles").select("id", { head: true, count: "exact" }),
  ]);

  const tutorFromUsers = tutorUsersCount ?? 0;
  const tutorFromProfiles = tutorProfilesCount ?? 0;
  const liveTutorCount = tutorFromUsers > 0 ? tutorFromUsers : tutorFromProfiles;

  return {
    liveTutorCount,
    liveStudentCount: studentUsersCount ?? 0,
    tutorProfilesCount: tutorFromProfiles,
  };
}

export async function getCachedPlatformRegistrationCounts(): Promise<PlatformRegistrationCounts> {
  const run = unstable_cache(
    () => fetchPlatformRegistrationCounts(),
    ["platform-registration-counts"],
    { revalidate: 120, tags: ["platform-registration-counts"] },
  );
  return run();
}
