"use client";

import { cva } from "class-variance-authority";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "./theme-context";

const contenedor = cva("", {
  variants: {
    variant: {
      compact:
        "inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-soft",
      panel: "grid gap-2",
    },
  },
  defaultVariants: { variant: "compact" },
});

const opcion = cva(
  "inline-flex items-center justify-center transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        compact:
          "h-9 gap-1.5 rounded-full px-3 text-xs font-medium md:px-3.5",
        panel:
          "w-full justify-start gap-3 rounded-panel border border-input bg-surface p-3 text-left",
      },
      activo: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "compact",
        activo: true,
        className: "bg-brand text-on-brand shadow-soft",
      },
      {
        variant: "compact",
        activo: false,
        className: "text-fg-muted hover:bg-surface-muted hover:text-fg",
      },
      {
        variant: "panel",
        activo: true,
        className: "ring-2 ring-brand/80 ring-offset-2 ring-offset-surface",
      },
      {
        variant: "panel",
        activo: false,
        className: "hover:border-line-strong hover:bg-surface-muted",
      },
    ],
    defaultVariants: { variant: "compact", activo: false },
  }
);

type ThemeSwitcherProps = {
  variant?: "compact" | "panel";
  className?: string;
};

export function ThemeSwitcher({
  variant = "compact",
  className,
}: ThemeSwitcherProps) {
  const { tema, setTema, temas } = useTheme();

  return (
    <div
      role="group"
      aria-label="Tema de la aplicación"
      className={cn(contenedor({ variant }), className)}
    >
      {temas.map((opcionTema) => {
        const activo = tema === opcionTema.id;
        const Icono = opcionTema.colorScheme === "dark" ? Moon : Sun;

        return (
          <button
            key={opcionTema.id}
            type="button"
            onClick={() => setTema(opcionTema.id)}
            aria-pressed={activo}
            aria-label={`Usar tema ${opcionTema.nombre}`}
            title={`Tema ${opcionTema.nombre}`}
            className={cn(opcion({ variant, activo }))}
          >
            <span
              aria-hidden
              data-theme={opcionTema.id}
              className="flex size-5 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-brand"
            >
              <Icono className="size-3" />
            </span>
            <span
              className={cn(
                "truncate",
                variant === "compact" ? "hidden md:inline" : ""
              )}
            >
              {opcionTema.nombre}
            </span>
            {variant === "panel" && (
              <span className="ml-auto hidden text-xs text-fg-muted sm:block">
                {opcionTema.descripcion}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
