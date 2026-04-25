import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { completeOnboardingAction } from "./actions";

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
          {decodeURIComponent(query.error)}
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
        >
          <option value="student">{t("student")}</option>
          <option value="tutor">{t("tutor")}</option>
          <option value="admin">{t("admin")}</option>
        </select>
        <div className="rounded-md bg-zinc-100 px-3 py-2 text-sm" style={{ color: "#000000" }}>
          {t("email")}:{" "}
          <span className="font-medium" style={{ color: "#000000" }}>
            {user.email}
          </span>
        </div>
        <button className="w-full rounded-md bg-black px-4 py-2 text-white">
          {t("submit")}
        </button>
      </form>
    </main>
  );
}
