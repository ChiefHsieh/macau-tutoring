import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SupportCenterPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SupportCenterPage({ params }: SupportCenterPageProps) {
  const { locale } = await params;
  const { user, profile } = await requireProfile(locale);

  // Admins use the normal inbox to answer threads (same as designated support account).
  if (profile.role === "admin") {
    redirect(`/${locale}/messages`);
  }

  const supabase = await createClient();
  const configuredManagerId =
    process.env.SUPPORT_MANAGER_USER_ID?.trim() || process.env.NEXT_PUBLIC_SUPPORT_MANAGER_USER_ID?.trim() || "";
  /** Must match the Supabase `users.email` for the support inbox account. */
  const targetManagerEmail = "kkiinngg125@gmail.com";

  let supportManagerId = configuredManagerId;

  if (!supportManagerId) {
    const { data: managerByEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", targetManagerEmail)
      .limit(1)
      .maybeSingle();
    supportManagerId = managerByEmail?.id ?? "";
  }

  if (!supportManagerId) {
    const { data: manager } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
    supportManagerId = manager?.id ?? "";
  }

  // Fallback for environments where reading users table is restricted by RLS:
  // use the most recent conversation peer as support target.
  if (!supportManagerId) {
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200);

    for (const row of recentMessages ?? []) {
      const peerId = row.sender_id === user.id ? row.receiver_id : row.sender_id;
      if (peerId && peerId !== user.id) {
        supportManagerId = peerId;
        break;
      }
    }
  }

  // Logged-in user is the support account: open inbox to reply (never open a thread with self).
  if (supportManagerId && supportManagerId === user.id) {
    redirect(`/${locale}/messages`);
  }

  if (supportManagerId) {
    redirect(`/${locale}/messages/${supportManagerId}?support=1`);
  }

  redirect(`/${locale}/messages?error=support_manager_not_found`);
}
