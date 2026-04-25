import Link from "next/link";
import { getTranslations } from "next-intl/server";

type RoadmapPageProps = {
  params: Promise<{ locale: string }>;
};

const phaseKeys = [
  "phase0",
  "phase1",
  "phase2",
  "phase3",
  "phase4",
  "phase5",
  "phase6",
  "phase7",
  "phase8",
] as const;

export default async function RoadmapPage({ params }: RoadmapPageProps) {
  const { locale } = await params;
  const t = await getTranslations("Home");

  return (
    <main className="flex flex-col gap-8">
      <header className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <div className="flex gap-2">
            <Link
              href="/zh-HK/roadmap"
              className={`rounded-md px-3 py-1 text-sm ${
                locale === "zh-HK" ? "bg-black text-white" : "bg-zinc-100"
              }`}
            >
              {t("langZh")}
            </Link>
            <Link
              href="/en/roadmap"
              className={`rounded-md px-3 py-1 text-sm ${
                locale === "en" ? "bg-black text-white" : "bg-zinc-100"
              }`}
            >
              {t("langEn")}
            </Link>
          </div>
        </div>
        <p className="text-zinc-700">{t("subtitle")}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {phaseKeys.map((phase) => (
          <article key={phase} className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">{t(`${phase}.title`)}</h2>
            <p className="mb-3 text-sm text-zinc-600">{t(`${phase}.time`)}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-800">
              <li>{t(`${phase}.todo1`)}</li>
              <li>{t(`${phase}.todo2`)}</li>
              <li>{t(`${phase}.todo3`)}</li>
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
