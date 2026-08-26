'use client'

import { useId, useLayoutEffect, useRef } from 'react'
import { useAnime } from '@/components/hooks/use-anime'

function useGradientId() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return `fynz-gradient-${id}`
}

export function FynzMark({ size = 32 }: { size?: number }) {
  const gradientId = useGradientId()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      role="img"
      aria-label="Fynz"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="18"
          y1="12"
          x2="82"
          y2="88"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor="var(--color-banner-start, #2563eb)"
          />
          <stop
            offset="100%"
            stopColor="var(--color-banner-end, #172554)"
          />
        </linearGradient>
      </defs>

      {/* Contenedor simple y reconocible */}
      <rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="26"
        fill={`url(#${gradientId})`}
      />

      {/* F principal */}
      <path
        d="M32 73V31C32 25.5 36.5 21 42 21H69"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Brazo central convertido en crecimiento */}
      <path
        d="M32 52H48C53 52 57 50.5 60.5 47L69 38.5"
        stroke="white"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Destello */}
      <path
        data-chispa="true"
        d="M82 10 L83.9 15.1 L89 17 L83.9 18.9 L82 24 L80.1 18.9 L75 17 L80.1 15.1 Z"
        fill="white"
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />
    </svg>
  )
}

export function FynzWordmark({ height = 20 }: { height?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        color: 'var(--color-logo-text, #172554)',
        fontFamily: 'Manrope, Inter, system-ui, sans-serif',
        fontSize: height,
        fontWeight: 750,
        lineHeight: 1,
        letterSpacing: `-${height * 0.055}px`,
      }}
    >
      fynz
    </span>
  )
}

export function FynzLogo({ height = 30 }: { height?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center"
      style={{ gap: height * 0.25 }}
      role="img"
      aria-label="Fynz"
    >
      <span aria-hidden="true">
        <FynzMark size={height} />
      </span>

      <FynzWordmark height={height * 0.7} />
    </span>
  )
}

export function FynzLogoAnimado({ height = 30 }: { height?: number }) {
  const { animar, reducirMovimiento } = useAnime()
  const contenedorRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const contenedor = contenedorRef.current
    if (!contenedor || reducirMovimiento) return

    const marca = contenedor.querySelector<HTMLElement>('[data-marca]')
    const palabra = contenedor.querySelector<HTMLElement>('[data-palabra]')
    const chispa = contenedor.querySelector<SVGElement>('[data-chispa]')

    if (marca) {
      marca.style.opacity = '0'
      animar(marca, {
        duracion: 'normal',
        opacity: [0, 1],
        scale: [0.92, 1],
      })
    }

    if (palabra) {
      palabra.style.opacity = '0'
      animar(palabra, {
        delay: 180,
        duracion: 'normal',
        opacity: [0, 1],
        translateY: [8, 0],
      })
    }

    if (chispa) {
      chispa.style.opacity = '0'
      animar(chispa, {
        delay: 450,
        duracion: 'rapida',
        opacity: [0, 1],
        scale: [0.3, 1],
      })
    }
  }, [animar, reducirMovimiento])

  return (
    <span
      ref={contenedorRef}
      className="inline-flex shrink-0 items-center"
      style={{ gap: height * 0.25 }}
      role="img"
      aria-label="Fynz"
    >
      <span aria-hidden="true" data-marca>
        <FynzMark size={height} />
      </span>

      <span aria-hidden="true" data-palabra>
        <FynzWordmark height={height * 0.7} />
      </span>
    </span>
  )
}