import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnvOrThrow } from "@/lib/supabase/config";

/**
 * Cookie-free server client for public, cacheable queries.
 * Safe to use inside `unstable_cache` because it does not call `cookies()`.
 */
export function createPublicServerClient() {
  const { url, anonKey } = getSupabaseEnvOrThrow();
  return createSupabaseClient(url, anonKey);
}
