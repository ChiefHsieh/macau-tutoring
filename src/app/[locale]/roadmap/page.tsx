import { redirect } from "next/navigation";

type RoadmapPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RoadmapPage({ params }: RoadmapPageProps) {
  const { locale } = await params;
  redirect(`/${locale}`);
}
