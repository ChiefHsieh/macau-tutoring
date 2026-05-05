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
  booking_id: string | null;
  content: string;
  created_at: string;
  is_read: boolean;
};

function resolveDisplayName({
  preferredName,
  fullName,
  displayName,
  email,
  fallbackId,
  unknownLabel,
}: {
  preferredName?: string | null;
  fullName?: string | null;
  displayName?: string | null;
  email?: string | null;
  fallbackId: string;
  unknownLabel: string;
}) {
  const preferred = preferredName?.trim();
  if (preferred) return preferred;
  const full = fullName?.trim();
  if (full) return full;
  const tutor = displayName?.trim();
  if (tutor) return tutor;
  const emailPrefix = email?.trim().split("@")[0];
  if (emailPrefix) return emailPrefix;
  const shortId = fallbackId.slice(0, 8);
  return shortId ? `${unknownLabel} (${shortId})` : unknownLabel;
}

function parseNameFromNotificationContent(type: string, content: string): string | null {
  const text = content.trim();
  if (!text) return null;

  if (type === "new_message") {
    const idx = text.indexOf(":");
    if (idx > 0) {
      const name = text.slice(0, idx).trim();
      return name || null;
    }
  }

  if (type === "booking_request") {
    const marker = " requested ";
    const idx = text.indexOf(marker);
    if (idx > 0) {
      const name = text.slice(0, idx).trim();
      return name || null;
    }
  }

  return null;
}

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
    .select("id, sender_id, receiver_id, booking_id, content, created_at, is_read")
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
  const messageIdToPeer = new Map<string, string>();
  const bookingIdToPeer = new Map<string, string>();
  for (const r of rows ?? []) {
    const peer = r.sender_id === user.id ? r.receiver_id : r.sender_id;
    if (!threadLast.has(peer)) {
      threadLast.set(peer, r);
    }
    if (r.sender_id !== user.id) {
      messageIdToPeer.set(r.id, r.sender_id);
    }
    if (r.booking_id) {
      bookingIdToPeer.set(r.booking_id, peer);
    }
  }

  const peerIds = [...threadLast.keys()];
  const supportManagerId =
    process.env.SUPPORT_MANAGER_USER_ID?.trim() || process.env.NEXT_PUBLIC_SUPPORT_MANAGER_USER_ID?.trim() || "";
  const [{ data: peers }, { data: peerTutorProfiles }] =
    peerIds.length > 0
      ? await Promise.all([
          supabase.from("users").select("id, full_name, email, role").in("id", peerIds),
          supabase.from("tutor_profiles").select("id, display_name").in("id", peerIds),
        ])
      : [
          { data: [] as { id: string; full_name: string | null; email: string | null; role: string | null }[] },
          { data: [] as { id: string; display_name: string | null }[] },
        ];

  const userNameById = new Map((peers ?? []).map((p) => [p.id, p.full_name?.trim() || ""]));
  const userEmailById = new Map((peers ?? []).map((p) => [p.id, p.email?.trim() || ""]));
  const userRoleById = new Map((peers ?? []).map((p) => [p.id, p.role?.trim() || ""]));
  const tutorNameById = new Map((peerTutorProfiles ?? []).map((p) => [p.id, p.display_name?.trim() || ""]));
  const notificationNameByPeer = new Map<string, string>();

  const unresolvedPeerIds = peerIds.filter((id) => {
    return !userNameById.get(id) && !tutorNameById.get(id) && !userEmailById.get(id);
  });
  if (unresolvedPeerIds.length > 0) {
    const { data: noticeRows } = await supabase
      .from("notifications")
      .select("type, content, related_id, created_at")
      .eq("user_id", user.id)
      .in("type", ["new_message", "booking_request"])
      .order("created_at", { ascending: false })
      .limit(300);

    for (const n of noticeRows ?? []) {
      let peerId: string | undefined;
      if (n.type === "new_message" && n.related_id) {
        peerId = messageIdToPeer.get(n.related_id);
      } else if (n.type === "booking_request" && n.related_id) {
        peerId = bookingIdToPeer.get(n.related_id);
      }
      if (!peerId || !unresolvedPeerIds.includes(peerId) || notificationNameByPeer.has(peerId)) continue;
      const parsed = parseNameFromNotificationContent(n.type, n.content ?? "");
      if (parsed) notificationNameByPeer.set(peerId, parsed);
    }
  }

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
            const isSupportPeer =
              userRoleById.get(peerId) === "admin" || (!!supportManagerId && peerId === supportManagerId);
            const peerName = resolveDisplayName({
              preferredName: isSupportPeer ? t("supportThreadTitle") : notificationNameByPeer.get(peerId),
              fullName: userNameById.get(peerId),
              displayName: tutorNameById.get(peerId),
              email: userEmailById.get(peerId),
              fallbackId: peerId,
              unknownLabel: t("unknownUser"),
            });
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
