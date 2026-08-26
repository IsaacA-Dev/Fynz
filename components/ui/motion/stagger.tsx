'use client'

import { useLayoutEffect, useRef } from 'react'
import { useAnime } from '@/components/hooks/use-anime'
import type { DuracionToken } from '@/lib/motion'

interface StaggerProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section'
  duracion?: DuracionToken | number
  intervalo?: number
  retrasoBase?: number
  desdeY?: number
  desdeX?: number
}

export function Stagger({
  children,
  className,
  as = 'div',
  duracion,
  intervalo = 80,
  retrasoBase = 100,
  desdeY = 12,
  desdeX = 0,
}: StaggerProps) {
  const { animar, reducirMovimiento } = useAnime()
  const ref = useRef<HTMLDivElement | null>(null)
  const Tag = as as 'div'

  useLayoutEffect(() => {
    const contenedor = ref.current
    if (!contenedor || reducirMovimiento) return
    const hijos = Array.from(contenedor.children)
    if (hijos.length === 0) return

    animar(hijos, {
      duracion,
      opacity: [0, 1],
      translateX: [desdeX, 0],
      translateY: [desdeY, 0],
      delay: (_: unknown, indice: number) => retrasoBase + indice * intervalo,
    })
  }, [animar, reducirMovimiento, duracion, intervalo, retrasoBase, desdeX, desdeY])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
