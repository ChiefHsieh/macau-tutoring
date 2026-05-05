import { getTranslations } from "next-intl/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import {
  signInAction,
  signUpAction,
} from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

type AuthPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
    registered?: string;
  }>;
};

function formatAuthErrorMessage(raw: string | undefined, t: Awaited<ReturnType<typeof getTranslations>>) {
  if (!raw) return "";
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();
  if (decoded === "admin_self_signup") return t("adminSelfSignupBlocked");
  return decoded;
}

export default async function AuthPage({ params, searchParams }: AuthPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations("Auth");
  const tNav = await getTranslations("Nav");
  const tCommon = await getTranslations("Common");
  const supabaseReady = hasSupabaseEnv();

  return (
    <main className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <section className="rounded-xl border bg-[#000225] p-6 text-white shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/80">{tNav("brand")}</p>
        <h1 className="mt-4 text-3xl font-bold leading-tight">{t("brandTitle")}</h1>
        <p className="mt-3 text-sm text-white/90 md:text-base">{t("brandSubtitle")}</p>
        <ul className="mt-6 space-y-3 text-sm text-white/90">
          <li>• {t("brandPoint1")}</li>
          <li>• {t("brandPoint2")}</li>
          <li>• {t("brandPoint3")}</li>
        </ul>
      </section>

      <section className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>{t("signInTitle")}</CardTitle>
            <CardDescription>{t("signInDesc")}</CardDescription>
          </CardHeader>
          <CardContent>

          {query.error ? (
            <p className="ui-alert ui-alert-error mb-3">{formatAuthErrorMessage(query.error, t)}</p>
          ) : null}
          {query.registered === "1" ? (
            <p className="ui-alert ui-alert-success mb-3">{t("signUpCheckEmail")}</p>
          ) : null}
          {!supabaseReady ? (
            <p className="ui-alert ui-alert-warning mb-3">
              {t("envMissing")}
            </p>
          ) : null}

          <form action={signInAction} className="space-y-3">
            <input type="hidden" name="locale" value={locale} />
            <Input
              name="email"
              type="email"
              required
              placeholder={t("email")}
            />
            <Input
              name="password"
              type="password"
              required
              placeholder={t("password")}
            />
            <SubmitButton
              disabled={!supabaseReady}
              className="w-full disabled:cursor-not-allowed"
              pendingLabel={tCommon("signingIn")}
            >
              {t("signIn")}
            </SubmitButton>
          </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>{t("signUpTitle")}</CardTitle>
            <CardDescription>{t("signUpDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
          <form action={signUpAction} className="space-y-3">
            <input type="hidden" name="locale" value={locale} />
            <fieldset className="space-y-2 rounded-lg border border-[#1A2456] bg-[#0A0F35] p-3">
              <legend className="text-sm font-medium text-[#E2E8F0]">{t("accountTypeLabel")}</legend>
              <div className="grid gap-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#2D4263] bg-[#101742] p-3 transition-colors hover:border-[#E6C699]/40 has-[:checked]:border-[#E6C699]/50 has-[:checked]:bg-[#0D143D]">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    defaultChecked
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#E6C699]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{t("roleStudent")}</span>
                    <span className="mt-0.5 block text-xs text-[#94A3B8]">{t("roleStudentHint")}</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#2D4263] bg-[#101742] p-3 transition-colors hover:border-[#E6C699]/40 has-[:checked]:border-[#E6C699]/50 has-[:checked]:bg-[#0D143D]">
                  <input type="radio" name="role" value="tutor" className="mt-0.5 h-4 w-4 shrink-0 accent-[#E6C699]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{t("roleTutor")}</span>
                    <span className="mt-0.5 block text-xs text-[#94A3B8]">{t("roleTutorHint")}</span>
                  </span>
                </label>
              </div>
              <p className="text-xs text-[#94A3B8]">{t("accountTypeHint")}</p>
            </fieldset>
            <Input
              name="email"
              type="email"
              required
              placeholder={t("email")}
            />
            <Input
              name="full_name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              placeholder={t("signUpFullName")}
            />
            <Input
              name="phone"
              type="tel"
              required
              minLength={6}
              maxLength={30}
              placeholder={t("signUpPhone")}
            />
            <Input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder={t("passwordRule")}
            />
            <SubmitButton
              disabled={!supabaseReady}
              className="w-full disabled:cursor-not-allowed"
              pendingLabel={tCommon("signingUp")}
            >
              {t("signUp")}
            </SubmitButton>
          </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
