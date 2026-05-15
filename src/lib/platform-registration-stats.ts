import { unstable_cache } from "next/cache";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPublicServerClient } from "@/lib/supabase/public-server";

function parseBase(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Students only: optional marketing baseline added to live student registrations. */
export const PLATFORM_STAT_BASE_STUDENTS = parseBase("LANDING_STAT_BASE_STUDENTS", 22);

export type PlatformRegistrationCounts = {
  /** Listed tutors on the marketplace (`tutor_profiles`) — same ground truth as the directory. */
  liveTutorCount: number;
  liveStudentCount: number;
};

export function getDisplayTutorCount(liveTutorProfileCount: number): number {
  return Math.max(0, liveTutorProfileCount);
}

export function getDisplayStudentCount(liveStudentCount: number): number {
  return PLATFORM_STAT_BASE_STUDENTS + Math.max(0, liveStudentCount);
}

async function fetchPlatformRegistrationCounts(): Promise<PlatformRegistrationCounts> {
  const empty: PlatformRegistrationCounts = { liveTutorCount: 0, liveStudentCount: 0 };

  if (!hasSupabaseEnv()) return empty;

  const supabase = createPublicServerClient();
  const admin = getAdminSupabaseClient();
  const roleClient = admin ?? supabase;

  const [{ count: tutorProfilesCount }, { count: studentUsersCount }] = await Promise.all([
    supabase.from("tutor_profiles").select("id", { head: true, count: "exact" }),
    roleClient.from("users").select("id", { head: true, count: "exact" }).eq("role", "student"),
  ]);

  return {
    liveTutorCount: tutorProfilesCount ?? 0,
    liveStudentCount: studentUsersCount ?? 0,
  };
}

export async function getCachedPlatformRegistrationCounts(): Promise<PlatformRegistrationCounts> {
  const run = unstable_cache(
    () => fetchPlatformRegistrationCounts(),
    ["platform-registration-counts-v2"],
    { revalidate: 120, tags: ["platform-registration-counts"] },
  );
  return run();
}
