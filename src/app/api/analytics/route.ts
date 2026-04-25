import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await req.json();
    // Hook: forward to warehouse / Slack / GA later
  } catch {
    // ignore malformed body
  }
  return new NextResponse(null, { status: 204 });
}
