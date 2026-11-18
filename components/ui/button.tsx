"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import {
  forwardRef,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        solid: "bg-brand text-on-brand shadow-soft hover:bg-brand-hover",
        secondary:
          "border border-input bg-surface-muted text-fg hover:bg-brand-softer",
        outline:
          "border border-input bg-transparent text-fg hover:bg-surface-muted",
        ghost: "text-fg-muted hover:bg-surface-muted hover:text-fg",
        danger:
          "bg-danger text-on-danger shadow-danger hover:bg-danger-hover focus-visible:ring-danger/80",
      },
      size: {
        sm: "h-8 rounded-panel px-3 text-xs",
        md: "h-10 rounded-panel px-4 text-sm",
        lg: "h-11 rounded-card px-5 text-sm",
        icon: "size-10 rounded-panel p-0",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) {
    const clases = cn(buttonVariants({ variant, size }), className);

    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={clases}
          aria-busy={loading || undefined}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={clases}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
