import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { displayMacauRegion } from "@/lib/macau-location-display";
import { PageSection } from "@/components/page-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/button-link";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { verifyTutorDocumentAction } from "./actions";

type AdminDashboardProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
};

export default async function AdminDashboard({ params, searchParams }: AdminDashboardProps) {
  const { locale } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile(locale);
  if (profile.role !== "admin") redirect(`/${locale}/dashboard`);
  const t = await getTranslations("Dashboard");
  const tCommon = await getTranslations("Common");
  const supabase = await createClient();

  const [{ data: tutors }, { data: docs }] = await Promise.all([
    supabase
      .from("tutor_profiles")
      .select("id, display_name, district, hourly_rate, is_verified, created_at")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("tutor_verification_documents")
      .select("tutor_id, verification_document, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const docByTutorId = new Map<string, { verification_document: string | null; created_at: string }>();
  (docs ?? []).forEach((doc) => {
    if (!docByTutorId.has(doc.tutor_id)) {
      docByTutorId.set(doc.tutor_id, {
        verification_document: doc.verification_document,
        created_at: String(doc.created_at),
      });
    }
  });

  const queue = (tutors ?? []).map((tutor) => ({
    ...tutor,
    latestDoc: docByTutorId.get(tutor.id) ?? null,
  }));
  const pendingQueue = queue.filter((item) => item.latestDoc && !item.is_verified);
  const pendingCount = pendingQueue.length;

  return (
    <main className="space-y-6">
      <PageSection title={t("adminTitle")} description={`${t("welcome")}: ${profile.full_name}`}>
        {query.updated ? (
          <p className="ui-alert ui-alert-success mb-3">
            {t("adminReviewUpdated")}
          </p>
        ) : null}
        {query.error ? (
          <p className="ui-alert ui-alert-error mb-3">
            {decodeURIComponent(query.error)}
          </p>
        ) : null}
        <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
          <li>{t("adminTodo1")}</li>
          <li>{t("adminTodo2")}</li>
          <li>{t("adminTodo3")}</li>
        </ul>
      </PageSection>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("adminVerificationQueueTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <p className="text-sm text-zinc-700">
            {t("adminVerificationQueueSummary", {
              pending: String(pendingCount),
            })}
          </p>

          {pendingQueue.length === 0 ? (
            <p className="ui-empty-state">{t("adminNoTutors")}</p>
          ) : (
            <ul className="space-y-3">
              {pendingQueue.map((item) => (
                <li key={item.id} className="ui-list-row rounded-lg border border-zinc-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-[#1D2129]">{item.display_name}</p>
                      <p className="text-xs text-zinc-600">
                        {displayMacauRegion(locale, item.district)} · MOP{item.hourly_rate}/hr
                      </p>
                    </div>
                    <Badge variant={item.is_verified ? "success" : "warning"}>
                      {item.is_verified ? t("adminVerified") : t("adminNotVerified")}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-zinc-600">
                      {item.latestDoc?.verification_document
                        ? t("adminDocUploadedAt", { date: item.latestDoc.created_at.slice(0, 10) })
                        : t("adminNoDoc")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.latestDoc?.verification_document ? (
                        <ButtonLink
                          href={item.latestDoc.verification_document}
                          target="_blank"
                          variant="outline"
                          size="sm"
                          pendingLabel={tCommon("loading")}
                        >
                          {t("adminViewDoc")}
                        </ButtonLink>
                      ) : null}

                      <form action={verifyTutorDocumentAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="tutor_id" value={item.id} />
                        <input type="hidden" name="decision" value="valid" />
                        <SubmitButton type="submit" size="sm" pendingLabel={tCommon("loading")}>
                          {t("adminMarkValid")}
                        </SubmitButton>
                      </form>

                      <form action={verifyTutorDocumentAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="tutor_id" value={item.id} />
                        <input type="hidden" name="decision" value="invalid" />
                        <Input
                          name="reject_reason"
                          placeholder={t("adminRejectReasonPlaceholder")}
                          required
                          minLength={5}
                          className="h-8 w-[260px]"
                        />
                        <SubmitButton
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="text-red-700"
                          pendingLabel={tCommon("loading")}
                        >
                          {t("adminMarkInvalid")}
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
