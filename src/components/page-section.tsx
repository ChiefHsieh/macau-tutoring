import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type PageSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  cardClassName?: string;
  contentClassName?: string;
};

export function PageSection({
  title,
  description,
  action,
  children,
  className,
  cardClassName,
  contentClassName,
}: PageSectionProps) {
  const hasHeader = title != null || description != null || action != null;

  return (
    <section className={cn("my-0", className)}>
      <Card className={cardClassName}>
        {hasHeader ? (
          <CardHeader className="flex flex-col gap-6 space-y-0 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              {title != null ? <CardTitle className="text-[1.3125rem] sm:text-[2.1rem]">{title}</CardTitle> : null}
              {description != null ? (
                <CardDescription className="max-w-[72ch] leading-relaxed">{description}</CardDescription>
              ) : null}
            </div>
            {action != null ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{action}</div>
            ) : null}
          </CardHeader>
        ) : null}
        <CardContent className={cn(hasHeader ? "pt-0" : "pt-5", contentClassName)}>{children}</CardContent>
      </Card>
    </section>
  );
}
