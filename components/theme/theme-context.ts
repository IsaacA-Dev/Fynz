"use client";

import { createContext, useContext } from "react";
import { TEMAS, type TemaId } from "@/lib/temas";

export type ThemeContextValue = {
  tema: TemaId;
  setTema: (tema: TemaId) => void;
  temas: typeof TEMAS;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return contexto;
}
