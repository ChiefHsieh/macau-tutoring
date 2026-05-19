import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthProfileMetadata = {
  role: "student" | "tutor";
  full_name: string;
};

/** Mirror app profile fields into Supabase Auth `user_metadata` (visible in Authentication dashboard). */
export async function syncAuthUserMetadata(
  supabase: SupabaseClient,
  metadata: AuthProfileMetadata,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({
    data: {
      role: metadata.role,
      full_name: metadata.full_name,
    },
  });
  return { error: error?.message ?? null };
}
