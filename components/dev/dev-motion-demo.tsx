'use client'

import { useRef, useState } from 'react'
import { Entrada, NumeroAnimado, Stagger } from '@/components/ui/motion'
import { usePrensa } from '@/components/hooks/use-prensa'
import {
  duracionDestacada,
  duracionNormal,
  duracionRapida,
  easingPrincipal,
} from '@/lib/motion'

export function DevMotionDemo() {
  const [valor, setValor] = useState(1000)
  const [clave, setClave] = useState(0)
  const prensaRef = useRef<HTMLButtonElement | null>(null)
  usePrensa(prensaRef)

  if (process.env.NODE_ENV !== 'development') return null

  const reiniciar = () => setClave((c) => c + 1)

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 space-y-3 shadow-lg">
      <div>
        <p className="text-xs font-semibold text-[var(--color-text)]">
          Sistema de movimiento (dev)
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          Rápida {duracionRapida} ms · Normal {duracionNormal} ms ·{' '}
          Destacada {duracionDestacada} ms · ease {easingPrincipal}
        </p>
      </div>

      <div className="space-y-2">
        <Entrada key={`rapida-${clave}`} duracion="rapida" className="bg-[var(--color-primary-soft)] rounded-lg px-3 py-2 text-xs text-[var(--color-primary)] font-medium">
          Entrada rápida (150–220 ms)
        </Entrada>
        <Entrada key={`normal-${clave}`} duracion="normal" delay={100} className="bg-[var(--color-primary-soft)] rounded-lg px-3 py-2 text-xs text-[var(--color-primary)] font-medium">
          Entrada normal (300–450 ms) con delay 100
        </Entrada>
        <Entrada key={`destacada-${clave}`} duracion="destacada" delay={200} className="bg-[var(--color-primary-soft)] rounded-lg px-3 py-2 text-xs text-[var(--color-primary)] font-medium">
          Entrada destacada (500–700 ms) con delay 200
        </Entrada>
      </div>

      <Stagger
        key={`stagger-${clave}`}
        intervalo={50}
        retrasoBase={50}
        duracion="rapida"
        desdeY={8}
        className="grid grid-cols-3 gap-2"
      >
        <div className="bg-[var(--color-warning-soft)] rounded-lg px-2 py-2 text-center text-[10px] font-medium text-[var(--color-warning)]">A</div>
        <div className="bg-[var(--color-warning-soft)] rounded-lg px-2 py-2 text-center text-[10px] font-medium text-[var(--color-warning)]">B</div>
        <div className="bg-[var(--color-warning-soft)] rounded-lg px-2 py-2 text-center text-[10px] font-medium text-[var(--color-warning)]">C</div>
      </Stagger>

      <div className="flex items-center justify-between">
        <NumeroAnimado
          valor={valor}
          className="text-sm font-semibold text-[var(--color-text)]"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setValor((v) => v + 250)}
            className="bg-[var(--color-primary)] text-white px-2.5 py-1.5 rounded-lg text-xs font-medium"
          >
            +$250
          </button>
          <button
            onClick={reiniciar}
            className="bg-[var(--color-text-muted)] text-white px-2.5 py-1.5 rounded-lg text-xs font-medium"
          >
            Replay
          </button>
        </div>
      </div>

      <button
        ref={prensaRef}
        className="w-full bg-[var(--color-success)] text-white px-3 py-2 rounded-lg text-xs font-medium"
      >
        Presiona (escala 0.97 + recuperación)
      </button>

      <p className="text-[10px] text-[var(--color-text-muted)]">
        Con prefers-reduced-motion: reduce activo, no debe haber movimiento.
      </p>
    </div>
  )
}
