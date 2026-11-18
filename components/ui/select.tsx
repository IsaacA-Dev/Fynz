"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { controlVariants, type ControlVariantProps } from "./control-variants";

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>,
    ControlVariantProps {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { className, variant = "boxed", invalid = false, children, ...props },
    ref
  ) {
    return (
      <div className="relative">
        <select
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            controlVariants({ variant, invalid }),
            "appearance-none pr-10",
            variant === "boxed" ? "h-10" : "",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
        />
      </div>
    );
  }
);
