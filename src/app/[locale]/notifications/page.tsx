import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getNotificationHref } from "@/lib/notification-links";
import { PageSection } from "@/components/page-section";
import { Card, CardContent } from "@/components/ui/card";
import { openNotificationAction } from "./actions";
import { SubmitButton } from "@/components/submit-button";

type NotificationsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { locale } = await params;
  await requireProfile(locale);
  const t = await getTranslations("Notifications");
  const tCommon = await getTranslations("Common");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth`);

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "student") as "tutor" | "student" | "admin";

  const { data: rows, error: listError } = await supabase
    .from("notifications")
    .select("id, type, title, content, related_id, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (listError) {
    return (
      <main className="space-y-6">
        <PageSection title={t("title")} description={t("subtitle")}>
          <Card>
            <CardContent className="pt-5 text-sm text-red-700">
              {listError.message}
              <p className="mt-2 text-zinc-600">{t("schemaHint")}</p>
            </CardContent>
          </Card>
        </PageSection>
      </main>
    );
  }

  const messageIds = (rows ?? [])
    .filter((r) => r.type === "new_message" && r.related_id)
    .map((r) => r.related_id as string);

  const peerByMessageId = new Map<string, string>();
  const configuredManagerId =
    process.env.SUPPORT_MANAGER_USER_ID?.trim() || process.env.NEXT_PUBLIC_SUPPORT_MANAGER_USER_ID?.trim() || "";
  const supportPeerIds = new Set<string>();
  if (messageIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id")
      .in("id", messageIds);
    for (const m of msgs ?? []) {
      const peer = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      peerByMessageId.set(m.id, peer);
    }

    const peerIds = Array.from(new Set((msgs ?? []).map((m) => (m.sender_id === user.id ? m.receiver_id : m.sender_id))));
    if (configuredManagerId) {
      supportPeerIds.add(configuredManagerId);
    }
    if (peerIds.length > 0) {
      const { data: peerUsers } = await supabase.from("users").select("id, role").in("id", peerIds);
      for (const peer of peerUsers ?? []) {
        if (peer.role === "admin") {
          supportPeerIds.add(peer.id);
        }
      }
    }
  }

  return (
    <main className="space-y-6">
      <PageSection title={t("title")} description={t("subtitle")}>
        <div className="grid gap-3">
        {(rows ?? []).length === 0 ? (
          <Card>
            <CardContent className="pt-5 text-sm text-[#94A3B8]">{t("empty")}</CardContent>
          </Card>
        ) : (
          (rows ?? []).map((n) => {
            const messagePeerId = n.related_id ? peerByMessageId.get(n.related_id) : null;
            const link = getNotificationHref({
              locale,
              type: n.type,
              role,
              relatedId: n.related_id,
              messagePeerId,
            });
            const isSupportMessage = n.type === "new_message" && !!messagePeerId && supportPeerIds.has(messagePeerId);
            const finalLink = isSupportMessage ? `/${locale}/support` : link;

            return (
              <form key={n.id} action={openNotificationAction}>
                <input type="hidden" name="id" value={n.id} />
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="href" value={finalLink ?? ""} />
                <SubmitButton
                  type="submit"
                  variant="ghost"
                  className="h-auto w-full text-left font-normal !text-inherit"
                  pendingLabel={tCommon("loading")}
                >
                  <Card className={n.is_read ? "border-[#1A2456] bg-[#0A0F35]" : "border-[#E6C699]/30 bg-[#101742]"}>
                    <CardContent className="space-y-3 pt-5">
                      <div className={n.is_read ? "text-sm text-[#E2E8F0]" : "text-sm font-semibold text-white"}>
                        <p className="text-xs uppercase tracking-wide text-[#94A3B8]">{n.type}</p>
                        <p className="mt-1">{n.title}</p>
                        <p className="mt-1 font-normal text-[#E2E8F0]">{n.content}</p>
                        <p className="mt-2 text-xs text-[#94A3B8]">
                          {new Date(n.created_at).toLocaleString(locale === "en" ? "en-GB" : "zh-HK")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </SubmitButton>
              </form>
            );
          })
        )}
        </div>
      </PageSection>
    </main>
  );
}
