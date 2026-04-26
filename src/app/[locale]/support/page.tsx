import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SupportCenterPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SupportCenterPage({ params }: SupportCenterPageProps) {
  const { locale } = await params;
  const { user, profile } = await requireProfile(locale);

  if (profile.role === "admin") {
    redirect(`/${locale}/messages?support=1`);
  }

  const supabase = await createClient();
  const configuredManagerId =
    process.env.SUPPORT_MANAGER_USER_ID?.trim() || process.env.NEXT_PUBLIC_SUPPORT_MANAGER_USER_ID?.trim() || "";
  const targetManagerEmail = "kkiinngg125@gmail.com";

  let targetPeerId = configuredManagerId;

  if (!targetPeerId) {
    const { data: managerByEmail } = await supabase
      .from("users")
      .select("id")
      .eq("email", targetManagerEmail)
      .limit(1)
      .maybeSingle();
    targetPeerId = managerByEmail?.id ?? "";
  }

  if (!targetPeerId) {
    const { data: manager } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
    targetPeerId = manager?.id ?? "";
  }

  // Fallback for environments where reading users table is restricted by RLS:
  // use the most recent conversation peer as support target.
  if (!targetPeerId) {
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200);

    for (const row of recentMessages ?? []) {
      const peerId = row.sender_id === user.id ? row.receiver_id : row.sender_id;
      if (peerId && peerId !== user.id) {
        targetPeerId = peerId;
        break;
      }
    }
  }

  if (targetPeerId) {
    redirect(`/${locale}/messages/${targetPeerId}?support=1`);
  }

  redirect(`/${locale}/messages?error=support_manager_not_found`);
}
