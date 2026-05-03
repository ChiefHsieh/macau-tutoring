import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export type AppRole = "tutor" | "student" | "admin";

/** Deduped within one RSC request (e.g. AuthNav + NotificationNavLink both call profile). */
export const getCurrentUser = cache(async () => {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;

  return data.user;
});

/** Deduped within one RSC request; avoids duplicate Supabase round-trips on navigation shell. */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return data as
    | { id: string; role: AppRole; full_name: string; email: string }
    | null;
});

export async function requireUser(locale: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/auth`);
  return user;
}

export async function requireProfile(locale: string) {
  const user = await requireUser(locale);
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/${locale}/onboarding`);
  return { user, profile };
}
