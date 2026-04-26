"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "zh-HK");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
  revalidatePath(`/${locale}/notifications`);
}

export async function deleteNotificationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "zh-HK");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath(`/${locale}/notifications`);
}

export async function openNotificationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const locale = String(formData.get("locale") ?? "zh-HK");
  const href = String(formData.get("href") ?? "").trim();
  const fallback = `/${locale}/notifications`;
  const target = href.startsWith("/") ? href : fallback;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth`);
  }

  if (id) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
    revalidatePath(`/${locale}/notifications`);
  }

  redirect(target);
}
