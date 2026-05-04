import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { completeOnboardingAction } from "./actions";
import { SubmitButton } from "@/components/submit-button";

type OnboardingPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function OnboardingPage({
  params,
  searchParams,
}: OnboardingPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations("Onboarding");
  const tCommon = await getTranslations("Common");

  if (!hasSupabaseEnv()) {
    return (
      <main className="mx-auto w-full max-w-xl rounded-xl border bg-white p-6">
        <h1 className="mb-2 text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-zinc-700">{t("envMissing")}</p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth`);

  return (
    <main className="mx-auto w-full max-w-xl rounded-xl border bg-white p-6">
      <h1 className="mb-2 text-2xl font-bold">{t("title")}</h1>
      <p className="mb-4 text-sm text-zinc-600">{t("subtitle")}</p>

      {query.error ? (
        <p className="ui-alert ui-alert-error mb-3">
          {query.error === "admin_forbidden"
            ? t("adminRoleNotAllowed")
            : query.error === "invalid_role"
              ? t("invalidRole")
              : decodeURIComponent(query.error)}
        </p>
      ) : null}

      <form action={completeOnboardingAction} className="space-y-3">
        <input type="hidden" name="locale" value={locale} />
        <input
          name="full_name"
          required
          placeholder={t("fullName")}
          className="w-full rounded-md border border-zinc-300 bg-white p-2 text-black placeholder:text-zinc-400"
        />
        <input
          name="phone"
          required
          placeholder={t("phone")}
          className="w-full rounded-md border border-zinc-300 bg-white p-2 text-black placeholder:text-zinc-400"
        />
        <select
          name="role"
          className="w-full rounded-md border border-zinc-300 bg-white p-2 text-black"
          defaultValue="student"
          required
        >
          <option value="student">{t("student")}</option>
          <option value="tutor">{t("tutor")}</option>
        </select>
        <div className="rounded-md bg-zinc-100 px-3 py-2 text-sm" style={{ color: "#000000" }}>
          {t("email")}:{" "}
          <span className="font-medium" style={{ color: "#000000" }}>
            {user.email}
          </span>
        </div>
        <SubmitButton
          className="w-full rounded-md !bg-black !text-white hover:!bg-zinc-900"
          pendingLabel={tCommon("loading")}
        >
          {t("submit")}
        </SubmitButton>
      </form>
    </main>
  );
}
