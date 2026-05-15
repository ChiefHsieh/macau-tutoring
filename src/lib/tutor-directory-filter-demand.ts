import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPublicServerClient } from "@/lib/supabase/public-server";

function parseBase(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Marketing baseline for homepage「近 30 日活躍需求」(+ live filter-apply clicks). */
export const PLATFORM_STAT_BASE_ACTIVE_DEMANDS = parseBase("LANDING_STAT_BASE_ACTIVE_DEMANDS", 23);

export function getDisplayActiveDemandCount(liveFilterApplyCount: number): number {
  return PLATFORM_STAT_BASE_ACTIVE_DEMANDS + Math.max(0, liveFilterApplyCount);
}

export function activeDemandSinceIso(days = 30): string {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since.toISOString();
}

function demandCountClient() {
  if (!hasSupabaseEnv()) return null;
  return getAdminSupabaseClient() ?? createPublicServerClient();
}

export async function countTutorDirectoryFilterEventsLast30Days(): Promise<number> {
  const client = demandCountClient();
  if (!client) return 0;

  const { count, error } = await client
    .from("tutor_directory_filter_events")
    .select("id", { head: true, count: "exact" })
    .gte("created_at", activeDemandSinceIso());

  if (error) {
    console.warn("[tutor-directory-filter-demand] count:", error.message);
    return 0;
  }

  return count ?? 0;
}

export async function recordTutorDirectoryFilterApply(locale?: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.warn("[tutor-directory-filter-demand] insert skipped: no SUPABASE_SERVICE_ROLE_KEY");
    return false;
  }

  const res = await fetch(`${url}/rest/v1/tutor_directory_filter_events`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ locale: locale?.trim() || null }),
  });

  if (!res.ok) {
    console.warn("[tutor-directory-filter-demand] insert:", await res.text());
    return false;
  }

  return true;
}
