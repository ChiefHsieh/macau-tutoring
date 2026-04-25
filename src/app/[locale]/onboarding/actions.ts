"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function completeOnboardingAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const fullName = String(formData.get("full_name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const role = String(formData.get("role") ?? "student");

  if (!["tutor", "student", "admin"].includes(role)) {
    redirect(`/${locale}/onboarding?error=Invalid role`);
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

  redirect(`/${locale}/dashboard`);
}
