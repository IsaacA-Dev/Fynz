'use client'

import { useEffect, useState } from 'react'

const QUERY_LG = '(min-width: 1024px)'
const QUERY_MD = '(min-width: 768px)'

function columnasActuales(): number {
  if (window.matchMedia(QUERY_LG).matches) return 4
  if (window.matchMedia(QUERY_MD).matches) return 2
  return 1
}

// Devuelve el número efectivo de columnas del grid del panel en escritorio.
// Usa matchMedia para coincidir exactamente con los breakpoints de Tailwind
// (md: 768px → 2 columnas, lg: 1024px → 4 columnas). El valor inicial es 4
// (igual que el SSR) para evitar desajustes de hidratación; se sincroniza al montar.
export function useColumnasPanel(): number {
  const [columnas, setColumnas] = useState(4)

  useEffect(() => {
    const lg = window.matchMedia(QUERY_LG)
    const md = window.matchMedia(QUERY_MD)
    const sync = () => setColumnas(columnasActuales())
    sync()
    lg.addEventListener('change', sync)
    md.addEventListener('change', sync)
    return () => {
      lg.removeEventListener('change', sync)
      md.removeEventListener('change', sync)
    }
  }, [])

  return columnas
}
