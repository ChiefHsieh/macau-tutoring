import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationBellForm } from "@/components/notification-bell-form";

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

  return <NotificationBellForm locale={locale} unread={unread} ariaLabel={t("notificationsAria")} />;
}
