"use client";

import { X } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Button } from "./button";
import { useDialogoNativo } from "./use-dialogo-nativo";

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ open, title, onClose, children }: SheetProps) {
  const titleId = `sheet-${useId().replace(/:/g, "")}-title`;
  const {
    ref,
    alCancelar,
    alPointerDown,
    alClic,
    alCerrarNativo,
  } = useDialogoNativo({
    open,
    onOpenChange: (abierto) => {
      if (!abierto) onClose();
    },
    conSalida: true,
    duracionSalida: 300,
  });

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={alCancelar}
      onPointerDown={alPointerDown}
      onClick={alClic}
      onClose={alCerrarNativo}
      className="group m-0 mt-auto max-h-none w-full max-w-none border-0 bg-transparent p-0 text-fg outline-none sm:ml-auto sm:mr-0 sm:mt-0 sm:h-dvh sm:max-w-md"
    >
      <div className="relative flex max-h-[85dvh] w-full animate-fade-in flex-col overflow-y-auto rounded-t-3xl border border-line bg-surface p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-lift group-data-[saliendo=true]:animate-fade-out sm:h-full sm:max-h-none sm:rounded-none sm:rounded-l-card sm:border-y-0 sm:border-r-0 sm:animate-slide-in-right sm:group-data-[saliendo=true]:animate-slide-out-right">
        <span
          aria-hidden
          className="mx-auto -mt-3 mb-4 block h-1 w-10 shrink-0 rounded-full bg-line sm:hidden"
        />
        <div className="flex items-center justify-between gap-4 pb-4">
          <h2
            id={titleId}
            className="text-lg font-semibold tracking-tight text-fg"
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar"
            className="size-9 shrink-0"
          >
            <X className="size-4" />
          </Button>
        </div>

        {children}
      </div>
    </dialog>
  );
}
