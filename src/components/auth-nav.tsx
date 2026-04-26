import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth";
import { signOutAction } from "@/app/[locale]/auth/actions";
import { NotificationNavLink } from "@/components/notification-nav-link";

type AuthNavProps = {
  locale: string;
};

export async function AuthNav({ locale }: AuthNavProps) {
  const t = await getTranslations("Nav");
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/auth`} className="rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-2 text-base text-[#0F2C59]">
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <NotificationNavLink locale={locale} />
      <Link href={`/${locale}/support`} className="rounded-md border border-[#2D4263] px-4 py-2 text-base text-[#F8F9FA] hover:bg-[#2D4263]">
        {t("supportCenter")}
      </Link>
      <Link href={`/${locale}/messages`} className="rounded-md border border-[#2D4263] px-4 py-2 text-base text-[#F8F9FA] hover:bg-[#2D4263]">
        {t("messages")}
      </Link>
      <Link href={`/${locale}/dashboard`} className="rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-2 text-base text-[#0F2C59]">
        {t("dashboard")}
      </Link>
      <form action={signOutAction}>
        <input type="hidden" name="locale" value={locale} />
        <button className="rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-2 text-base text-[#0F2C59]">{t("logout")}</button>
      </form>
    </div>
  );
}
