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
  // 若项目仍开启「Confirm email」，此处通常无 session，跳转 onboarding 可能再被拦回登录。
  // 请在 Supabase 控制台关闭邮箱确认（见仓库根目录 .env.example 说明）。
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/${locale}/auth?error=${encodeURIComponent(error.message)}`);

  redirect(`/${locale}/onboarding`);
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
