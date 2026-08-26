'use client'

import { useCallback, useEffect, useRef } from 'react'
import { animate, type AnimationParams, type TargetsParam } from 'animejs'
import { easingPrincipal, resolverDuracion, type DuracionToken } from '@/lib/motion'
import { useReducedMotion } from '@/components/hooks/use-reduced-motion'

export interface ParamsAnimacion {
  duracion?: DuracionToken | number
  ease?: AnimationParams['ease']
  [clave: string]: unknown
}

export function useAnime() {
  const reducirMovimiento = useReducedMotion()
  const activasRef = useRef(new Set<ReturnType<typeof animate>>())

  useEffect(() => {
    const activas = activasRef.current
    return () => {
      activas.forEach((animacion) => animacion.pause())
      activas.clear()
    }
  }, [])

  const animar = useCallback(
    (targets: TargetsParam, params: ParamsAnimacion = {}) => {
      const { duracion, ease = easingPrincipal, ...resto } = params
      const animacion = animate(targets, {
        ...resto,
        ease,
        duration: reducirMovimiento ? 0 : resolverDuracion(duracion ?? 'normal'),
      } as AnimationParams)
      const activas = activasRef.current
      activas.add(animacion)
      animacion.then(() => activas.delete(animacion))
      return animacion
    },
    [reducirMovimiento]
  )

  return { animar, reducirMovimiento }
}
