"use server";

import { revalidatePath } from "next/cache";
import { invalidateUnreadNotificationCount } from "@/lib/notification-unread-count";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Clears the header bell badge: mark every unread row read, then go to the list. */
export async function markAllNotificationsReadAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth`);
  }

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  invalidateUnreadNotificationCount(user.id);
  revalidatePath(`/${locale}`, "layout");
  revalidatePath(`/${locale}/notifications`);
  redirect(`/${locale}/notifications`);
}

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
  invalidateUnreadNotificationCount(user.id);
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
  invalidateUnreadNotificationCount(user.id);
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
    invalidateUnreadNotificationCount(user.id);
    revalidatePath(`/${locale}/notifications`);
  }

  redirect(target);
}
