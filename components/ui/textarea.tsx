"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { controlVariants, type ControlVariantProps } from "./control-variants";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    ControlVariantProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { className, variant = "boxed", invalid = false, ...props },
    ref
  ) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlVariants({ variant, invalid }),
          "min-h-24 py-2",
          className
        )}
        {...props}
      />
    );
  }
);
