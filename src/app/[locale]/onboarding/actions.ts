"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncAuthUserMetadata } from "@/lib/sync-auth-user-metadata";

export async function completeOnboardingAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const fullName = String(formData.get("full_name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const role = String(formData.get("role") ?? "student");

  /* Manager/admin accounts are not self-service; assign only via Supabase / SQL. */
  if (role === "admin") {
    redirect(`/${locale}/onboarding?error=admin_forbidden`);
  }
  if (!["tutor", "student"].includes(role)) {
    redirect(`/${locale}/onboarding?error=invalid_role`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth`);

  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      role,
      full_name: fullName,
      phone,
      email: user.email ?? "",
    },
    { onConflict: "id" },
  );

  if (error) redirect(`/${locale}/onboarding?error=${encodeURIComponent(error.message)}`);

  const fullNameTrimmed = fullName.trim();
  const { error: metadataError } = await syncAuthUserMetadata(supabase, {
    role: role as "student" | "tutor",
    full_name: fullNameTrimmed,
  });
  if (metadataError) {
    redirect(`/${locale}/onboarding?error=${encodeURIComponent(metadataError)}`);
  }

  redirect(`/${locale}/dashboard`);
}
