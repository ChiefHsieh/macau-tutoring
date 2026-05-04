import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ClientFormInput } from "@/components/tutor-profile-setup-form";
import {
  groupSubjectsFromDb,
  inferRegionFromAreas,
  parseServiceAreasFromDb,
  parseEducationForForm,
} from "@/lib/tutor-setup-form-helpers";

const TutorProfileSetupForm = dynamic(
  () => import("@/components/tutor-profile-setup-form").then((m) => m.TutorProfileSetupForm)
);

type TutorProfileSetupPageProps = {
  params: Promise<{ locale: string }>;
};

function parseTeachingExperienceMonths(raw: string | null | undefined) {
  const text = (raw ?? "").trim().toLowerCase();
  if (!text) return 0;
  if (text.includes("10+")) return 120;
  const years = Number(text.match(/(\d+)\s*year/)?.[1] ?? 0);
  const months = Number(text.match(/(\d+)\s*month/)?.[1] ?? 0);
  if (years || months) return Math.min(120, years * 12 + months);
  const num = Number(text.match(/\d+/)?.[0] ?? 0);
  return Number.isFinite(num) ? Math.min(120, Math.max(0, num)) : 0;
}

export default async function TutorProfileSetupPage({
  params,
}: TutorProfileSetupPageProps) {
  const { locale } = await params;
  const { user, profile } = await requireProfile(locale);
  const t = await getTranslations("TutorSetup");

  if (profile.role !== "tutor") redirect(`/${locale}/dashboard`);

  const supabase = await createClient();

  const [{ data: tutorProfile }, { data: tutorSubjects }, { data: verificationDoc }] =
    await Promise.all([
      supabase
        .from("tutor_profiles")
        .select(
          "display_name, district, exact_location, hourly_rate, working_period_start, working_period_end, service_type, education_background, teaching_experience, bio, profile_photo",
        )
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("tutor_subjects")
        .select("subject, grade_level")
        .eq("tutor_id", user.id),
      supabase
        .from("tutor_verification_documents")
        .select("verification_document")
        .eq("tutor_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const initialAreas = parseServiceAreasFromDb(tutorProfile?.exact_location, tutorProfile?.district);
  const initialValues: ClientFormInput = {
    district: inferRegionFromAreas(initialAreas),
    service_areas: initialAreas,
    hourly_rate: tutorProfile?.hourly_rate ?? 0,
    working_period_start: tutorProfile?.working_period_start ?? "",
    working_period_end: tutorProfile?.working_period_end ?? "",
    service_type: (tutorProfile?.service_type ?? "both") as
      | "in-person"
      | "online"
      | "both",
    subject_groups: groupSubjectsFromDb(tutorSubjects ?? []),
    education_entries: parseEducationForForm(tutorProfile?.education_background ?? ""),
    teaching_experience_months: parseTeachingExperienceMonths(tutorProfile?.teaching_experience),
    bio: tutorProfile?.bio ?? "",
    profile_photo: tutorProfile?.profile_photo ?? "",
    verification_document: verificationDoc?.verification_document ?? "",
  };

  return (
    <main className="mx-auto w-full max-w-3xl rounded-xl border bg-white p-4 shadow-sm md:p-5">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-sm text-zinc-600">{t("subtitle")}</p>
      <div className="mt-6">
        <TutorProfileSetupForm locale={locale} initialValues={initialValues} />
      </div>
    </main>
  );
}
