"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function buildRedirectWithParams(basePath: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params);
  return `${basePath}?${qs.toString()}`;
}

export async function updateDisplayNameAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const returnToRaw = String(formData.get("return_to") ?? "").trim();
  const nextName = String(formData.get("full_name") ?? "").trim();

  const safeReturnTo =
    returnToRaw.startsWith(`/${locale}/dashboard`) ? returnToRaw : `/${locale}/dashboard`;

  if (nextName.length < 2 || nextName.length > 80) {
    redirect(buildRedirectWithParams(safeReturnTo, { error: "name_invalid_length" }));
  }

  const { user, profile } = await requireProfile(locale);
  const supabase = await createClient();

  const { error: userUpdateError } = await supabase
    .from("users")
    .update({ full_name: nextName })
    .eq("id", user.id);
  if (userUpdateError) {
    redirect(buildRedirectWithParams(safeReturnTo, { error: userUpdateError.message }));
  }

  if (profile.role === "tutor") {
    const { error: tutorUpdateError } = await supabase
      .from("tutor_profiles")
      .update({ display_name: nextName })
      .eq("id", user.id);
    if (tutorUpdateError && !tutorUpdateError.message.includes("0 rows")) {
      redirect(buildRedirectWithParams(safeReturnTo, { error: tutorUpdateError.message }));
    }
  }

  redirect(buildRedirectWithParams(safeReturnTo, { nameUpdated: "1" }));
}
