import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseCookieOptions } from "./cookie-options";
import { getSupabaseEnvOrThrow } from "./config";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnvOrThrow();

  return createServerClient(
    url,
    anonKey,
    {
      cookieOptions: getSupabaseCookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot call `cookies().set` (Next.js restriction).
            // Session refresh runs in `src/middleware.ts` via `response.cookies.set`.
          }
        },
      },
    },
  );
}
