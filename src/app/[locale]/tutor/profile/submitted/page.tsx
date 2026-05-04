import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { TutorSubmittedToast } from "@/components/tutor-submitted-toast";
import { PageSection } from "@/components/page-section";
import { ButtonLink } from "@/components/button-link";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TutorProfileSubmittedPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("TutorSubmitted");
  const tCommon = await getTranslations("Common");

  return (
    <main>
      <Suspense fallback={null}>
        <TutorSubmittedToast message={t("toastSaved")} />
      </Suspense>
      <PageSection title={t("title")} description={t("description")}>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/${locale}/dashboard/tutor`} pendingLabel={tCommon("loading")}>
            {t("toDashboard")}
          </ButtonLink>
          <ButtonLink href={`/${locale}/tutor/profile/setup`} variant="outline" pendingLabel={tCommon("loading")}>
            {t("editProfile")}
          </ButtonLink>
        </div>
      </PageSection>
    </main>
  );
}
