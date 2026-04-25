"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

type TutorSubmittedToastProps = {
  message: string;
};

export function TutorSubmittedToast({ message }: TutorSubmittedToastProps) {
  const searchParams = useSearchParams();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (searchParams.get("saved") === "1") {
      done.current = true;
      toast.success(message);
    }
  }, [searchParams, message]);

  return null;
}
