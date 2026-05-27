"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { computeAvailableSlots, type TimeRange } from "@/lib/availability";
import { getMacauWeekdayIndex } from "@/lib/macau-ymd";

const sessionSchema = z.object({
  session_date: z.string().min(1),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
});

const createBookingSchema = z.object({
  tutor_id: z.string().uuid(),
  subject: z.string().min(1),
  grade_level: z.string().min(1),
  sessions: z.array(sessionSchema).min(1).max(20),
});

function minutesBetween(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function sessionKey(s: { session_date: string; start_time: string; end_time: string }) {
  return `${s.session_date}|${s.start_time}|${s.end_time}`;
}

async function loadAvailableSlotsForDate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tutorId: string,
  sessionDate: string,
) {
  const weekDay = getMacauWeekdayIndex(sessionDate);

  const [{ data: availRows }, { data: bookingRows }, blocksResult, oneOffRes] = await Promise.all([
    supabase
      .from("tutor_availability")
      .select("start_time, end_time")
      .eq("tutor_id", tutorId)
      .eq("day_of_week", weekDay),
    supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("tutor_id", tutorId)
      .eq("session_date", sessionDate)
      .in("session_status", ["upcoming"]),
    supabase
      .from("tutor_unavailability_blocks")
      .select("start_time, end_time")
      .eq("tutor_id", tutorId)
      .eq("block_date", sessionDate),
    supabase
      .from("tutor_availability_one_off")
      .select("start_time, end_time")
      .eq("tutor_id", tutorId)
      .eq("session_date", sessionDate),
  ]);

  const oneOffRows = oneOffRes.error ? [] : oneOffRes.data ?? [];
  const blockedRows = blocksResult.error ? [] : blocksResult.data ?? [];
  const baseRanges = [...(availRows ?? []), ...oneOffRows] as TimeRange[];

  return computeAvailableSlots(baseRanges, bookingRows ?? [], blockedRows, 60);
}

export async function createBookingAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const sessionsRaw = String(formData.get("sessions_json") ?? "[]");

  let sessionsParsed: unknown;
  try {
    sessionsParsed = JSON.parse(sessionsRaw);
  } catch {
    redirect(`/${locale}/booking/new?error=${encodeURIComponent("Invalid sessions payload.")}`);
  }

  const parsed = createBookingSchema.safeParse({
    tutor_id: formData.get("tutor_id"),
    subject: formData.get("subject"),
    grade_level: formData.get("grade_level"),
    sessions: sessionsParsed,
  });

  if (!parsed.success) {
    redirect(
      `/${locale}/booking/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid booking input.")}`,
    );
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "student") {
    redirect(`/${locale}/dashboard`);
  }

  const payload = parsed.data;
  const supabase = await createClient();

  const uniqueSessions = Array.from(
    new Map(payload.sessions.map((s) => [sessionKey(s), s])).values(),
  );

  if (uniqueSessions.length === 0) {
    redirect(`/${locale}/booking/new?error=${encodeURIComponent("Select at least one time slot.")}`);
  }

  const { data: tutorProfile } = await supabase
    .from("tutor_profiles")
    .select("hourly_rate, district")
    .eq("id", payload.tutor_id)
    .maybeSingle();

  if (!tutorProfile) {
    redirect(`/${locale}/booking/new?error=${encodeURIComponent("Tutor profile not found.")}`);
  }

  for (const session of uniqueSessions) {
    const slots = await loadAvailableSlotsForDate(supabase, payload.tutor_id, session.session_date);
    const requested = `${session.start_time}|${session.end_time}`;
    const allowed = slots.some((slot) => `${slot.start_time}|${slot.end_time}` === requested);
    if (!allowed) {
      redirect(
        `/${locale}/booking/new?tutorId=${payload.tutor_id}&date=${session.session_date}&error=${encodeURIComponent("One or more selected slots are no longer available.")}`,
      );
    }
  }

  const { count } = await supabase
    .from("bookings")
    .select("id", { head: true, count: "exact" })
    .eq("student_id", user.id);

  let isFirstSession = (count ?? 0) === 0;

  for (const session of uniqueSessions) {
    const commissionRate = isFirstSession ? 0 : 5;
    const durationMinutes = minutesBetween(session.start_time, session.end_time);
    const totalAmount = Math.round((tutorProfile.hourly_rate * durationMinutes) / 60);
    const commissionAmount = Math.round((totalAmount * commissionRate) / 100);
    const tutorPayout = totalAmount - commissionAmount;

    const { error } = await supabase.from("bookings").insert({
      tutor_id: payload.tutor_id,
      student_id: user.id,
      subject: payload.subject,
      grade_level: payload.grade_level,
      session_date: session.session_date,
      start_time: session.start_time,
      end_time: session.end_time,
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
      redirect(
        `/${locale}/booking/new?tutorId=${payload.tutor_id}&date=${session.session_date}&error=${encodeURIComponent(error.message)}`,
      );
    }

    isFirstSession = false;
  }

  revalidatePath(`/${locale}`);

  redirect(`/${locale}/messages/${payload.tutor_id}?fromBooking=1&count=${uniqueSessions.length}`);
}
