'use client'

import { useLayoutEffect, useRef } from 'react'
import { useAnime } from '@/components/hooks/use-anime'
import type { DuracionToken } from '@/lib/motion'

interface EntradaProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'span' | 'li' | 'article'
  delay?: number
  duracion?: DuracionToken | number
  desdeX?: number
  desdeY?: number
  desdeEscala?: number
}

export function Entrada({
  children,
  className,
  as = 'div',
  delay = 0,
  duracion,
  desdeX = 0,
  desdeY = 12,
  desdeEscala = 1,
}: EntradaProps) {
  const { animar, reducirMovimiento } = useAnime()
  const ref = useRef<HTMLDivElement | null>(null)
  const Tag = as as 'div'

  useLayoutEffect(() => {
    const objetivo = ref.current
    if (!objetivo || reducirMovimiento) return

    objetivo.style.opacity = '0'
    objetivo.style.transform = `translate(${desdeX}px, ${desdeY}px) scale(${desdeEscala})`

    animar(objetivo, {
      duracion,
      delay,
      opacity: [0, 1],
      translateX: [desdeX, 0],
      translateY: [desdeY, 0],
      scale: [desdeEscala, 1],
    })
  }, [animar, reducirMovimiento, delay, duracion, desdeX, desdeY, desdeEscala])

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
