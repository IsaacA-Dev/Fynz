"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useToast, type ToastType } from "./toast-provider";

const ICONOS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const COLORES = {
  success: "text-success",
  error: "text-danger",
  info: "text-info",
} as const;

function ToastItem({
  id,
  message,
  type,
  saliendo,
}: {
  id: number;
  message: string;
  type: ToastType;
  saliendo?: boolean;
}) {
  const { removeToast, descartarToast } = useToast();
  const Icono = ICONOS[type];
  const color = COLORES[type];

  useEffect(() => {
    if (!saliendo) return;
    const reducido =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const temporizador = window.setTimeout(
      () => descartarToast(id),
      reducido ? 0 : 220
    );
    return () => window.clearTimeout(temporizador);
  }, [saliendo, descartarToast, id]);

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-center gap-3 rounded-panel border border-line bg-surface px-4 py-3 shadow-soft ${
        saliendo
          ? "pointer-events-none animate-fade-out"
          : "animate-fade-up"
      }`}
    >
      <Icono aria-hidden className={`size-4 shrink-0 ${color}`} />
      <p className="flex-1 text-sm text-fg">{message}</p>
      <button
        type="button"
        onClick={() => removeToast(id)}
        className="rounded-full p-1 text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80"
        aria-label="Cerrar notificación"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const { toasts } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-xs flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
