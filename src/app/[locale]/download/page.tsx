import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import {
  ANDROID_APK_DOWNLOAD_PATH,
  ANDROID_APK_FILE_NAME,
  ANDROID_APK_VERSION_CODE,
  ANDROID_APK_VERSION_NAME,
  ANDROID_PACKAGE_ID,
} from "@/lib/android-apk-release";
import { getTermsPageUrl } from "@/lib/public-urls";

type PageProps = {
  params: Promise<{ locale: string }>;
};

const downloadCardClass =
  "overflow-hidden border border-[#E6C699]/35 bg-[linear-gradient(135deg,rgba(15,44,89,0.92)_0%,rgba(10,15,53,0.96)_100%)] shadow-md shadow-black/25";

const bodyTextClass = "text-sm leading-relaxed text-[#E2E8F0] md:text-base";
const mutedTextClass = "text-sm text-[#94A3B8]";
const linkClass =
  "text-sm font-medium text-[#E6C699] underline decoration-[#E6C699]/60 underline-offset-2 transition-colors hover:text-[#F0D6B0] hover:decoration-[#F0D6B0]";

export default async function DownloadPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("Download");
  const termsUrl = getTermsPageUrl();

  const steps = [t("step1"), t("step2"), t("step3"), t("step4"), t("step5")];
  const notes = [t("note1"), t("note2"), t("note3")];

  return (
    <main className="mx-auto max-w-2xl space-y-6 pb-12">
      <PageSection title={t("title")} description={t("subtitle")} cardClassName={downloadCardClass}>
        <Link href={`/${locale}`} className={linkClass}>
          {t("backHome")}
        </Link>
      </PageSection>

      <PageSection cardClassName={downloadCardClass} contentClassName="space-y-4 pt-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E6C699]/40 bg-[#101742] text-[#E6C699]"
            aria-hidden
          >
            <Smartphone className="h-5 w-5" />
          </span>
          <p className={mutedTextClass}>
            {t("versionLabel")}:{" "}
            <span className="font-semibold text-[#F8F9FA]">{ANDROID_APK_VERSION_NAME}</span> ({t("buildLabel")}
            {ANDROID_APK_VERSION_CODE}) · {t("packageLabel")}:{" "}
            <span className="font-mono text-xs text-[#DAC0A3]">{ANDROID_PACKAGE_ID}</span>
          </p>
        </div>
        <Button asChild size="lg" className="w-full sm:w-auto">
          <a href={ANDROID_APK_DOWNLOAD_PATH} download={ANDROID_APK_FILE_NAME}>
            {t("downloadButton")}
          </a>
        </Button>
        <p className="text-xs text-[#94A3B8]">{t("downloadHint")}</p>
      </PageSection>

      <PageSection title={t("installTitle")} cardClassName={downloadCardClass}>
        <ol className={`list-decimal space-y-3 pl-5 ${bodyTextClass}`}>
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </PageSection>

      <PageSection title={t("notesTitle")} cardClassName={downloadCardClass}>
        <ul className={`list-disc space-y-2 pl-5 ${bodyTextClass}`}>
          {notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
        <p className="mt-4">
          <a href={termsUrl} className={linkClass} target="_blank" rel="noopener noreferrer">
            {t("termsLink")}
          </a>
        </p>
      </PageSection>

      <p className={`text-center ${mutedTextClass}`}>{t("iosHint")}</p>
    </main>
  );
}
