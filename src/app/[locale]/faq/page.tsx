import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { PageSection } from "@/components/page-section";
import { Card, CardContent } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FaqPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("Faq");

  const parentPairs = [
    { q: t("parent1q"), a: t("parent1a") },
    { q: t("parent2q"), a: t("parent2a") },
    { q: t("parent3q"), a: t("parent3a") },
    { q: t("parent4q"), a: t("parent4a") },
  ];
  const tutorPairs = [
    { q: t("tutor1q"), a: t("tutor1a") },
    { q: t("tutor2q"), a: t("tutor2a") },
    { q: t("tutor3q"), a: t("tutor3a") },
    { q: t("tutor4q"), a: t("tutor4a") },
  ];

  return (
    <main className="space-y-8">
      <PageSection title={t("title")} description={t("subtitle")}>
        <Link href={`/${locale}`} className="text-sm text-[#000225] underline">
          {t("backHome")}
        </Link>
      </PageSection>

      <PageSection title={t("parentBlockTitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          {parentPairs.map((item, i) => (
            <Card key={`p-${i}`}>
              <CardContent className="space-y-2 pt-5">
                <h3 className="font-semibold text-[#1D2129]">{item.q}</h3>
                <p className="text-sm text-zinc-700">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageSection>

      <PageSection title={t("tutorBlockTitle")}>
        <div className="grid gap-4 md:grid-cols-2">
          {tutorPairs.map((item, i) => (
            <Card key={`t-${i}`}>
              <CardContent className="space-y-2 pt-5">
                <h3 className="font-semibold text-[#1D2129]">{item.q}</h3>
                <p className="text-sm text-zinc-700">{item.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageSection>
    </main>
  );
}
