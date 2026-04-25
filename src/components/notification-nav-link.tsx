import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type NotificationNavLinkProps = {
  locale: string;
};

export async function NotificationNavLink({ locale }: NotificationNavLinkProps) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", profile.id)
    .eq("is_read", false);

  const unread = error ? 0 : (count ?? 0);
  const t = await getTranslations("Nav");

  return (
    <Link
      href={`/${locale}/notifications`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
      aria-label={t("notificationsAria")}
    >
      <Bell className="h-5 w-5" aria-hidden />
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
