"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./button";

const alertVariants = cva(
  "flex items-start gap-3 rounded-panel border p-3.5 text-sm",
  {
    variants: {
      variant: {
        info: "border-info/25 bg-info-soft text-info",
        success: "border-success/25 bg-success-soft text-success",
        warning: "border-warning/25 bg-warning-soft text-warning",
        danger: "border-danger/25 bg-danger-soft text-danger",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const ICONOS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
} as const;

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
}

export function Alert({
  className,
  variant = "info",
  title,
  dismissible = false,
  onDismiss,
  icon,
  children,
  ...props
}: AlertProps) {
  const [saliendo, setSaliendo] = useState(false);
  const Icono = ICONOS[variant ?? "info"];

  const cerrar = () => {
    if (!onDismiss || saliendo) return;
    setSaliendo(true);
    const reducido =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(onDismiss, reducido ? 0 : 220);
  };

  return (
    <div
      role={variant === "warning" || variant === "danger" ? "alert" : "status"}
      className={cn(
        alertVariants({ variant }),
        saliendo && "pointer-events-none animate-fade-out",
        className
      )}
      {...props}
    >
      <span aria-hidden className="mt-0.5 shrink-0">
        {icon ?? <Icono className="size-4" />}
      </span>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {children && (
          <div className="text-sm leading-relaxed text-fg-muted">
            {children}
          </div>
        )}
      </div>

      {dismissible && onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={cerrar}
          aria-label="Cerrar aviso"
          className="-mr-1 -mt-1 size-8 shrink-0 text-current hover:bg-fg/10 hover:text-current"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
