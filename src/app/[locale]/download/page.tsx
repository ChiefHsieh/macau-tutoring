import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { PageSection } from "@/components/page-section";
import { Card, CardContent } from "@/components/ui/card";
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

export default async function DownloadPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("Download");
  const termsUrl = getTermsPageUrl();

  const steps = [t("step1"), t("step2"), t("step3"), t("step4"), t("step5")];
  const notes = [t("note1"), t("note2"), t("note3")];

  return (
    <main className="mx-auto max-w-2xl space-y-8 pb-12">
      <PageSection title={t("title")} description={t("subtitle")}>
        <Link href={`/${locale}`} className="text-sm text-[#000225] underline">
          {t("backHome")}
        </Link>
      </PageSection>

      <Card className="border-[#E6C699]/40 bg-gradient-to-b from-white to-[#faf8f5]">
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm text-zinc-600">
            {t("versionLabel")}: <strong>{ANDROID_APK_VERSION_NAME}</strong> ({t("buildLabel")}{" "}
            {ANDROID_APK_VERSION_CODE}) · {t("packageLabel")}: {ANDROID_PACKAGE_ID}
          </p>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href={ANDROID_APK_DOWNLOAD_PATH} download={ANDROID_APK_FILE_NAME}>
              {t("downloadButton")}
            </a>
          </Button>
          <p className="text-xs text-zinc-500">{t("downloadHint")}</p>
        </CardContent>
      </Card>

      <PageSection title={t("installTitle")}>
        <ol className="list-decimal space-y-3 pl-5 text-sm text-zinc-800">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </PageSection>

      <PageSection title={t("notesTitle")}>
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
          {notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <a href={termsUrl} className="text-[#000225] underline" target="_blank" rel="noopener noreferrer">
            {t("termsLink")}
          </a>
        </p>
      </PageSection>

      <p className="text-center text-sm text-zinc-600">{t("iosHint")}</p>
    </main>
  );
}
