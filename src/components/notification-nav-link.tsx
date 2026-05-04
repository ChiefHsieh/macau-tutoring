import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth";
import { getCachedUnreadNotificationCount } from "@/lib/notification-unread-count";
import { NotificationBellForm } from "@/components/notification-bell-form";

type NotificationNavLinkProps = {
  locale: string;
};

export async function NotificationNavLink({ locale }: NotificationNavLinkProps) {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const unread = await getCachedUnreadNotificationCount(profile.id);
  const t = await getTranslations("Nav");

  return <NotificationBellForm locale={locale} unread={unread} ariaLabel={t("notificationsAria")} />;
}
