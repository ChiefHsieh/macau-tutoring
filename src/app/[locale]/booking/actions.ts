"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { computeAvailableSlots } from "@/lib/availability";

const createBookingSchema = z.object({
  tutor_id: z.string().uuid(),
  subject: z.string().min(1),
  grade_level: z.string().min(1),
  session_date: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
});

function getWeekDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).getDay();
}

function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export async function createBookingAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const parsed = createBookingSchema.safeParse({
    tutor_id: formData.get("tutor_id"),
    subject: formData.get("subject"),
    grade_level: formData.get("grade_level"),
    session_date: formData.get("session_date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/booking/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid booking input.")}`);
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "student") {
    redirect(`/${locale}/dashboard`);
  }

  const payload = parsed.data;
  const weekDay = getWeekDay(payload.session_date);
  const supabase = await createClient();

  const [{ data: availRows }, { data: bookingRows }, blocksResult, { data: tutorProfile }] =
    await Promise.all([
      supabase
        .from("tutor_availability")
        .select("start_time, end_time")
        .eq("tutor_id", payload.tutor_id)
        .eq("day_of_week", weekDay),
      supabase
        .from("bookings")
        .select("start_time, end_time")
        .eq("tutor_id", payload.tutor_id)
        .eq("session_date", payload.session_date)
        .in("session_status", ["upcoming"]),
      supabase
        .from("tutor_unavailability_blocks")
        .select("start_time, end_time")
        .eq("tutor_id", payload.tutor_id)
        .eq("block_date", payload.session_date),
      supabase
        .from("tutor_profiles")
        .select("hourly_rate, district")
        .eq("id", payload.tutor_id)
        .maybeSingle(),
    ]);

  const oneOffRes = await supabase
    .from("tutor_availability_one_off")
    .select("start_time, end_time")
    .eq("tutor_id", payload.tutor_id)
    .eq("session_date", payload.session_date);
  const oneOffRows = oneOffRes.error ? [] : oneOffRes.data ?? [];

  if (!tutorProfile) {
    redirect(`/${locale}/booking/new?error=${encodeURIComponent("Tutor profile not found.")}`);
  }

  const blockedRows = blocksResult.error ? [] : blocksResult.data ?? [];
  const baseRanges = [...(availRows ?? []), ...oneOffRows];
  const slots = computeAvailableSlots(
    baseRanges,
    bookingRows ?? [],
    blockedRows,
    60,
  );

  const requested = `${payload.start_time}|${payload.end_time}`;
  const allowed = slots.some(
    (slot) => `${slot.start_time}|${slot.end_time}` === requested,
  );

  if (!allowed) {
    redirect(`/${locale}/booking/new?tutorId=${payload.tutor_id}&date=${payload.session_date}&error=${encodeURIComponent("Selected slot is no longer available.")}`);
  }

  const { count } = await supabase
    .from("bookings")
    .select("id", { head: true, count: "exact" })
    .eq("student_id", user.id);

  const isFirstSession = (count ?? 0) === 0;
  const commissionRate = isFirstSession ? 0 : 5;
  const durationMinutes = minutesBetween(payload.start_time, payload.end_time);
  const totalAmount = Math.round((tutorProfile.hourly_rate * durationMinutes) / 60);
  const commissionAmount = Math.round((totalAmount * commissionRate) / 100);
  const tutorPayout = totalAmount - commissionAmount;

  const { error } = await supabase.from("bookings").insert({
    tutor_id: payload.tutor_id,
    student_id: user.id,
    subject: payload.subject,
    grade_level: payload.grade_level,
    session_date: payload.session_date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    hourly_rate: tutorProfile.hourly_rate,
    total_amount: totalAmount,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    tutor_payout: tutorPayout,
    payment_status: "pending",
    session_status: "upcoming",
    tutor_decision: "pending",
    is_first_session: isFirstSession,
    is_recurring: false,
    contact_unlocked: false,
  });

  if (error) {
    redirect(`/${locale}/booking/new?tutorId=${payload.tutor_id}&date=${payload.session_date}&error=${encodeURIComponent(error.message)}`);
  }

  // Recent-demand strip: `bookings` → DB trigger `tg_booking_append_recent_demand_feed`
  // → `parent_leads` → `parent_lead_public_feed` (see supabase/bookings-mirror-to-recent-demands.sql).
  revalidatePath(`/${locale}`);

  redirect(`/${locale}/messages/${payload.tutor_id}?fromBooking=1`);
}
