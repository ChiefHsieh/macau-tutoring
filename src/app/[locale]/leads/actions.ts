"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

const leadSchema = z.object({
  child_grade: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  phone: z.string().trim().min(6),
  wechat: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  district: z.string().trim().optional(),
  budget_max: z.string().trim().optional(),
  lead_source: z.string().trim().optional(),
});

export async function submitParentLeadAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "zh-HK");

  if (!hasSupabaseEnv()) {
    redirect(`/${locale}?error=${encodeURIComponent("Supabase is not configured yet.")}`);
  }

  const parsed = leadSchema.safeParse({
    child_grade: formData.get("child_grade"),
    subject: formData.get("subject"),
    phone: formData.get("phone"),
    wechat: formData.get("wechat"),
    notes: formData.get("notes"),
    district: formData.get("district"),
    budget_max: formData.get("budget_max"),
    lead_source: formData.get("lead_source"),
  });

  if (!parsed.success) {
    redirect(`/${locale}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input.")}`);
  }

  const budgetRaw = parsed.data.budget_max?.trim() ?? "";
  let budgetMax: number | null = null;
  if (budgetRaw.length > 0) {
    const n = Number.parseInt(budgetRaw, 10);
    if (!Number.isNaN(n) && n > 0) budgetMax = n;
  }

  const district = parsed.data.district?.trim() || null;
  const leadSource =
    parsed.data.lead_source?.trim() || "homepage_quick_form";

  const supabase = await createClient();
  const { error } = await supabase.from("parent_leads").insert({
    child_grade: parsed.data.child_grade,
    subject: parsed.data.subject,
    phone: parsed.data.phone,
    wechat: parsed.data.wechat || null,
    notes: parsed.data.notes || null,
    district,
    budget_max: budgetMax,
    lead_source: leadSource,
  });

  if (error) {
    redirect(`/${locale}?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/${locale}?lead=1`);
}
