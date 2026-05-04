import { createClient } from "@/lib/supabase/server";

const UNREAD_TTL_MS = 30_000;
const unreadCountCache = new Map<string, { value: number; expiresAt: number }>();

/** In-process short cache (30s), safe for cookie-based server clients. */
export async function getCachedUnreadNotificationCount(userId: string): Promise<number> {
  const now = Date.now();
  const cached = unreadCountCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.value;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId)
    .eq("is_read", false);
  const value = error ? 0 : (count ?? 0);
  unreadCountCache.set(userId, { value, expiresAt: now + UNREAD_TTL_MS });
  return value;
}

export function invalidateUnreadNotificationCount(userId: string) {
  unreadCountCache.delete(userId);
}
