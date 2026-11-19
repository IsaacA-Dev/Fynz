"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  CLAVE_TEMA,
  TEMAS,
  TEMA_PREDETERMINADO,
  esTemaId,
  type TemaId,
} from "@/lib/temas";
import { ThemeContext } from "./theme-context";

const suscriptores = new Set<() => void>();

function temaDelDom(): TemaId {
  if (typeof document === "undefined") return TEMA_PREDETERMINADO;
  const actual = document.documentElement.dataset.theme;
  return esTemaId(actual) ? actual : TEMA_PREDETERMINADO;
}

function temaDelServidor(): TemaId {
  return TEMA_PREDETERMINADO;
}

function notificar() {
  for (const suscriptor of suscriptores) suscriptor();
}

function suscribir(suscriptor: () => void) {
  suscriptores.add(suscriptor);

  const alCambiarEnOtraPestana = (evento: StorageEvent) => {
    if (evento.key !== CLAVE_TEMA) return;
    const siguiente = esTemaId(evento.newValue)
      ? evento.newValue
      : TEMA_PREDETERMINADO;
    document.documentElement.dataset.theme = siguiente;
    notificar();
  };

  window.addEventListener("storage", alCambiarEnOtraPestana);
  return () => {
    suscriptores.delete(suscriptor);
    window.removeEventListener("storage", alCambiarEnOtraPestana);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const tema = useSyncExternalStore(
    suscribir,
    temaDelDom,
    temaDelServidor
  );

  // Re-aplica el tema tras el remount de Strict Mode en desarrollo.
  // El script inline ya lo aplicó antes del primer paint en producción.
  useLayoutEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CLAVE_TEMA);
      const inicial = esTemaId(guardado) ? guardado : TEMA_PREDETERMINADO;
      document.documentElement.dataset.theme = inicial;
    } catch {
      document.documentElement.dataset.theme = TEMA_PREDETERMINADO;
    }
  }, []);

  const setTema = useCallback((siguiente: TemaId) => {
    document.documentElement.dataset.theme = siguiente;
    notificar();
    try {
      window.localStorage.setItem(CLAVE_TEMA, siguiente);
    } catch {
      // Sin persistencia: el tema sigue activo en esta sesión.
    }
  }, []);

  const valor = useMemo(
    () => ({ tema, setTema, temas: TEMAS }),
    [tema, setTema]
  );

  return (
    <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>
  );
}
