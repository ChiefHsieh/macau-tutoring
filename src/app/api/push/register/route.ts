import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { token?: string; platform?: string }
    | null;
  const token = String(body?.token ?? "").trim();
  const platform = String(body?.platform ?? "android").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  const { error } = await supabase.from("device_push_tokens").upsert(
    {
      user_id: user.id,
      push_token: token,
      platform,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,push_token" },
  );
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
