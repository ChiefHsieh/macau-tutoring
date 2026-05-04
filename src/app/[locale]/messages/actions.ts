"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessageAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const receiverId = String(formData.get("receiver_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const bookingIdRaw = String(formData.get("booking_id") ?? "").trim();
  const bookingId = bookingIdRaw.length > 0 ? bookingIdRaw : null;

  if (!receiverId || !content) {
    return { error: "Missing receiver or content." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized." };
  }
  if (receiverId === user.id) {
    return { error: "Cannot message yourself." };
  }

  const insertStart = Date.now();
  const { error } = await supabase.from("messages").insert({
    sender_id: user.id,
    receiver_id: receiverId,
    booking_id: bookingId,
    content,
  });
  console.info("[perf][messages-thread][send-insert-ms]", Date.now() - insertStart, {
    locale,
    receiverId,
    hasError: !!error,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/${locale}/messages`);
  revalidatePath(`/${locale}/messages/${receiverId}`);
  revalidatePath(`/${locale}/notifications`);
  return { error: null };
}

export async function markThreadReadAction(peerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const markReadStart = Date.now();
  const { data, error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", user.id)
    .eq("sender_id", peerId)
    .eq("is_read", false)
    .select("id");

  console.info("[perf][messages-thread][mark-read-ms]", Date.now() - markReadStart, {
    peerId,
    updatedCount: data?.length ?? 0,
    hasError: !!error,
  });
}
