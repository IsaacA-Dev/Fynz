'use client'

import { useLayoutEffect, useRef } from 'react'
import { useAnime } from '@/components/hooks/use-anime'

export function AuthContainer({ children }: { children: React.ReactNode }) {
  const { animar, reducirMovimiento } = useAnime()
  const fondoRef = useRef<HTMLDivElement | null>(null)
  const contenedorRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (reducirMovimiento) return
    const fondo = fondoRef.current
    const contenedor = contenedorRef.current

    if (fondo) {
      fondo.style.opacity = '0'
      animar(fondo, { duracion: 'destacada', opacity: [0, 1] })
    }
    if (contenedor) {
      contenedor.style.opacity = '0'
      animar(contenedor, {
        duracion: 'destacada',
        opacity: [0, 1],
        translateY: [40, 0],
        scale: [0.96, 1],
      })
    }
  }, [animar, reducirMovimiento])

  return (
    <main className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6 relative overflow-hidden">
      <div ref={fondoRef} className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
      </div>

      <div ref={contenedorRef} className="relative w-full max-w-sm">
        {children}
      </div>
    </main>
  )
}
