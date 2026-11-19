"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { useState, type HTMLAttributes, type MouseEvent } from "react";
import { cn } from "@/lib/utils/cn";

const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors duration-300",
  {
    variants: {
      variant: {
        neutral: "border-line bg-surface-muted text-fg-muted",
        brand: "border-brand/20 bg-brand-soft text-brand",
        info: "border-info/20 bg-info-soft text-info",
        success: "border-success/20 bg-success-soft text-success",
        warning: "border-warning/20 bg-warning-soft text-warning",
        danger: "border-danger/20 bg-danger-soft text-danger",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
      },
      interactive: {
        true: "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80",
        false: "",
      },
    },
    compoundVariants: [
      {
        interactive: true,
        variant: "neutral",
        className: "hover:border-line-strong hover:text-fg",
      },
      {
        interactive: true,
        variant: "brand",
        className: "hover:border-brand/40",
      },
      {
        interactive: true,
        variant: "info",
        className: "hover:border-info/40",
      },
      {
        interactive: true,
        variant: "success",
        className: "hover:border-success/40",
      },
      {
        interactive: true,
        variant: "warning",
        className: "hover:border-warning/40",
      },
      {
        interactive: true,
        variant: "danger",
        className: "hover:border-danger/40",
      },
    ],
    defaultVariants: {
      variant: "neutral",
      size: "md",
      interactive: false,
    },
  }
);

export interface ChipProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  removeLabel?: string;
}

export function Chip({
  className,
  variant,
  size,
  interactive,
  dot = false,
  removable = false,
  onRemove,
  removeLabel,
  children,
  ...props
}: ChipProps) {
  const [saliendo, setSaliendo] = useState(false);

  const quitar = (evento: MouseEvent<HTMLButtonElement>) => {
    evento.stopPropagation();
    if (!onRemove || saliendo) return;
    setSaliendo(true);
    const reducido =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(onRemove, reducido ? 0 : 180);
  };

  const etiqueta =
    removeLabel ??
    (typeof children === "string" ? `Quitar ${children}` : "Quitar");

  return (
    <span
      className={cn(
        chipVariants({ variant, size, interactive }),
        saliendo && "pointer-events-none animate-scale-out",
        className
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className="size-1.5 shrink-0 animate-pulse-soft rounded-full bg-current"
        />
      )}
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={quitar}
          aria-label={etiqueta}
          className="-mr-1 rounded-full p-0.5 text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}
