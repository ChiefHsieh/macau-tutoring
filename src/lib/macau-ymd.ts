/**
 * Calendar-day helpers using Asia/Macau (UTC+8, no DST).
 */

export function addDaysMacauYmd(ymd: string, deltaDays: number): string {
  const ms = new Date(`${ymd}T12:00:00+08:00`).getTime() + deltaDays * 86400000;
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Macau" });
}

/** Weekday index 0=Sunday … 6=Saturday, aligned to Macau calendar date. */
export function getMacauWeekdayIndex(ymd: string): number {
  return new Date(`${ymd}T12:00:00+08:00`).getDay();
}

export function macauTodayYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Macau" });
}

export function formatMacauWeekdayDay(ymd: string, locale: string): string {
  const d = new Date(`${ymd}T12:00:00+08:00`);
  const isEn = locale === "en" || locale.startsWith("en-");
  if (isEn) {
    return new Intl.DateTimeFormat("en-HK", {
      timeZone: "Asia/Macau",
      weekday: "short",
      day: "numeric",
    }).format(d);
  }
  return new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Macau",
    weekday: "narrow",
    day: "numeric",
  }).format(d);
}

/** Second line under weekday in booking calendar — locale-aligned, not raw ISO. */
export function formatMacauCalendarDateLine(ymd: string, locale: string): string {
  const d = new Date(`${ymd}T12:00:00+08:00`);
  const isEn = locale === "en" || locale.startsWith("en-");
  if (isEn) {
    return new Intl.DateTimeFormat("en-HK", {
      timeZone: "Asia/Macau",
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  }
  return new Intl.DateTimeFormat("zh-HK", {
    timeZone: "Asia/Macau",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}
