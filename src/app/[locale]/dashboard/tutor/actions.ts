"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function acceptBookingAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const bookingId = String(formData.get("booking_id") ?? "");
  if (!bookingId) {
    redirect(`/${locale}/dashboard/tutor?error=missing_booking`);
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") {
    redirect(`/${locale}/dashboard`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ tutor_decision: "accepted" })
    .eq("id", bookingId)
    .eq("tutor_id", user.id)
    .eq("session_status", "upcoming")
    .eq("tutor_decision", "pending");

  if (error) {
    redirect(`/${locale}/dashboard/tutor?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/dashboard/tutor?accepted=1`);
}

export async function rejectBookingAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const bookingId = String(formData.get("booking_id") ?? "");
  if (!bookingId) {
    redirect(`/${locale}/dashboard/tutor?error=missing_booking`);
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") {
    redirect(`/${locale}/dashboard`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ tutor_decision: "rejected", session_status: "cancelled" })
    .eq("id", bookingId)
    .eq("tutor_id", user.id)
    .eq("session_status", "upcoming")
    .eq("tutor_decision", "pending");

  if (error) {
    redirect(`/${locale}/dashboard/tutor?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/dashboard/tutor?rejected=1`);
}
