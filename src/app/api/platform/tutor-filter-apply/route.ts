import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { recordTutorDirectoryFilterApply } from "@/lib/tutor-directory-filter-demand";

export async function POST(req: Request) {
  let locale: string | undefined;
  try {
    const body = (await req.json()) as { locale?: string };
    locale = typeof body.locale === "string" ? body.locale : undefined;
  } catch {
    // empty body is fine
  }

  const ok = await recordTutorDirectoryFilterApply(locale);
  if (ok) {
    revalidateTag("landing-active-demand", "max");
  }

  return new NextResponse(null, { status: ok ? 204 : 503 });
}
