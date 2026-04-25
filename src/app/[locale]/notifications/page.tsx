import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getNotificationHref } from "@/lib/notification-links";
import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteNotificationAction, markNotificationReadAction } from "./actions";

type NotificationsPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NotificationsPage({ params }: NotificationsPageProps) {
  const { locale } = await params;
  await requireProfile(locale);
  const t = await getTranslations("Notifications");
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
  if (messageIds.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id")
      .in("id", messageIds);
    for (const m of msgs ?? []) {
      const peer = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      peerByMessageId.set(m.id, peer);
    }
  }

  return (
    <main className="space-y-6">
      <PageSection title={t("title")} description={t("subtitle")}>
        <div className="grid gap-3">
        {(rows ?? []).length === 0 ? (
          <Card>
            <CardContent className="pt-5 text-sm text-zinc-600">{t("empty")}</CardContent>
          </Card>
        ) : (
          (rows ?? []).map((n) => {
            const link = getNotificationHref({
              locale,
              type: n.type,
              role,
              relatedId: n.related_id,
              messagePeerId: n.related_id ? peerByMessageId.get(n.related_id) : null,
            });

            return (
              <Card
                key={n.id}
                className={n.is_read ? "border-zinc-200" : "border-[#000225]/40 bg-[#F5F8FF]"}
              >
                <CardContent className="space-y-3 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className={n.is_read ? "text-sm text-zinc-800" : "text-sm font-semibold text-[#1D2129]"}>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">{n.type}</p>
                      <p className="mt-1">{n.title}</p>
                      <p className="mt-1 font-normal text-zinc-700">{n.content}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {new Date(n.created_at).toLocaleString(locale === "en" ? "en-GB" : "zh-HK")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {link ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={link}>{t("openLink")}</Link>
                        </Button>
                      ) : null}
                      {!n.is_read ? (
                        <form action={markNotificationReadAction}>
                          <input type="hidden" name="id" value={n.id} />
                          <input type="hidden" name="locale" value={locale} />
                          <Button type="submit" variant="outline" size="sm">
                            {t("markRead")}
                          </Button>
                        </form>
                      ) : null}
                      <form action={deleteNotificationAction}>
                        <input type="hidden" name="id" value={n.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit" variant="ghost" size="sm" className="text-red-700">
                          {t("delete")}
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
        </div>
      </PageSection>
    </main>
  );
}
