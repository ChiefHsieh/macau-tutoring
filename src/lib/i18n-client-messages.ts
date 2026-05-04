/**
 * Namespaces required by client components (`useTranslations`) under `[locale]/layout`.
 * Server-only pages still resolve full messages via `getRequestConfig`; this subset only
 * reduces what `NextIntlClientProvider` serializes to the browser.
 * When adding a client `useTranslations("X")`, include `X` here.
 */
export const NEXT_INTL_CLIENT_ROOT_KEYS = [
  "Common",
  "Directory",
  "TutorSetup",
] as const;

export type NextIntlClientRootKey = (typeof NEXT_INTL_CLIENT_ROOT_KEYS)[number];

export function pickClientMessages(messages: Record<string, unknown>): Partial<
  Record<NextIntlClientRootKey, unknown>
> {
  const out: Partial<Record<NextIntlClientRootKey, unknown>> = {};
  for (const key of NEXT_INTL_CLIENT_ROOT_KEYS) {
    if (key in messages && messages[key] !== undefined) {
      out[key] = messages[key];
    }
  }
  return out;
}
