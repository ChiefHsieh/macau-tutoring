"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SubmitButtonProps = Omit<ButtonProps, "type"> & {
  type?: "submit" | "button";
  /** Shown while the parent `<form>` is submitting (server or client action). Defaults to `Common.loading`. */
  pendingLabel?: ReactNode;
};

export function SubmitButton({
  className,
  disabled,
  children,
  pendingLabel,
  type = "submit",
  ...props
}: SubmitButtonProps) {
  const t = useTranslations("Common");
  const { pending } = useFormStatus();
  const busy = pending;
  const fallback = t("loading");
  const shown = busy ? (pendingLabel !== undefined ? pendingLabel : fallback) : children;

  return (
    <Button
      type={type}
      className={cn(className)}
      disabled={disabled || busy}
      aria-busy={busy}
      {...props}
    >
      {shown}
    </Button>
  );
}
