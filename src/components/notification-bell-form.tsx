"use client";

import { Bell, Loader2 } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/[locale]/notifications/actions";
import { SubmitButton } from "@/components/submit-button";

type NotificationBellFormProps = {
  locale: string;
  unread: number;
  ariaLabel: string;
};

export function NotificationBellForm({ locale, unread, ariaLabel }: NotificationBellFormProps) {
  return (
    <form action={markAllNotificationsReadAction}>
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton
        type="submit"
        pendingLabel={<Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />}
        className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
        aria-label={ariaLabel}
      >
        <Bell className="h-5 w-5 shrink-0" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </SubmitButton>
    </form>
  );
}
