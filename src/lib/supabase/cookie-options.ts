import type { CookieOptionsWithName } from "@supabase/ssr";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function getSupabaseCookieOptions(): CookieOptionsWithName {
  return {
    name: "sb",
    lifetime: ONE_YEAR_SECONDS,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}
