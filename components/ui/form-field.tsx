"use client";

import {
  cloneElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

export interface FormFieldProps {
  /** Opcional: si se omite, FormField genera un id único. */
  htmlFor?: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactElement<Record<string, unknown>>;
}

export function FormField({
  htmlFor,
  label,
  error,
  hint,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const generado = useId().replace(/:/g, "");
  const id = htmlFor ?? generado;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const descritoPor = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const control = cloneElement(children, {
    id,
    invalid: error ? true : children.props.invalid,
    "aria-invalid": error ? true : children.props["aria-invalid"],
    "aria-describedby": descritoPor || undefined,
  });

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="flex items-baseline gap-1 text-sm font-medium text-fg-muted"
      >
        <span>{label}</span>
        {required && (
          <span aria-hidden className="text-fg-subtle">
            *
          </span>
        )}
      </label>

      {control}

      {hint && !error && (
        <p id={hintId} className="text-xs leading-relaxed text-fg-muted">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="animate-fade-up text-xs font-medium leading-relaxed text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
