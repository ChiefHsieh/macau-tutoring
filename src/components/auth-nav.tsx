import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Menu } from "lucide-react";
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
      <>
        <div className="hidden items-center gap-3 md:flex">
          <Link href={`/${locale}/auth`} className="rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-2 text-base text-[#0F2C59]">
            {t("login")}
          </Link>
        </div>
        <details className="mobile-nav-drawer relative md:hidden">
          <summary className="mobile-nav-trigger">
            <Menu className="h-5 w-5" />
          </summary>
          <div className="mobile-nav-overlay" />
          <div className="mobile-nav-panel">
            <nav className="flex flex-col gap-3">
              <Link href={`/${locale}/tutors`} className="mobile-nav-link">
                {t("tutors")}
              </Link>
              <Link href={`/${locale}/faq`} className="mobile-nav-link">
                {t("faq")}
              </Link>
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-[#1A2456] pt-4">
              <Link href={`/${locale}/auth`} className="rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-3 text-center text-base text-[#0F2C59]">
                {t("login")}
              </Link>
            </div>
          </div>
        </details>
      </>
    );
  }

  return (
    <>
      <div className="hidden items-center gap-3 md:flex">
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

      <details className="mobile-nav-drawer relative md:hidden">
        <summary className="mobile-nav-trigger">
          <Menu className="h-5 w-5" />
        </summary>
        <div className="mobile-nav-overlay" />
        <div className="mobile-nav-panel">
          <nav className="flex flex-col gap-3">
            <Link href={`/${locale}/tutors`} className="mobile-nav-link">
              {t("tutors")}
            </Link>
            <Link href={`/${locale}/faq`} className="mobile-nav-link">
              {t("faq")}
            </Link>
            <Link href={`/${locale}/notifications`} className="mobile-nav-link">
              {t("notificationsAria")}
            </Link>
            <Link href={`/${locale}/support`} className="mobile-nav-link">
              {t("supportCenter")}
            </Link>
            <Link href={`/${locale}/messages`} className="mobile-nav-link">
              {t("messages")}
            </Link>
          </nav>
          <div className="mt-auto flex flex-col gap-3 border-t border-[#1A2456] pt-4">
            <Link href={`/${locale}/dashboard`} className="rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-3 text-center text-base text-[#0F2C59]">
              {t("dashboard")}
            </Link>
            <form action={signOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button className="w-full rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-3 text-base text-[#0F2C59]">
                {t("logout")}
              </button>
            </form>
          </div>
        </div>
      </details>
    </>
  );
}
