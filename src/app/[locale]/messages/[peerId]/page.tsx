import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageSection } from "@/components/page-section";
import { ButtonLink } from "@/components/button-link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageThreadClient } from "@/components/message-thread-client";

type MessageThreadPageProps = {
  params: Promise<{ locale: string; peerId: string }>;
  searchParams: Promise<{ fromBooking?: string; support?: string }>;
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

export default async function MessageThreadPage({ params, searchParams }: MessageThreadPageProps) {
  const { locale, peerId } = await params;
  const query = await searchParams;
  await requireProfile(locale);

  const t = await getTranslations("Messages");
  const tCommon = await getTranslations("Common");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth`);

  if (peerId === user.id) {
    redirect(`/${locale}/messages`);
  }

  const [{ data: peerUser }, { data: peerTutorProfile }, { data: selfUser }, { data: selfTutorProfile }] =
    await Promise.all([
      supabase.from("users").select("id, full_name, role, email").eq("id", peerId).maybeSingle(),
      supabase.from("tutor_profiles").select("id, display_name").eq("id", peerId).maybeSingle(),
      supabase.from("users").select("id, full_name, email").eq("id", user.id).maybeSingle(),
      supabase.from("tutor_profiles").select("id, display_name").eq("id", user.id).maybeSingle(),
    ]);
  const selfName = resolveDisplayName({
    fullName: selfUser?.full_name,
    displayName: selfTutorProfile?.display_name,
    email: selfUser?.email,
    fallbackId: user.id,
    unknownLabel: t("unknownUser"),
  });
  const supportManagerId =
    process.env.SUPPORT_MANAGER_USER_ID?.trim() || process.env.NEXT_PUBLIC_SUPPORT_MANAGER_USER_ID?.trim() || "";
  const isSupportThread =
    query.support === "1" ||
    peerUser?.role === "admin" ||
    (!!supportManagerId && peerId === supportManagerId);

  const threadQueryStart = Date.now();
  const { data: thread, error: threadError } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, booking_id, content, created_at")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`,
    )
    .order("created_at", { ascending: true });
  console.info("[perf][messages-thread][thread-query-ms]", Date.now() - threadQueryStart, {
    locale,
    peerId,
    rowCount: thread?.length ?? 0,
    hasError: !!threadError,
  });

  let notificationFallbackName: string | null = null;
  if (!peerUser?.full_name?.trim() && !peerTutorProfile?.display_name?.trim() && !peerUser?.email?.trim()) {
    const incomingMessageIds = (thread ?? []).filter((m) => m.sender_id === peerId).map((m) => m.id);
    const threadBookingIds = (thread ?? []).map((m) => m.booking_id).filter((id): id is string => !!id);
    const { data: noticeRows } = await supabase
      .from("notifications")
      .select("type, content, related_id, created_at")
      .eq("user_id", user.id)
      .in("type", ["new_message", "booking_request"])
      .order("created_at", { ascending: false })
      .limit(200);

    for (const n of noticeRows ?? []) {
      const isThreadMessageNotice =
        n.type === "new_message" && !!n.related_id && incomingMessageIds.includes(n.related_id);
      const isThreadBookingNotice =
        n.type === "booking_request" && !!n.related_id && threadBookingIds.includes(n.related_id);
      if (!isThreadMessageNotice && !isThreadBookingNotice) continue;
      const parsed = parseNameFromNotificationContent(n.type, n.content ?? "");
      if (parsed) {
        notificationFallbackName = parsed;
        break;
      }
    }
  }

  const peerName = resolveDisplayName({
    preferredName: notificationFallbackName,
    fullName: peerUser?.full_name,
    displayName: peerTutorProfile?.display_name,
    email: peerUser?.email,
    fallbackId: peerId,
    unknownLabel: t("unknownUser"),
  });

  return (
    <main className="space-y-6">
      <PageSection
        title={isSupportThread ? t("supportThreadTitle") : t("threadTitle", { name: peerName })}
        description={isSupportThread ? t("supportThreadSubtitle") : t("threadSubtitle")}
        action={
          <ButtonLink href={`/${locale}/messages`} variant="outline" size="sm" pendingLabel={tCommon("loading")}>
            {t("backToInbox")}
          </ButtonLink>
        }
      >
        <Card>
          <CardContent className="space-y-4 pt-5">
            {isSupportThread ? (
              <Badge variant="warning" className="w-fit">
                {t("supportBadge")}
              </Badge>
            ) : null}
            {query.fromBooking === "1" ? (
              <p className="rounded-md border border-[#1A2456] bg-[#0A0F35] px-3 py-2 text-sm text-[#E2E8F0]">
                {t("fromBookingBanner")}
              </p>
            ) : null}
            <MessageThreadClient
              locale={locale}
              peerId={peerId}
              currentUserId={user.id}
              initialMessages={thread ?? []}
              markReadOnMount
              labels={{
                placeholder: t("composePlaceholder"),
                send: t("send"),
                selfName,
                peerName,
              }}
            />
          </CardContent>
        </Card>
      </PageSection>
    </main>
  );
}
