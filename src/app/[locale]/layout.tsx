import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Link from "next/link";
import { AuthNav } from "@/components/auth-nav";
import { AppToaster } from "@/components/app-toaster";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const t = await getTranslations("Nav");

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="min-h-screen w-full bg-[#000225]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 bg-[#000225] p-4 md:p-6">
          <header className="flex flex-col gap-4 rounded-xl border border-[#2D4263] bg-[#000225] px-5 py-5 shadow-md shadow-black/20 backdrop-blur-sm md:flex-row md:items-center md:justify-between md:px-6 md:py-6">
            <div className="flex flex-wrap items-center gap-4">
              <Link href={`/${locale}`} className="text-xl font-semibold tracking-tight text-[#F8F9FA]">
                {t("brand")}
              </Link>
              <nav className="flex flex-wrap gap-3 text-base">
                <Link
                  href={`/${locale}/tutors`}
                  className="rounded-md border border-[#2D4263] px-4 py-2 text-[#E2E8F0] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:border-[#3B5274] hover:bg-[#2D4263]"
                >
                  {t("tutors")}
                </Link>
                <Link
                  href={`/${locale}/roadmap`}
                  className="rounded-md border border-[#2D4263] px-4 py-2 text-[#E2E8F0] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:border-[#3B5274] hover:bg-[#2D4263]"
                >
                  {t("roadmap")}
                </Link>
                <Link
                  href={`/${locale}/faq`}
                  className="rounded-md border border-[#2D4263] px-4 py-2 text-[#E2E8F0] transition-all duration-300 ease-out hover:-translate-y-[3px] hover:border-[#3B5274] hover:bg-[#2D4263]"
                >
                  {t("faq")}
                </Link>
              </nav>
            </div>
            <AuthNav locale={locale} />
          </header>
          {children}
          <AppToaster />
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
