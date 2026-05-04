import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth";
import { NotificationNavLink } from "@/components/notification-nav-link";
import { MobileNavPortal } from "@/components/mobile-nav-portal";
import { SignOutForm } from "@/components/sign-out-form";

type AuthNavProps = {
  locale: string;
};

export async function AuthNav({ locale }: AuthNavProps) {
  const t = await getTranslations("Nav");
  const tCommon = await getTranslations("Common");
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <>
        <div className="hidden items-center gap-3 md:flex">
          <Link href={`/${locale}/auth`} className="rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-2 text-base text-[#0F2C59]">
            {t("login")}
          </Link>
        </div>
        <MobileNavPortal
          locale={locale}
          variant="guest"
          labels={{
            tutors: t("tutors"),
            faq: t("faq"),
            login: t("login"),
          }}
        />
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
        <SignOutForm locale={locale} logoutLabel={t("logout")} pendingLabel={tCommon("loggingOut")} />
      </div>

      <MobileNavPortal
        locale={locale}
        variant="auth"
        labels={{
          tutors: t("tutors"),
          faq: t("faq"),
          notificationsAria: t("notificationsAria"),
          supportCenter: t("supportCenter"),
          messages: t("messages"),
          dashboard: t("dashboard"),
          logout: t("logout"),
          loggingOut: tCommon("loggingOut"),
        }}
      />
    </>
  );
}
