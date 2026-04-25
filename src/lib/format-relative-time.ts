/** Short relative label for feed cards (SSR-safe). */
export function formatRelativeTimeShort(iso: string, locale: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const now = Date.now();
  const diffMs = t - now;
  const sec = Math.round(diffMs / 1000);
  const intlLocale = locale === "en" ? "en" : "zh-Hant-MO";
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: "auto" });
  const ad = Math.abs(sec);
  if (ad < 60) return rtf.format(Math.round(diffMs / 1000), "second");
  if (ad < 3600) return rtf.format(Math.round(diffMs / 60), "minute");
  if (ad < 86400) return rtf.format(Math.round(diffMs / 3600), "hour");
  if (ad < 86400 * 14) return rtf.format(Math.round(diffMs / 86400), "day");
  return rtf.format(Math.round(diffMs / (86400 * 7)), "week");
}
