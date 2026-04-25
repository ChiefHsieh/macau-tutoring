"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

type LeadQueryToastsProps = {
  leadSuccess: string;
  leadNextSteps: string;
};

/**
 * Surfaces URL query feedback as toasts (lead submit / errors).
 */
export function LeadQueryToasts({ leadSuccess, leadNextSteps }: LeadQueryToastsProps) {
  const searchParams = useSearchParams();
  const fired = useRef({ lead: false, error: false });

  useEffect(() => {
    const lead = searchParams.get("lead");
    const err = searchParams.get("error");

    if (lead === "1" && !fired.current.lead) {
      fired.current.lead = true;
      toast.success(leadSuccess, { description: leadNextSteps, duration: 8000 });
    }

    if (err && !fired.current.error) {
      fired.current.error = true;
      toast.error(decodeURIComponent(err));
    }
  }, [searchParams, leadSuccess, leadNextSteps]);

  return null;
}
