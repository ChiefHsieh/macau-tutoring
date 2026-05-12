import { createClient } from "@/lib/supabase/server";

/** Returns authenticated admin user id, or null if not logged in / not admin. */
export async function getAdminUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if (row?.role !== "admin") return null;
  return user.id;
}
