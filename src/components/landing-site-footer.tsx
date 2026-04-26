import Link from "next/link";
import { getTranslations } from "next-intl/server";

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H7.9V12h2.6V9.8c0-2.6 1.6-4 3.9-4 1.1 0 2.3.2 2.3.2v2.5h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5ZM18 6.3a1 1 0 1 1-1 1 1 1 0 0 1 1-1ZM12 9.5A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5Z" />
    </svg>
  );
}

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.5 8h4V23h-4V8Zm7.5 0h3.8v2h.1c.5-1 1.8-2.4 3.8-2.4 4 0 4.8 2.6 4.8 6v9h-4v-8c0-1.9 0-3.4-2-3.4-2 0-2.3 1.5-2.3 3.1V23H8V8Z" />
    </svg>
  );
}

type LandingSiteFooterProps = {
  locale: string;
  contactWeChat: string;
  contactPhone: string;
  contactHours: string;
};

export async function LandingSiteFooter({
  locale,
  contactWeChat,
  contactPhone,
  contactHours,
}: LandingSiteFooterProps) {
  const t = await getTranslations("Landing");
  const tNav = await getTranslations("Nav");

  const fb = process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL?.trim() ?? "";
  const ig = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL?.trim() ?? "";
  const ln = process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN_URL?.trim() ?? "";

  const socialIconClass = "h-5 w-5";

  return (
    <footer className="rounded-xl border border-[#000225] bg-[#000225] p-6 shadow-sm">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-1">
          <h3 className="font-semibold">{t("footerAboutTitle")}</h3>
          <p className="text-sm text-zinc-700">{t("footerAboutBody")}</p>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold">{t("footerTutorsTitle")}</h3>
          <Link href={`/${locale}/auth`} className="block text-zinc-700 hover:text-[#000225]">
            {t("footerLinkBecomeTutor")}
          </Link>
          <Link href={`/${locale}/tutor/profile/setup`} className="block text-zinc-700 hover:text-[#000225]">
            {t("footerLinkTutorProfile")}
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold">{t("footerStudentsTitle")}</h3>
          <Link href={`/${locale}/tutors`} className="block text-zinc-700 hover:text-[#000225]">
            {t("footerLinkFindTutor")}
          </Link>
          <Link href={`/${locale}/booking/new`} className="block text-zinc-700 hover:text-[#000225]">
            {t("footerLinkBookingHelp")}
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold">{t("footerSiteTitle")}</h3>
          <Link href={`/${locale}`} className="block text-zinc-700 hover:text-[#000225]">
            {t("footerLinkHome")}
          </Link>
          <Link href={`/${locale}/auth`} className="block text-zinc-700 hover:text-[#000225]">
            {t("footerLinkAuth")}
          </Link>
          <Link href={`/${locale}/onboarding`} className="block text-zinc-700 hover:text-[#000225]">
            {t("footerLinkOnboarding")}
          </Link>
          <Link href={`/${locale}/dashboard`} className="block text-zinc-700 hover:text-[#000225]">
            {t("footerLinkDashboard")}
          </Link>
          <Link href={`/${locale}/faq`} className="block text-zinc-700 hover:text-[#000225]">
            {t("footerLinkFaq")}
          </Link>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="font-semibold">{t("footerContactTitle")}</h3>
          <p className="text-zinc-700">{contactWeChat || t("contactMissing")}</p>
          <p className="text-zinc-700">{contactPhone || t("contactMissing")}</p>
          <p className="text-zinc-700">{contactHours || t("contactHoursMissing")}</p>
          <div>
            <p className="mb-2 text-xs font-semibold text-zinc-500">{t("footerFollowTitle")}</p>
            <div className="flex flex-wrap gap-3">
              {fb ? (
                <a
                  href={fb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#000225]"
                  aria-label="Facebook"
                >
                  <IconFacebook className={socialIconClass} />
                </a>
              ) : (
                <span className="text-zinc-300" title={t("footerSocialDisabled")} aria-hidden>
                  <IconFacebook className={socialIconClass} />
                </span>
              )}
              {ig ? (
                <a
                  href={ig}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#000225]"
                  aria-label="Instagram"
                >
                  <IconInstagram className={socialIconClass} />
                </a>
              ) : (
                <span className="text-zinc-300" title={t("footerSocialDisabled")} aria-hidden>
                  <IconInstagram className={socialIconClass} />
                </span>
              )}
              {ln ? (
                <a
                  href={ln}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-[#000225]"
                  aria-label="LinkedIn"
                >
                  <IconLinkedIn className={socialIconClass} />
                </a>
              ) : (
                <span className="text-zinc-300" title={t("footerSocialDisabled")} aria-hidden>
                  <IconLinkedIn className={socialIconClass} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 border-t pt-4 text-xs text-zinc-500">
        © {new Date().getFullYear()} {tNav("brand")}. {t("footerCopyright")}
      </div>
    </footer>
  );
}
