"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { controlVariants, type ControlVariantProps } from "./control-variants";

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    ControlVariantProps {
  leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { className, variant = "boxed", invalid = false, leadingIcon, ...props },
    ref
  ) {
    const esUnderline = variant === "underline";
    const clases = cn(
      controlVariants({ variant, invalid }),
      variant === "boxed" ? "h-10" : "",
      leadingIcon ? (variant === "boxed" ? "pl-10" : "pl-8") : "",
      esUnderline ? "peer" : "",
      className
    );

    const input = (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={clases}
        {...props}
      />
    );

    if (esUnderline) {
      return (
        <div className="relative">
          {leadingIcon && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 top-1/2 flex -translate-y-1/2 items-center text-fg-subtle"
            >
              {leadingIcon}
            </span>
          )}
          {input}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-500 ease-out peer-focus:scale-x-100",
              invalid ? "bg-danger" : "bg-brand"
            )}
          />
        </div>
      );
    }

    if (!leadingIcon) return input;

    return (
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-fg-subtle"
        >
          {leadingIcon}
        </span>
        {input}
      </div>
    );
  }
);
