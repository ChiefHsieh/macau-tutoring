import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#1A2456] bg-[#0A0F35] px-3 py-2 text-sm text-[#F8F9FA] placeholder:text-[#94A3B8] transition-all duration-300 focus:border-[#E6C699] focus:ring-3 focus:ring-[#E6C699]/20",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
