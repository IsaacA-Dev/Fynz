"use client";

import { cva } from "class-variance-authority";
import {
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";

const trackVariants = cva(
  "inline-flex shrink-0 items-center rounded-full border transition-colors duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80 disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      size: {
        sm: "h-5 w-9 p-0.5",
        md: "h-6 w-11 p-0.5",
      },
      checked: {
        true: "border-brand bg-brand",
        false: "border-input bg-surface-muted",
      },
    },
    defaultVariants: {
      size: "md",
      checked: false,
    },
  }
);

const thumbVariants = cva(
  "block rounded-full border bg-surface shadow-soft transition-transform duration-300 ease-out",
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-5",
      },
      checked: {
        true: "border-brand",
        false: "border-input",
      },
    },
    compoundVariants: [
      { size: "md", checked: true, className: "translate-x-5" },
      { size: "sm", checked: true, className: "translate-x-4" },
    ],
    defaultVariants: {
      size: "md",
      checked: false,
    },
  }
);

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "md";
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    {
      className,
      checked,
      defaultChecked = false,
      onCheckedChange,
      size = "md",
      onClick,
      ...props
    },
    ref
  ) {
    const [interno, setInterno] = useState(defaultChecked);
    const activo = checked ?? interno;

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={activo}
        data-state={activo ? "checked" : "unchecked"}
        onClick={(evento) => {
          onClick?.(evento);
          if (evento.defaultPrevented) return;
          const siguiente = !activo;
          if (checked === undefined) setInterno(siguiente);
          onCheckedChange?.(siguiente);
        }}
        className={cn(trackVariants({ size, checked: activo }), className)}
        {...props}
      >
        <span
          aria-hidden
          className={thumbVariants({ size, checked: activo })}
        />
      </button>
    );
  }
);
