import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const { profile } = await requireProfile(locale);

  if (profile.role === "tutor") redirect(`/${locale}/dashboard/tutor`);
  if (profile.role === "admin") redirect(`/${locale}/dashboard/admin`);

  redirect(`/${locale}/dashboard/student`);
}
