"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  keepMounted: boolean;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const contexto = useContext(TabsContext);
  if (!contexto) {
    throw new Error("Los componentes de Tabs deben usarse dentro de <Tabs>");
  }
  return contexto;
}

export interface TabsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue"> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  keepMounted?: boolean;
  children: ReactNode;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  keepMounted = false,
  className,
  children,
  ...props
}: TabsProps) {
  const [interno, setInterno] = useState(defaultValue);
  const activo = value ?? interno;
  const baseId = `tabs-${useId().replace(/:/g, "")}`;

  const setValue = useCallback(
    (siguiente: string) => {
      if (value === undefined) setInterno(siguiente);
      onValueChange?.(siguiente);
    },
    [onValueChange, value]
  );

  const contexto = useMemo(
    () => ({ value: activo, setValue, baseId, keepMounted }),
    [activo, setValue, baseId, keepMounted]
  );

  return (
    <TabsContext.Provider value={contexto}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export const TabsList = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function TabsList({ className, onKeyDown, ...props }, ref) {
  const alTeclado = (evento: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(evento);
    if (evento.defaultPrevented) return;

    const tabs = Array.from(
      evento.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not([disabled])'
      )
    );
    const actual = tabs.findIndex((tab) => tab === document.activeElement);
    if (actual === -1) return;

    let siguiente = actual;
    if (evento.key === "ArrowRight") {
      siguiente = (actual + 1) % tabs.length;
    } else if (evento.key === "ArrowLeft") {
      siguiente = (actual - 1 + tabs.length) % tabs.length;
    } else if (evento.key === "Home") {
      siguiente = 0;
    } else if (evento.key === "End") {
      siguiente = tabs.length - 1;
    } else {
      return;
    }

    evento.preventDefault();
    tabs[siguiente]?.focus();
    tabs[siguiente]?.click();
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={alTeclado}
      className={cn(
        "inline-flex items-center gap-1 rounded-panel bg-surface-muted p-1",
        className
      )}
      {...props}
    />
  );
});

export interface TabsTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  TabsTriggerProps
>(function TabsTrigger(
  { className, value, onClick, children, ...props },
  ref
) {
  const { value: activo, setValue, baseId } = useTabsContext();
  const seleccionado = activo === value;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={seleccionado}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={seleccionado ? 0 : -1}
      onClick={(evento) => {
        onClick?.(evento);
        if (!evento.defaultPrevented) setValue(value);
      }}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-panel px-3 text-xs font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80",
        seleccionado
          ? "bg-surface text-fg shadow-soft ring-1 ring-input"
          : "text-fg-muted hover:text-fg",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent({ className, value, children, ...props }, ref) {
    const { value: activo, baseId, keepMounted } = useTabsContext();
    const seleccionado = activo === value;

    if (!seleccionado && !keepMounted) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`${baseId}-panel-${value}`}
        aria-labelledby={`${baseId}-tab-${value}`}
        className={cn(seleccionado && "animate-fade-in", className)}
        hidden={!seleccionado}
        {...props}
      >
        {children}
      </div>
    );
  }
);
