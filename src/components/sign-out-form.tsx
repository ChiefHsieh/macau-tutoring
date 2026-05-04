"use client";

import { signOutAction } from "@/app/[locale]/auth/actions";
import { SubmitButton } from "@/components/submit-button";

type SignOutFormProps = {
  locale: string;
  logoutLabel: string;
  pendingLabel: string;
  className?: string;
};

export function SignOutForm({ locale, logoutLabel, pendingLabel, className }: SignOutFormProps) {
  return (
    <form action={signOutAction}>
      <input type="hidden" name="locale" value={locale} />
      <SubmitButton
        type="submit"
        pendingLabel={pendingLabel}
        className={className ?? "rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-2 text-base text-[#0F2C59]"}
      >
        {logoutLabel}
      </SubmitButton>
    </form>
  );
}
