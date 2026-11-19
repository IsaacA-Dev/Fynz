"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MouseEvent,
  type SyntheticEvent,
} from "react";

let bloqueos = 0;
let overflowPrevio = "";

function bloquearScroll() {
  if (typeof document === "undefined") return;
  if (bloqueos === 0) {
    overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  bloqueos += 1;
}

function liberarScroll() {
  if (typeof document === "undefined") return;
  bloqueos = Math.max(0, bloqueos - 1);
  if (bloqueos === 0) {
    document.body.style.overflow = overflowPrevio;
    overflowPrevio = "";
  }
}

interface UseDialogoNativoOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conSalida?: boolean;
  duracionSalida?: number;
}

export function useDialogoNativo({
  open,
  onOpenChange,
  conSalida = false,
  duracionSalida = 300,
}: UseDialogoNativoOptions) {
  const ref = useRef<HTMLDialogElement>(null);
  const disparadorRef = useRef<HTMLElement | null>(null);
  const bloqueadoRef = useRef(false);
  const salidaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const punteroEnFondoRef = useRef(false);
  const alCambiarRef = useRef(onOpenChange);

  useEffect(() => {
    alCambiarRef.current = onOpenChange;
  }, [onOpenChange]);

  const limpiarSalida = useCallback(() => {
    if (salidaRef.current) {
      clearTimeout(salidaRef.current);
      salidaRef.current = null;
    }
  }, []);

  const liberarBloqueo = useCallback(() => {
    if (!bloqueadoRef.current) return;
    bloqueadoRef.current = false;
    liberarScroll();
  }, []);

  const cerrarAhora = useCallback(() => {
    limpiarSalida();
    const dialogo = ref.current;
    if (dialogo) {
      delete dialogo.dataset.saliendo;
      if (dialogo.open) dialogo.close();
    }
    liberarBloqueo();

    const disparador = disparadorRef.current;
    disparadorRef.current = null;
    if (disparador?.isConnected) disparador.focus();
  }, [liberarBloqueo, limpiarSalida]);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;

    if (open) {
      limpiarSalida();
      if (!dialogo.open && dialogo.isConnected) {
        disparadorRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        dialogo.showModal();
        bloquearScroll();
        bloqueadoRef.current = true;
        delete dialogo.dataset.saliendo;
      }
      return;
    }

    if (!dialogo.open) return;

    if (conSalida) {
      dialogo.dataset.saliendo = "true";
      salidaRef.current = setTimeout(cerrarAhora, duracionSalida);
    } else {
      cerrarAhora();
    }
  }, [open, conSalida, duracionSalida, cerrarAhora, limpiarSalida]);

  useEffect(() => {
    const dialogo = ref.current;
    return () => {
      limpiarSalida();
      if (dialogo) {
        delete dialogo.dataset.saliendo;
        if (dialogo.open) dialogo.close();
      }
      liberarBloqueo();
    };
  }, [liberarBloqueo, limpiarSalida]);

  const alCancelar = (evento: SyntheticEvent<HTMLDialogElement>) => {
    // El evento nativo `cancel` no burbujea, pero React lo despacha por el
    // árbol: sin esta guarda, cerrar un diálogo anidado cierra al padre.
    if (evento.target !== evento.currentTarget) return;
    evento.preventDefault();
    evento.stopPropagation();
    alCambiarRef.current(false);
  };

  const alPointerDown = (evento: MouseEvent<HTMLDialogElement>) => {
    punteroEnFondoRef.current = evento.target === evento.currentTarget;
  };

  const alClic = (evento: MouseEvent<HTMLDialogElement>) => {
    if (
      punteroEnFondoRef.current &&
      evento.target === evento.currentTarget
    ) {
      alCambiarRef.current(false);
    }
    punteroEnFondoRef.current = false;
  };

  const alCerrarNativo = (evento: SyntheticEvent<HTMLDialogElement>) => {
    // `close` tampoco burbujea; React lo propaga por el árbol de componentes.
    if (evento.target !== evento.currentTarget) return;
    evento.stopPropagation();
    if (open) alCambiarRef.current(false);
  };

  return {
    ref,
    alCancelar,
    alPointerDown,
    alClic,
    alCerrarNativo,
  };
}
