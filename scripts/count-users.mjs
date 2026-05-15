import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const env = {};
  try {
    const text = readFileSync(".env.local", "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const i = trimmed.indexOf("=");
      if (i < 0) continue;
      const key = trimmed.slice(0, i).trim();
      let val = trimmed.slice(i + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  } catch {
    /* ignore */
  }
  return env;
}

const env = { ...process.env, ...loadEnvLocal() };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const key = serviceKey || anonKey;
const usingServiceRole = Boolean(serviceKey);

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in .env.local");
  process.exit(1);
}

if (!usingServiceRole) {
  console.warn(
    "WARN: SUPABASE_SERVICE_ROLE_KEY not set — public.users counts may be 0 due to RLS (use service role or SQL editor).\n",
  );
}

const supabase = createClient(url, key);

async function count(table, filter) {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count: n, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return n ?? 0;
}

const student = await count("users", (q) => q.eq("role", "student"));
const tutor = await count("users", (q) => q.eq("role", "tutor"));
const admin = await count("users", (q) => q.eq("role", "admin"));
const totalUsers = await count("users");
const tutorProfiles = await count("tutor_profiles");

console.log(
  JSON.stringify(
    {
      dataSource: usingServiceRole ? "service_role (full access)" : "anon_key (users may be hidden by RLS)",
      registeredStudents: student,
      registeredTutors: tutor,
      adminAccounts: admin,
      totalUsersTableRows: totalUsers,
      tutorProfileRows: tutorProfiles,
    },
    null,
    2,
  ),
);
