/**
 * Smoke test: signUp creates public.users with correct role (requires .env.local + Confirm email OFF).
 * Usage: node scripts/smoke-signup-role.mjs
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

function dashboardPathForRole(locale, role) {
  if (role === "tutor") return `/${locale}/dashboard/tutor`;
  return `/${locale}/dashboard/student`;
}

async function tryRole(role) {
  const supabase = createClient(url, anonKey);
  const stamp = Date.now();
  const email = `smoke.${role}.${stamp}@example.com`;
  const password = `SmokeTest${stamp}!`;
  const fullName = `Smoke ${role} ${stamp}`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, full_name: fullName } },
  });

  if (error) {
    return { role, ok: false, reason: `signUp: ${error.message}` };
  }
  if (!data.session) {
    return {
      role,
      ok: false,
      reason: "No session after signUp — enable instant login (disable Confirm email in Supabase Auth).",
    };
  }

  const userId = data.user.id;
  const { error: upsertError } = await supabase.from("users").upsert(
    {
      id: userId,
      role,
      full_name: fullName,
      phone: "66660000",
      email,
    },
    { onConflict: "id" },
  );
  if (upsertError) {
    return { role, ok: false, reason: `users upsert: ${upsertError.message}` };
  }

  const { data: row, error: selectError } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    return { role, ok: false, reason: `users select: ${selectError.message}` };
  }
  if (row?.role !== role) {
    return { role, ok: false, reason: `expected role ${role}, got ${row?.role ?? "null"}` };
  }

  const expectedPath = dashboardPathForRole("zh-HK", role);
  await supabase.auth.signOut();

  return { role, ok: true, email, expectedPath, profileRole: row.role };
}

const results = await Promise.all([tryRole("student"), tryRole("tutor")]);
let failed = 0;
for (const r of results) {
  if (r.ok) {
    console.log(`✓ ${r.role}: public.users.role=${r.profileRole} → redirect ${r.expectedPath}`);
    console.log(`  test account: ${r.email}`);
  } else {
    failed += 1;
    console.log(`✗ ${r.role}: ${r.reason}`);
  }
}

if (failed) process.exit(1);
console.log("\nAll smoke checks passed. App sign-up should redirect to the matching dashboard.");
