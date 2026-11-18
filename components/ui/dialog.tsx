"use client";

import { X } from "lucide-react";
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useImperativeHandle,
  type DialogHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";
import { Button, type ButtonProps } from "./button";
import { useDialogoNativo } from "./use-dialogo-nativo";

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const contexto = useContext(DialogContext);
  if (!contexto) {
    throw new Error("Los componentes de Dialog deben usarse dentro de <Dialog>");
  }
  return contexto;
}

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const id = useId().replace(/:/g, "");

  return (
    <DialogContext.Provider
      value={{
        open,
        onOpenChange,
        titleId: `${id}-title`,
        descriptionId: `${id}-description`,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogContentProps
  extends Omit<DialogHTMLAttributes<HTMLDialogElement>, "title"> {
  showCloseButton?: boolean;
}

export const DialogContent = forwardRef<
  HTMLDialogElement,
  DialogContentProps
>(function DialogContent(
  { className, showCloseButton = true, children, ...props },
  ref
) {
  const { open, onOpenChange, titleId, descriptionId } = useDialogContext();
  const {
    ref: dialogoRef,
    alCancelar,
    alPointerDown,
    alClic,
    alCerrarNativo,
  } = useDialogoNativo({ open, onOpenChange });

  useImperativeHandle(ref, () => dialogoRef.current as HTMLDialogElement, [
    dialogoRef,
  ]);

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={alCancelar}
      onPointerDown={alPointerDown}
      onClick={alClic}
      onClose={alCerrarNativo}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg border-0 bg-transparent p-0 text-fg outline-none",
        className
      )}
      {...props}
    >
      <div className="relative max-h-[min(85dvh,48rem)] w-full animate-scale-in overflow-y-auto rounded-card border border-line bg-surface p-6 shadow-lift">
        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
            className="absolute right-3 top-3 size-9"
          >
            <X className="size-4" />
          </Button>
        )}
        {children}
      </div>
    </dialog>
  );
});

export const DialogHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function DialogHeader({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1.5 pr-8", className)}
      {...props}
    />
  );
});

export const DialogTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(function DialogTitle({ className, ...props }, ref) {
  const { titleId } = useDialogContext();
  return (
    <h2
      ref={ref}
      id={titleId}
      className={cn(
        "text-lg font-semibold tracking-tight text-fg",
        className
      )}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function DialogDescription({ className, ...props }, ref) {
  const { descriptionId } = useDialogContext();
  return (
    <p
      ref={ref}
      id={descriptionId}
      className={cn("text-sm leading-relaxed text-fg-muted", className)}
      {...props}
    />
  );
});

export const DialogFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function DialogFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
});

export type DialogCloseProps = Omit<ButtonProps, "asChild">;

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  function DialogClose(
    { variant = "secondary", size = "md", onClick, ...props },
    ref
  ) {
    const { onOpenChange } = useDialogContext();
    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        onClick={(evento) => {
          onClick?.(evento);
          if (!evento.defaultPrevented) onOpenChange(false);
        }}
        {...props}
      />
    );
  }
);
