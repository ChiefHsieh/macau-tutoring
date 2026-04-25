import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageSection } from "@/components/page-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageThreadClient } from "@/components/message-thread-client";
import { markThreadReadAction } from "../actions";

type MessageThreadPageProps = {
  params: Promise<{ locale: string; peerId: string }>;
  searchParams: Promise<{ fromBooking?: string }>;
};

export default async function MessageThreadPage({ params, searchParams }: MessageThreadPageProps) {
  const { locale, peerId } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile(locale);
  if (profile.role !== "student" && profile.role !== "tutor") {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("Messages");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth`);

  if (peerId === user.id) {
    redirect(`/${locale}/messages`);
  }

  const { data: peer } = await supabase.from("users").select("id, full_name").eq("id", peerId).maybeSingle();
  const peerName = peer?.full_name ?? t("unknownUser");

  const [{ data: outgoing }, { data: incoming }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .eq("sender_id", user.id)
      .eq("receiver_id", peerId)
      .order("created_at", { ascending: true }),
    supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .eq("sender_id", peerId)
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const thread = [...(outgoing ?? []), ...(incoming ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  await markThreadReadAction(peerId);

  return (
    <main className="space-y-6">
      <PageSection
        title={t("threadTitle", { name: peerName })}
        description={t("threadSubtitle")}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/${locale}/messages`}>{t("backToInbox")}</Link>
          </Button>
        }
      >
        <Card>
          <CardContent className="space-y-4 pt-5">
            {query.fromBooking === "1" ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 ring-1 ring-emerald-200">
                {t("fromBookingBanner")}
              </p>
            ) : null}
            <MessageThreadClient
              locale={locale}
              peerId={peerId}
              initialMessages={thread}
              labels={{
                placeholder: t("composePlaceholder"),
                send: t("send"),
              }}
            />
          </CardContent>
        </Card>
      </PageSection>
    </main>
  );
}
