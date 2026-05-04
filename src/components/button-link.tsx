"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { useTranslations } from "next-intl";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonLinkProps = Omit<ButtonProps, "asChild"> & {
  href: string;
  children: ReactNode;
  /** Optional; shown while this `Link` navigation is in progress. */
  pendingLabel?: ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
};

function LinkPendingBody({
  children,
  pendingLabel,
}: {
  children: ReactNode;
  pendingLabel?: ReactNode;
}) {
  const { pending } = useLinkStatus();
  const t = useTranslations("Common");
  if (pending) {
    return <span className="inline-flex items-center justify-center gap-2">{pendingLabel ?? t("loading")}</span>;
  }
  return <>{children}</>;
}

export function ButtonLink({
  href,
  children,
  className,
  pendingLabel,
  onClick,
  target,
  rel,
  ...buttonProps
}: ButtonLinkProps) {
  const relResolved = rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);
  return (
    <Button asChild className={cn(className)} {...buttonProps}>
      <Link href={href} onClick={onClick} target={target} rel={relResolved}>
        <LinkPendingBody pendingLabel={pendingLabel}>{children}</LinkPendingBody>
      </Link>
    </Button>
  );
}
