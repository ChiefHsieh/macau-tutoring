import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminUserId } from "@/lib/admin-session";

/**
 * Ensures the admin may open a DM thread with a tutor. Threads are implicit (messages table only).
 * Returns the tutor peer id and client redirect path (no separate conversation row).
 */
export async function POST(req: NextRequest) {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { tutorId?: string; locale?: string };
  try {
    body = (await req.json()) as { tutorId?: string; locale?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tutorId = String(body.tutorId ?? "").trim();
  const locale = String(body.locale ?? "zh-HK").trim() || "zh-HK";

  if (!tutorId || tutorId === adminId) {
    return NextResponse.json({ error: "Invalid tutorId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: tutor } = await supabase.from("users").select("id, role, full_name").eq("id", tutorId).maybeSingle();

  if (!tutor || tutor.role !== "tutor") {
    return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
  }

  const peerId = tutor.id;
  const redirectPath = `/${locale}/messages/${peerId}?focus=1`;

  return NextResponse.json({
    peerId,
    tutorName: tutor.full_name?.trim() || peerId.slice(0, 8),
    redirectPath,
  });
}
