"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "zh-HK");

  if (!hasSupabaseEnv()) {
    redirect(`/${locale}/auth?error=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/${locale}/auth?error=${encodeURIComponent(error.message)}`);

  redirect(`/${locale}/dashboard`);
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "zh-HK");

  if (!hasSupabaseEnv()) {
    redirect(`/${locale}/auth?error=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  const supabase = await createClient();
  // 若开启「Confirm email」，通常无 session：只能回登录页提示去邮箱验证（见 .env.example）。
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/${locale}/auth?error=${encodeURIComponent(error.message)}`);

  const user = data.user;
  const session = data.session;

  if (user && session) {
    const displayName = (user.email?.split("@")[0] ?? "User").trim() || "User";
    const { error: profileError } = await supabase.from("users").upsert(
      {
        id: user.id,
        role: "student",
        full_name: displayName,
        phone: "-",
        email: user.email ?? email,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      redirect(`/${locale}/onboarding?error=${encodeURIComponent(profileError.message)}`);
    }

    redirect(`/${locale}/dashboard`);
  }

  redirect(`/${locale}/auth?registered=1`);
}

export async function signOutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  if (!hasSupabaseEnv()) {
    redirect(`/${locale}`);
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function sendPhoneOtpAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const phone = String(formData.get("phone") ?? "");

  if (!hasSupabaseEnv()) {
    redirect(`/${locale}/auth?error=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  if (!phone) {
    redirect(`/${locale}/auth?error=${encodeURIComponent("Phone is required.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: "sms" },
  });

  if (error) {
    redirect(`/${locale}/auth?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/auth?phoneStep=verify&phone=${encodeURIComponent(phone)}`);
}

export async function verifyPhoneOtpAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const phone = String(formData.get("phone") ?? "");
  const token = String(formData.get("token") ?? "");

  if (!hasSupabaseEnv()) {
    redirect(`/${locale}/auth?error=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  if (!phone || !token) {
    redirect(`/${locale}/auth?error=${encodeURIComponent("Phone and OTP code are required.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    redirect(`/${locale}/auth?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/dashboard`);
}
