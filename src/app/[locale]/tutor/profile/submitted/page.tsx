import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { TutorSubmittedToast } from "@/components/tutor-submitted-toast";
import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TutorProfileSubmittedPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("TutorSubmitted");

  return (
    <main>
      <Suspense fallback={null}>
        <TutorSubmittedToast message={t("toastSaved")} />
      </Suspense>
      <PageSection title={t("title")} description={t("description")}>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/${locale}/dashboard/tutor`}>{t("toDashboard")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${locale}/tutor/profile/setup`}>{t("editProfile")}</Link>
          </Button>
        </div>
      </PageSection>
    </main>
  );
}
