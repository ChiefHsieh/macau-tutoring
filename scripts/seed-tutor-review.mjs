/**
 * Insert one 5-star review for a tutor (service role required).
 * Usage: node scripts/seed-tutor-review.mjs <tutorId> <expectedDisplayName>
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const tutorId = process.argv[2];
const expectedName = process.argv[3];
if (!tutorId || !expectedName) {
  console.error("Usage: node scripts/seed-tutor-review.mjs <tutorId> <expectedDisplayName>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  console.error("Run supabase/seed-elvira-tutor-reviews.sql in Supabase SQL Editor instead.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const { data: profile, error: pErr } = await supabase
  .from("tutor_profiles")
  .select("id, display_name, average_rating, total_reviews")
  .eq("id", tutorId)
  .maybeSingle();

if (pErr) {
  console.error("tutor_profiles error:", pErr.message);
  process.exit(1);
}
if (!profile) {
  console.error("No tutor_profiles row for id:", tutorId);
  process.exit(1);
}
if (profile.display_name?.trim() !== expectedName.trim()) {
  console.error(
    `Name mismatch: got "${profile.display_name}", expected "${expectedName}"`,
  );
  process.exit(1);
}

const { error: delErr } = await supabase.from("reviews").delete().eq("tutor_id", tutorId);
if (delErr) {
  console.error("delete reviews error:", delErr.message);
  process.exit(1);
}

const createdAt = new Date(Date.now() - 14 * 86400000).toISOString();
const { error: insErr } = await supabase.from("reviews").insert({
  tutor_id: tutorId,
  student_id: null,
  booking_id: null,
  rating: 5,
  comment: null,
  created_at: createdAt,
});

if (insErr) {
  console.error("insert review error:", insErr.message);
  process.exit(1);
}

const { data: after, error: aErr } = await supabase
  .from("tutor_profiles")
  .select("display_name, average_rating, total_reviews")
  .eq("id", tutorId)
  .single();

if (aErr) {
  console.error("refetch error:", aErr.message);
  process.exit(1);
}

console.log("OK", after);
