'use client'

import { useEffect, type RefObject } from 'react'
import { useAnime } from '@/components/hooks/use-anime'

export function usePrensa(ref: RefObject<HTMLElement | null>) {
  const { animar, reducirMovimiento } = useAnime()

  useEffect(() => {
    const elemento = ref.current
    if (!elemento) return
    if (reducirMovimiento) return

    const presionar = () => {
      animar(elemento, {
        duracion: 'rapida',
        scale: 0.97,
      })
    }
    const soltar = () => {
      animar(elemento, {
        duracion: 'normal',
        scale: 1,
      })
    }

    elemento.addEventListener('pointerdown', presionar)
    elemento.addEventListener('pointerup', soltar)
    elemento.addEventListener('pointercancel', soltar)
    elemento.addEventListener('pointerleave', soltar)

    return () => {
      elemento.removeEventListener('pointerdown', presionar)
      elemento.removeEventListener('pointerup', soltar)
      elemento.removeEventListener('pointercancel', soltar)
      elemento.removeEventListener('pointerleave', soltar)
    }
  }, [animar, reducirMovimiento, ref])
}
