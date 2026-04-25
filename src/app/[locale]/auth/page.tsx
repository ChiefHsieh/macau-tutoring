import { getTranslations } from "next-intl/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import {
  signInAction,
  signUpAction,
} from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AuthPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AuthPage({ params, searchParams }: AuthPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations("Auth");
  const tNav = await getTranslations("Nav");
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
            <p className="ui-alert ui-alert-error mb-3">
              {decodeURIComponent(query.error)}
            </p>
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
            <Button
              disabled={!supabaseReady}
              className="w-full disabled:cursor-not-allowed"
            >
              {t("signIn")}
            </Button>
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
              minLength={8}
              placeholder={t("passwordRule")}
            />
            <Button
              disabled={!supabaseReady}
              className="w-full disabled:cursor-not-allowed"
            >
              {t("signUp")}
            </Button>
          </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
