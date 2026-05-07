"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseCookieOptions } from "./cookie-options";
import { getSupabaseEnvOrThrow } from "./config";

export function createClient() {
  const { url, anonKey } = getSupabaseEnvOrThrow();

  return createBrowserClient(
    url,
    anonKey,
    {
      cookieOptions: getSupabaseCookieOptions(),
    },
  );
}
