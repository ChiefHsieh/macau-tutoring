"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu } from "lucide-react";
import { signOutAction } from "@/app/[locale]/auth/actions";
import { markAllNotificationsReadAction } from "@/app/[locale]/notifications/actions";

/** Must sit above all in-page layers (cards, loaders ~9990). Portal breaks header stacking limits. */
const Z_OVERLAY = 2147483646;
const Z_PANEL = 2147483647;

export type MobileNavPortalLabels = {
  tutors: string;
  faq: string;
  /** Guest menu only */
  login?: string;
  notificationsAria?: string;
  supportCenter?: string;
  messages?: string;
  dashboard?: string;
  logout?: string;
};

type MobileNavPortalProps = {
  locale: string;
  variant: "guest" | "auth";
  labels: MobileNavPortalLabels;
};

export function MobileNavPortal({ locale, variant, labels }: MobileNavPortalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const portal =
    mounted && open
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 bg-black/45"
              style={{ zIndex: Z_OVERLAY }}
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <div
              className="mobile-nav-panel-portal fixed top-0 right-0 flex h-dvh max-h-dvh flex-col gap-3 overflow-y-auto border-l border-[#1A2456] bg-[#0a0f35] p-4 shadow-[-16px_0_36px_rgba(0,0,0,0.45)]"
              style={{ zIndex: Z_PANEL, width: "min(84vw, 340px)" }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mobile-nav-close"
                  aria-label="Close menu"
                >
                  ×
                </button>
              </div>

              {variant === "guest" ? (
                <>
                  <nav className="flex flex-col gap-3">
                    <Link
                      href={`/${locale}/tutors`}
                      className="mobile-nav-link"
                      onClick={() => setOpen(false)}
                    >
                      {labels.tutors}
                    </Link>
                    <Link
                      href={`/${locale}/faq`}
                      className="mobile-nav-link"
                      onClick={() => setOpen(false)}
                    >
                      {labels.faq}
                    </Link>
                  </nav>
                  <div className="mt-auto flex flex-col gap-3 border-t border-[#1A2456] pt-4">
                    <Link
                      href={`/${locale}/auth`}
                      className="rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-3 text-center text-base text-[#0F2C59]"
                      onClick={() => setOpen(false)}
                    >
                      {labels.login}
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <nav className="flex flex-col gap-3">
                    <Link
                      href={`/${locale}/tutors`}
                      className="mobile-nav-link"
                      onClick={() => setOpen(false)}
                    >
                      {labels.tutors}
                    </Link>
                    <Link
                      href={`/${locale}/faq`}
                      className="mobile-nav-link"
                      onClick={() => setOpen(false)}
                    >
                      {labels.faq}
                    </Link>
                    <form action={markAllNotificationsReadAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <button
                        type="submit"
                        className="mobile-nav-link w-full cursor-pointer text-left"
                      >
                        {labels.notificationsAria ?? ""}
                      </button>
                    </form>
                    <Link
                      href={`/${locale}/support`}
                      className="mobile-nav-link"
                      onClick={() => setOpen(false)}
                    >
                      {labels.supportCenter ?? ""}
                    </Link>
                    <Link
                      href={`/${locale}/messages`}
                      className="mobile-nav-link"
                      onClick={() => setOpen(false)}
                    >
                      {labels.messages ?? ""}
                    </Link>
                  </nav>
                  <div className="mt-auto flex flex-col gap-3 border-t border-[#1A2456] pt-4">
                    <Link
                      href={`/${locale}/dashboard`}
                      className="rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-3 text-center text-base text-[#0F2C59]"
                      onClick={() => setOpen(false)}
                    >
                      {labels.dashboard ?? ""}
                    </Link>
                    <form action={signOutAction}>
                      <input type="hidden" name="locale" value={locale} />
                      <button
                        type="submit"
                        className="w-full rounded-md border border-[#0F2C59] bg-[#DAC0A3] px-4 py-3 text-base text-[#0F2C59]"
                      >
                        {labels.logout ?? ""}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="mobile-nav-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      {portal}
    </div>
  );
}
