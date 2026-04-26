import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageSection } from "@/components/page-section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type MessagesInboxPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

export default async function MessagesInboxPage({ params, searchParams }: MessagesInboxPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  await requireProfile(locale);

  const t = await getTranslations("Messages");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth`);

  const { data: rows } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, content, created_at, is_read")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(400);

  const { data: unreadRows } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("receiver_id", user.id)
    .eq("is_read", false);

  const unreadByPeer = new Map<string, number>();
  for (const r of unreadRows ?? []) {
    unreadByPeer.set(r.sender_id, (unreadByPeer.get(r.sender_id) ?? 0) + 1);
  }

  const threadLast = new Map<string, MessageRow>();
  for (const r of rows ?? []) {
    const peer = r.sender_id === user.id ? r.receiver_id : r.sender_id;
    if (!threadLast.has(peer)) {
      threadLast.set(peer, r);
    }
  }

  const peerIds = [...threadLast.keys()];
  const [{ data: peers }, { data: peerTutorProfiles }] =
    peerIds.length > 0
      ? await Promise.all([
          supabase.from("users").select("id, full_name").in("id", peerIds),
          supabase.from("tutor_profiles").select("id, display_name").in("id", peerIds),
        ])
      : [{ data: [] as { id: string; full_name: string }[] }, { data: [] as { id: string; display_name: string }[] }];

  const userNameById = new Map((peers ?? []).map((p) => [p.id, p.full_name?.trim() || ""]));
  const tutorNameById = new Map((peerTutorProfiles ?? []).map((p) => [p.id, p.display_name?.trim() || ""]));

  return (
    <main className="space-y-6">
      <PageSection title={t("inboxTitle")} description={t("inboxSubtitle")}>
      {query.error === "support_manager_not_found" ? (
        <Card>
          <CardContent className="pt-5 text-sm text-red-700">{t("supportManagerMissing")}</CardContent>
        </Card>
      ) : null}
      {query.error === "missing_peer" ? (
        <Card>
          <CardContent className="pt-5 text-sm text-red-700">{t("missingPeer")}</CardContent>
        </Card>
      ) : null}
      {peerIds.length === 0 ? (
        <Card>
          <CardContent className="pt-5 text-sm text-zinc-600">{t("inboxEmpty")}</CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {peerIds.map((peerId) => {
            const last = threadLast.get(peerId)!;
            const unread = unreadByPeer.get(peerId) ?? 0;
            const peerName = userNameById.get(peerId) || tutorNameById.get(peerId) || t("unknownUser");
            return (
              <li key={peerId}>
                <Link href={`/${locale}/messages/${peerId}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
                      <div>
                        <p className="font-semibold text-[#1D2129]">{peerName}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{last.content}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(last.created_at).toLocaleString(locale === "en" ? "en-GB" : "zh-HK")}
                        </p>
                      </div>
                      {unread > 0 ? (
                        <Badge variant="default" className="shrink-0">
                          {unread > 99 ? "99+" : unread}
                        </Badge>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      </PageSection>
    </main>
  );
}
