"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function submitReviewAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const bookingId = String(formData.get("booking_id") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const commentRaw = String(formData.get("comment") ?? "").trim();
  const comment = commentRaw.length > 0 ? commentRaw : null;

  if (!bookingId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`/${locale}/dashboard/student?error=${encodeURIComponent("Invalid review input.")}`);
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "student") {
    redirect(`/${locale}/dashboard`);
  }

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, tutor_id, student_id, tutor_decision, session_date")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.student_id !== user.id || booking.tutor_decision !== "accepted") {
    redirect(`/${locale}/dashboard/student?error=${encodeURIComponent("You are not eligible to review this booking yet.")}`);
  }

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("booking_id", booking.id)
    .maybeSingle();
  if (existingReview) {
    redirect(`/${locale}/dashboard/student?error=${encodeURIComponent("This booking has already been reviewed.")}`);
  }

  const { error: insertError } = await supabase.from("reviews").insert({
    booking_id: booking.id,
    tutor_id: booking.tutor_id,
    student_id: user.id,
    rating,
    comment,
  });
  if (insertError) {
    redirect(`/${locale}/dashboard/student?error=${encodeURIComponent(insertError.message)}`);
  }

  redirect(`/${locale}/tutors/${booking.tutor_id}?reviewed=1#reviews`);
}
