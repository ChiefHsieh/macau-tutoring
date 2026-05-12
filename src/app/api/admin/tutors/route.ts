import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAdminUserId } from "@/lib/admin-session";

const PAGE_SIZE = 20;

export type AdminTutorListItem = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  subjects: string[];
  registeredAt: string;
  lastOnlineAt: string | null;
};

async function resolveSearchTutorIds(supabase: Awaited<ReturnType<typeof createClient>>, search: string): Promise<string[]> {
  const safe = search.slice(0, 120);
  const pat = `%${safe}%`;
  const [{ data: byName }, { data: byProfile }, { data: bySubject }] = await Promise.all([
    supabase.from("users").select("id").eq("role", "tutor").or(`full_name.ilike.${pat},email.ilike.${pat}`),
    supabase.from("tutor_profiles").select("id").ilike("display_name", pat),
    supabase.from("tutor_subjects").select("tutor_id").ilike("subject", pat),
  ]);
  const ids = new Set<string>();
  for (const r of byName ?? []) ids.add(r.id);
  for (const r of byProfile ?? []) ids.add(r.id);
  for (const r of bySubject ?? []) ids.add(r.tutor_id);
  return [...ids];
}

export async function GET(req: NextRequest) {
  const adminId = await getAdminUserId();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const searchRaw = (searchParams.get("search") ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  let filterIds: string[] | null = null;
  if (searchRaw.length > 0) {
    filterIds = await resolveSearchTutorIds(supabase, searchRaw);
    if (filterIds.length === 0) {
      return NextResponse.json({
        tutors: [] as AdminTutorListItem[],
        page,
        pageSize: PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
    }
  }

  let countQuery = supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "tutor");
  let listQuery = supabase
    .from("users")
    .select("id, full_name, email, created_at")
    .eq("role", "tutor")
    .order("created_at", { ascending: false });

  if (filterIds) {
    countQuery = countQuery.in("id", filterIds);
    listQuery = listQuery.in("id", filterIds);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ count }, { data: rows, error }] = await Promise.all([countQuery, listQuery.range(from, to)]);

  if (error) {
    console.error("[api/admin/tutors]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tutorIds = (rows ?? []).map((r) => r.id as string);

  const profileById = new Map<string, { display_name: string | null; profile_photo: string | null }>();
  const subjectsByTutor = new Map<string, string[]>();

  if (tutorIds.length > 0) {
    const [{ data: profiles }, { data: subjectRows }] = await Promise.all([
      supabase.from("tutor_profiles").select("id, display_name, profile_photo").in("id", tutorIds),
      supabase.from("tutor_subjects").select("tutor_id, subject").in("tutor_id", tutorIds),
    ]);

    for (const p of profiles ?? []) {
      profileById.set(p.id, { display_name: p.display_name, profile_photo: p.profile_photo });
    }
    for (const s of subjectRows ?? []) {
      const subj = (s.subject ?? "").trim();
      if (!subj) continue;
      const cur = subjectsByTutor.get(s.tutor_id) ?? [];
      cur.push(subj);
      subjectsByTutor.set(s.tutor_id, cur);
    }
  }

  const lastOnlineById = new Map<string, string | null>();
  const adminAuth = getAdminSupabaseClient();
  if (adminAuth && tutorIds.length > 0) {
    await Promise.all(
      tutorIds.map(async (id) => {
        try {
          const { data, error: authErr } = await adminAuth.auth.admin.getUserById(id);
          if (authErr) {
            lastOnlineById.set(id, null);
            return;
          }
          lastOnlineById.set(id, data.user?.last_sign_in_at ?? null);
        } catch {
          lastOnlineById.set(id, null);
        }
      }),
    );
  }

  const tutors: AdminTutorListItem[] = (rows ?? []).map((row) => {
    const id = row.id as string;
    const tp = profileById.get(id);
    const rawSubjects = subjectsByTutor.get(id) ?? [];
    const subjects = [...new Set(rawSubjects)];
    const displayName =
      (tp?.display_name?.trim() ||
        (row.full_name as string)?.trim() ||
        (row.email as string)?.split("@")[0] ||
        "").trim() ||
      id.slice(0, 8);

    return {
      id,
      displayName,
      avatarUrl: tp?.profile_photo ?? null,
      subjects,
      registeredAt: row.created_at as string,
      lastOnlineAt: lastOnlineById.get(id) ?? null,
    };
  });

  const total = count ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / PAGE_SIZE);

  return NextResponse.json({
    tutors,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages,
  });
}
