import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { PageSection } from "@/components/page-section";
import { AdminTutorsDirectory } from "@/components/admin-tutors-directory";

type AdminTutorsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminTutorsPage({ params }: AdminTutorsPageProps) {
  const { locale } = await params;
  const { profile } = await requireProfile(locale);
  if (profile.role !== "admin") {
    redirect(`/${locale}`);
  }

  const t = await getTranslations("AdminTutors");

  return (
    <main className="space-y-6">
      <PageSection title={t("pageTitle")} description={t("pageSubtitle")}>
        <AdminTutorsDirectory locale={locale} />
      </PageSection>
    </main>
  );
}
