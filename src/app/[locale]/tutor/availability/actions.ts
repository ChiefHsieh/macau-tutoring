"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AvailabilitySlotResult = { ok: true } | { ok: false; error: string };
const ERR_SETUP_REQUIRED = "availability_setup_required";

const recurringSchema = z
  .object({
    day_of_week: z.coerce.number().int().min(0).max(6),
    start_time: z.string().min(1),
    end_time: z.string().min(1),
  })
  .refine((v) => v.start_time < v.end_time, {
    message: "End time must be later than start time.",
  });

const blockSchema = z
  .object({
    block_date: z.string().min(1),
    start_time: z.string().min(1),
    end_time: z.string().min(1),
    reason: z.string().optional(),
  })
  .refine((v) => v.start_time < v.end_time, {
    message: "End time must be later than start time.",
  });

const oneOffSchema = z
  .object({
    session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start_time: z.string().min(1),
    end_time: z.string().min(1),
  })
  .refine((v) => v.start_time < v.end_time, {
    message: "End time must be later than start time.",
  });

async function ensureTutorProfileExistsForAvailability(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutor_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  return { supabase, exists: Boolean(data?.id), error };
}

export async function addRecurringAvailabilityAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const parsed = recurringSchema.safeParse({
    day_of_week: formData.get("day_of_week"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/tutor/availability?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input.")}`);
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") redirect(`/${locale}/dashboard`);

  const { supabase, exists, error: tutorProfileError } = await ensureTutorProfileExistsForAvailability(user.id);
  if (tutorProfileError) {
    redirect(`/${locale}/tutor/availability?error=${encodeURIComponent(tutorProfileError.message)}`);
  }
  if (!exists) {
    redirect(`/${locale}/tutor/profile/setup?error=${ERR_SETUP_REQUIRED}`);
  }
  const { error } = await supabase.from("tutor_availability").insert({
    tutor_id: user.id,
    ...parsed.data,
  });

  if (error) {
    redirect(`/${locale}/tutor/availability?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/tutor/availability?saved=recurring`);
}

export async function deleteRecurringAvailabilityAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const id = String(formData.get("id") ?? "");

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") redirect(`/${locale}/dashboard`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_availability")
    .delete()
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    redirect(`/${locale}/tutor/availability?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/tutor/availability?saved=deleted`);
}

export async function saveRecurringSlotFromCalendarAction(
  locale: string,
  day_of_week: number,
  start_time: string,
  end_time: string,
): Promise<AvailabilitySlotResult> {
  const parsed = recurringSchema.safeParse({
    day_of_week,
    start_time,
    end_time,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid slot." };
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") {
    return { ok: false, error: "Not a tutor account." };
  }

  const { supabase, exists, error: tutorProfileError } = await ensureTutorProfileExistsForAvailability(user.id);
  if (tutorProfileError) {
    return { ok: false, error: tutorProfileError.message };
  }
  if (!exists) {
    return { ok: false, error: ERR_SETUP_REQUIRED };
  }
  const { error } = await supabase.from("tutor_availability").insert({
    tutor_id: user.id,
    ...parsed.data,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteRecurringSlotFromCalendarAction(
  locale: string,
  rowId: string,
): Promise<AvailabilitySlotResult> {
  if (!rowId) {
    return { ok: false, error: "Missing id." };
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") {
    return { ok: false, error: "Not a tutor account." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_availability")
    .delete()
    .eq("id", rowId)
    .eq("tutor_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function saveOneOffSlotFromCalendarAction(
  locale: string,
  session_date: string,
  start_time: string,
  end_time: string,
): Promise<AvailabilitySlotResult> {
  const parsed = oneOffSchema.safeParse({ session_date, start_time, end_time });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid slot." };
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") {
    return { ok: false, error: "Not a tutor account." };
  }

  const { supabase, exists, error: tutorProfileError } = await ensureTutorProfileExistsForAvailability(user.id);
  if (tutorProfileError) {
    return { ok: false, error: tutorProfileError.message };
  }
  if (!exists) {
    return { ok: false, error: ERR_SETUP_REQUIRED };
  }
  const { error } = await supabase.from("tutor_availability_one_off").insert({
    tutor_id: user.id,
    session_date: parsed.data.session_date,
    start_time: parsed.data.start_time,
    end_time: parsed.data.end_time,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteOneOffSlotFromCalendarAction(
  locale: string,
  rowId: string,
): Promise<AvailabilitySlotResult> {
  if (!rowId) {
    return { ok: false, error: "Missing id." };
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") {
    return { ok: false, error: "Not a tutor account." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_availability_one_off")
    .delete()
    .eq("id", rowId)
    .eq("tutor_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function deleteOneOffAvailabilityAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const id = String(formData.get("id") ?? "");

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") redirect(`/${locale}/dashboard`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_availability_one_off")
    .delete()
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    redirect(`/${locale}/tutor/availability?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/tutor/availability?saved=deleted`);
}

export async function addBlockedSlotAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const parsed = blockSchema.safeParse({
    block_date: formData.get("block_date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    redirect(`/${locale}/tutor/availability?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input.")}`);
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") redirect(`/${locale}/dashboard`);

  const { supabase, exists, error: tutorProfileError } = await ensureTutorProfileExistsForAvailability(user.id);
  if (tutorProfileError) {
    redirect(`/${locale}/tutor/availability?error=${encodeURIComponent(tutorProfileError.message)}`);
  }
  if (!exists) {
    redirect(`/${locale}/tutor/profile/setup?error=${ERR_SETUP_REQUIRED}`);
  }
  const { error } = await supabase.from("tutor_unavailability_blocks").insert({
    tutor_id: user.id,
    ...parsed.data,
    reason: parsed.data.reason || null,
  });

  if (error) {
    redirect(`/${locale}/tutor/availability?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/tutor/availability?saved=blocked`);
}

export async function deleteBlockedSlotAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");
  const id = String(formData.get("id") ?? "");

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") redirect(`/${locale}/dashboard`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("tutor_unavailability_blocks")
    .delete()
    .eq("id", id)
    .eq("tutor_id", user.id);

  if (error) {
    redirect(`/${locale}/tutor/availability?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}/tutor/availability?saved=unblocked`);
}
