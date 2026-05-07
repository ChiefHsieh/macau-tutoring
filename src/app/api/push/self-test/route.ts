import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPushSelfTest } from "@/lib/push-notifications";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { locale?: string } | null;
  const locale = String(body?.locale ?? "zh-HK");
  const result = await runPushSelfTest({ userId: user.id, locale });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
