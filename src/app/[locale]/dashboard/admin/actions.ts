"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function verifyTutorDocumentAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const tutorId = String(formData.get("tutor_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const rejectReason = String(formData.get("reject_reason") ?? "").trim();

  if (!tutorId || (decision !== "valid" && decision !== "invalid")) {
    redirect(`/${locale}/dashboard/admin?error=${encodeURIComponent("Invalid verification request.")}`);
  }
  if (decision === "invalid" && rejectReason.length < 5) {
    redirect(
      `/${locale}/dashboard/admin?error=${encodeURIComponent(
        "Rejection reason must be at least 5 characters.",
      )}`,
    );
  }

  const { profile } = await requireProfile(locale);
  if (profile.role !== "admin") {
    redirect(`/${locale}/dashboard`);
  }

  const supabase = await createClient();
  const isVerified = decision === "valid";

  const { error: updateError } = await supabase
    .from("tutor_profiles")
    .update({ is_verified: isVerified })
    .eq("id", tutorId);

  if (updateError) {
    redirect(`/${locale}/dashboard/admin?error=${encodeURIComponent(updateError.message)}`);
  }

  const noticeTitle = isVerified ? "Verification approved" : "Verification rejected";
  const noticeBody = isVerified
    ? "Your tutor profile has been verified and now shows a verified badge."
    : `Your verification document was marked invalid. Reason: ${rejectReason}. Please re-upload a valid document.`;

  const { error: notifyError } = await supabase.from("notifications").insert({
    user_id: tutorId,
    type: "system",
    title: noticeTitle,
    content: noticeBody,
    related_id: tutorId,
  });

  if (notifyError) {
    redirect(`/${locale}/dashboard/admin?error=${encodeURIComponent(notifyError.message)}`);
  }

  redirect(`/${locale}/dashboard/admin?updated=1`);
}
