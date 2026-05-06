"use server";

import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { tutorProfilePayloadSchema } from "@/lib/tutor-profile-schema";

type SaveTutorProfileInput = {
  locale: string;
  payload: import("zod").infer<typeof tutorProfilePayloadSchema>;
};

export async function saveTutorProfileAction(input: SaveTutorProfileInput) {
  const { locale, payload } = input;
  const { user, profile } = await requireProfile(locale);
  const tNotifications = await getTranslations({ locale, namespace: "Notifications" });

  if (profile.role !== "tutor") {
    return { ok: false, error: "Only tutor accounts can submit tutor profile." };
  }

  const parsed = tutorProfilePayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const data = parsed.data;
  const verificationDocument = String(data.verification_document ?? "").trim();
  if (verificationDocument.length > 0 && verificationDocument.length < 5) {
    return { ok: false, error: "Invalid verification document link." };
  }

  const profileUpsertBase = {
    id: user.id,
    district: data.district,
    exact_location: `|${data.service_areas.join("|")}|`,
    hourly_rate: data.hourly_rate,
    working_period_start: data.working_period_start,
    working_period_end: data.working_period_end,
    service_type: data.service_type,
    education_background: data.education_background,
    teaching_experience: data.teaching_experience,
    bio: data.bio || null,
    profile_photo: data.profile_photo || null,
  };

  let { error: profileError } = await supabase
    .from("tutor_profiles")
    .upsert(
      {
        ...profileUpsertBase,
        display_name: profile.full_name,
      },
      { onConflict: "id" },
    );

  if (profileError?.message.includes("display_name")) {
    // Backward compatibility for databases missing `display_name`.
    // The preferred fix is to add this column via migration/SQL.
    const fallback = await supabase
      .from("tutor_profiles")
      .upsert(profileUpsertBase, { onConflict: "id" });
    profileError = fallback.error;
  }

  if (profileError?.message.includes("tutor_profiles_hourly_rate_check")) {
    return { ok: false, error: "tutor_hourly_rate_positive" };
  }
  if (profileError) return { ok: false, error: profileError.message };

  const { error: deleteSubjectError } = await supabase
    .from("tutor_subjects")
    .delete()
    .eq("tutor_id", user.id);
  if (deleteSubjectError) return { ok: false, error: deleteSubjectError.message };

  const { error: insertSubjectError } = await supabase.from("tutor_subjects").insert(
    data.subjects.map((item) => ({
      tutor_id: user.id,
      subject: item.subject,
      grade_level: item.grade_level,
    })),
  );
  if (insertSubjectError) return { ok: false, error: insertSubjectError.message };

  if (verificationDocument.length >= 5) {
    const { error: deleteVerificationError } = await supabase
      .from("tutor_verification_documents")
      .delete()
      .eq("tutor_id", user.id);
    if (deleteVerificationError) return { ok: false, error: deleteVerificationError.message };

    const { error: insertVerificationError } = await supabase
      .from("tutor_verification_documents")
      .insert({
        tutor_id: user.id,
        verification_document: verificationDocument,
      });
    if (insertVerificationError) return { ok: false, error: insertVerificationError.message };

    // Any fresh or re-submitted verification document should go back to admin review.
    const { error: resetVerifyError } = await supabase
      .from("tutor_profiles")
      .update({ is_verified: false })
      .eq("id", user.id);
    if (resetVerifyError) return { ok: false, error: resetVerifyError.message };

    const { data: admins, error: adminFetchError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin");
    if (adminFetchError) return { ok: false, error: adminFetchError.message };

    if ((admins ?? []).length > 0) {
      const { error: adminNotifyError } = await supabase.from("notifications").insert(
        (admins ?? []).map((admin) => ({
          user_id: admin.id,
          type: "tutor_verification_submitted",
          title: tNotifications("adminVerificationSubmittedTitle"),
          content: tNotifications("adminVerificationSubmittedContent", { name: profile.full_name }),
          related_id: user.id,
        })),
      );
      if (adminNotifyError) return { ok: false, error: adminNotifyError.message };
    }
  }

  return { ok: true };
}
