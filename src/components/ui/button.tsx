import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#E6C699] text-[#000225] border border-white/20 font-semibold shadow-lg shadow-black/40 hover:-translate-y-[2px] hover:bg-[#F0D6B0] hover:shadow-xl hover:shadow-black/50",
        outline:
          "border border-[#1A2456] bg-transparent text-white hover:-translate-y-[2px] hover:border-[#E6C699]/40 hover:bg-[#101742] hover:shadow-lg hover:shadow-black/40",
        ghost: "text-white hover:bg-[#101742]",
      },
      size: {
        default: "h-11 px-4 py-2 md:h-10",
        sm: "h-10 px-3 md:h-9",
        lg: "h-12 px-6 md:h-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
