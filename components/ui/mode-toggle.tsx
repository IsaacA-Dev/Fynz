'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { useAnime } from '@/components/hooks/use-anime'

interface ModeToggleProps {
  isLogin: boolean
  onToggle: (mode: 'login' | 'register') => void
}

const tabs = [
  { key: 'login' as const, label: 'Login' },
  { key: 'register' as const, label: 'Registro' },
]

interface Posicion {
  x: number
  ancho: number
}

export function ModeToggle({ isLogin, onToggle }: ModeToggleProps) {
  const { animar, reducirMovimiento } = useAnime()
  const contenedorRef = useRef<HTMLDivElement | null>(null)
  const indicadorRef = useRef<HTMLSpanElement | null>(null)
  const posicionRef = useRef<Posicion>({ x: 0, ancho: 0 })

  const posicionar = () => {
    const contenedor = contenedorRef.current
    const indicador = indicadorRef.current
    const boton = contenedor?.querySelector<HTMLButtonElement>('[data-activo="true"]')
    if (!contenedor || !indicador || !boton) return null
    return { boton, indicador }
  }

  useLayoutEffect(() => {
    const encontrado = posicionar()
    if (!encontrado) return
    const destino = { x: encontrado.boton.offsetLeft, ancho: encontrado.boton.offsetWidth }
    const previo = posicionRef.current
    posicionRef.current = destino

    if (reducirMovimiento || (previo.x === 0 && previo.ancho === 0) || previo.x === destino.x) {
      encontrado.indicador.style.transform = `translateX(${destino.x}px)`
      encontrado.indicador.style.width = `${destino.ancho}px`
      return
    }

    animar(encontrado.indicador, {
      duracion: 'normal',
      translateX: [previo.x, destino.x],
      width: [previo.ancho, destino.ancho],
    })
  }, [animar, reducirMovimiento, isLogin])

  useEffect(() => {
    const alRedimensionar = () => {
      const encontrado = posicionar()
      if (!encontrado) return
      const destino = { x: encontrado.boton.offsetLeft, ancho: encontrado.boton.offsetWidth }
      posicionRef.current = destino
      encontrado.indicador.style.transform = `translateX(${destino.x}px)`
      encontrado.indicador.style.width = `${destino.ancho}px`
    }
    window.addEventListener('resize', alRedimensionar)
    return () => window.removeEventListener('resize', alRedimensionar)
  }, [isLogin])

  const active = isLogin ? 'login' : 'register'

  return (
    <div ref={contenedorRef} className="relative grid grid-cols-2 bg-[var(--color-border)]/50 rounded-xl p-1">
      <span
        ref={indicadorRef}
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-lg bg-[var(--color-surface)] shadow-sm"
      />
      {tabs.map((tab) => {
        const activo = active === tab.key
        return (
          <button
            key={tab.key}
            data-activo={activo}
            onClick={() => onToggle(tab.key)}
            className={`relative py-2.5 text-sm font-medium rounded-lg transition-colors ${
              activo ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <span className="relative z-10">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
