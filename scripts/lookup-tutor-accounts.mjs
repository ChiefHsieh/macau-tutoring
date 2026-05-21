/**
 * Look up tutor_profiles + public.users by display_name.
 * Usage: node scripts/lookup-tutor-accounts.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const NAMES = [
  "Kelvin Ao",
  "Laver",
  "張洛怡",
  "逄嘉濠",
  "詠瑩",
  "陳嘉怡",
  "Sunny Hsieh",
];

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
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL/key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: profiles, error: pErr } = await supabase
  .from("tutor_profiles")
  .select("id, display_name, hourly_rate, is_verified, created_at")
  .in("display_name", NAMES);

if (pErr) {
  console.error("tutor_profiles error:", pErr.message);
  process.exit(1);
}

const foundNames = new Set((profiles ?? []).map((p) => p.display_name));
const missing = NAMES.filter((n) => !foundNames.has(n));

const ids = (profiles ?? []).map((p) => p.id);
let users = [];
if (ids.length > 0) {
  const { data, error: uErr } = await supabase
    .from("users")
    .select("id, role, full_name, email, phone, created_at, is_verified")
    .in("id", ids);
  if (uErr) {
    console.error("users error:", uErr.message);
    process.exit(1);
  }
  users = data ?? [];
}

const userById = new Map(users.map((u) => [u.id, u]));

console.log("\n=== Tutor accounts (tutor_profiles.id = auth/users.id) ===\n");
for (const name of NAMES) {
  const p = (profiles ?? []).find((x) => x.display_name === name);
  if (!p) {
    console.log(`— ${name}`);
    console.log("  Status: NO tutor_profiles row\n");
    continue;
  }
  const u = userById.get(p.id);
  console.log(`— ${p.display_name}`);
  console.log(`  UUID:     ${p.id}`);
  if (u) {
    console.log(`  Role:     ${u.role}`);
    console.log(`  Email:    ${u.email ?? "(empty)"}`);
    console.log(`  Phone:    ${u.phone ?? "(empty)"}`);
    console.log(`  Full name (registered): ${u.full_name}`);
    console.log(`  Registered: ${u.created_at}`);
    console.log(`  User verified flag: ${u.is_verified}`);
  } else {
    console.log("  Status: tutor_profiles exists but NO public.users row (not a normal signup)");
  }
  console.log(`  Profile created: ${p.created_at}`);
  console.log(`  Hourly rate: MOP ${p.hourly_rate}`);
  console.log(`  Profile verified: ${p.is_verified}\n`);
}

if (missing.length) {
  console.log("Names not found in tutor_profiles:", missing.join(", "));
}

const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
if (hasServiceRole && ids.length > 0) {
  console.log("\n=== auth.users (service role) ===\n");
  for (const name of NAMES) {
    const p = (profiles ?? []).find((x) => x.display_name === name);
    if (!p) continue;
    const { data: au, error: aErr } = await supabase.auth.admin.getUserById(p.id);
    console.log(`— ${name} (${p.id})`);
    if (aErr) {
      console.log(`  auth error: ${aErr.message}\n`);
      continue;
    }
    if (!au?.user) {
      console.log("  auth.users: NO row (profile-only / seeded id)\n");
      continue;
    }
    const u = au.user;
    console.log(`  auth email: ${u.email ?? "(none)"}`);
    console.log(`  auth created: ${u.created_at}`);
    console.log(`  metadata role: ${u.user_metadata?.role ?? "(none)"}`);
    console.log(`  metadata full_name: ${u.user_metadata?.full_name ?? "(none)"}`);
    console.log(`  last sign in: ${u.last_sign_in_at ?? "(never)"}\n`);
  }
} else if (ids.length > 0) {
  console.log("\n(Set SUPABASE_SERVICE_ROLE_KEY in .env.local to also check auth.users)\n");
}

// Fuzzy fallback for missing names
if (missing.length > 0) {
  console.log("\n=== Fuzzy name search (partial) ===\n");
  for (const fragment of missing) {
    const { data: fuzzy } = await supabase
      .from("tutor_profiles")
      .select("id, display_name")
      .ilike("display_name", `%${fragment.replace(/[%_]/g, "")}%`)
      .limit(5);
    if (fuzzy?.length) {
      console.log(`"${fragment}" →`, fuzzy.map((r) => r.display_name).join(", "));
    } else {
      console.log(`"${fragment}" → (no similar names)`);
    }
  }
}
