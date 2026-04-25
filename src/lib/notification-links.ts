import type { AppRole } from "@/lib/auth";

/** In-app navigation target for a notification row (no external URLs). */
export function getNotificationHref(args: {
  locale: string;
  type: string;
  role: AppRole;
  relatedId?: string | null;
  /** For `new_message`: other party user id (derived from messages.related_id). */
  messagePeerId?: string | null;
}): string | null {
  const { locale, type, role, messagePeerId } = args;

  if (type === "booking_request" && role === "tutor") {
    return `/${locale}/tutor/availability`;
  }

  if (type === "booking_confirmed") {
    if (role === "tutor") return `/${locale}/tutor/availability`;
    if (role === "student") return null;
  }

  if (type === "booking_cancelled") {
    if (role === "tutor") return `/${locale}/tutor/availability`;
    if (role === "student") return `/${locale}/booking/new`;
  }

  if (type === "new_message" && messagePeerId) {
    return `/${locale}/messages/${messagePeerId}`;
  }

  if (type === "system") {
    return `/${locale}/notifications`;
  }

  return null;
}
