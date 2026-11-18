'use client'

import { useState } from 'react'
import { CalendarDays, Sparkles } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { formatearFecha } from '@/lib/utils/format'
import type { Horizonte } from '@/lib/acciones'

interface HorizonteControlProps {
  horizonte: Horizonte
  proximoIngreso: string | null
  guardando: boolean
  onPersistirPreferido: (preferido: number | null, fecha: string | null) => void
  onPersistirIngreso: (fecha: string | null) => void
}

export function HorizonteControl({
  horizonte,
  proximoIngreso,
  guardando,
  onPersistirPreferido,
  onPersistirIngreso,
}: HorizonteControlProps) {
  const [mostrarIngreso, setMostrarIngreso] = useState(false)
  const [fechaIngreso, setFechaIngreso] = useState(proximoIngreso ?? '')

  const esFecha = horizonte.preferidoFecha != null

  const chips: Array<{
    clave: string
    etiqueta: string
    activo: boolean
    alTocar: () => void
  }> = [
    {
      clave: 'auto',
      etiqueta: 'Auto',
      activo: horizonte.preferido == null && horizonte.preferidoFecha == null,
      alTocar: () => onPersistirPreferido(null, null),
    },
    { clave: '7', etiqueta: '7 días', activo: horizonte.preferido === 7, alTocar: () => onPersistirPreferido(7, null) },
    { clave: '15', etiqueta: '15 días', activo: horizonte.preferido === 15, alTocar: () => onPersistirPreferido(15, null) },
    { clave: '30', etiqueta: '30 días', activo: horizonte.preferido === 30, alTocar: () => onPersistirPreferido(30, null) },
  ]

  const guardarIngreso = (valor: string) => {
    setFechaIngreso(valor)
    if (valor === '') {
      onPersistirIngreso(null)
    } else if (valor.length >= 10) {
      onPersistirIngreso(valor.slice(0, 10))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip.clave}
            type="button"
            disabled={guardando}
            onClick={chip.alTocar}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 ${
              chip.activo
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)]/80 text-[var(--color-text-muted)] border border-[var(--color-border-soft)] hover:text-[var(--color-primary)]'
            }`}
          >
            {chip.etiqueta}
          </button>
        ))}

        <label
          className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
            esFecha
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface)]/80 text-[var(--color-text-muted)] border border-[var(--color-border-soft)] hover:text-[var(--color-primary)]'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            Fecha
          </span>
          <Input
            type="date"
            value={esFecha ? (horizonte.preferidoFecha ?? '') : ''}
            onChange={(e) => onPersistirPreferido(null, e.target.value || null)}
            className="sr-only"
            aria-label="Elegir fecha límite"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <button
          type="button"
          disabled={guardando}
          onClick={() => {
            setMostrarIngreso((v) => !v)
            setFechaIngreso(proximoIngreso ?? '')
          }}
          className="inline-flex items-center gap-1 font-medium text-[var(--color-primary)] hover:opacity-80 disabled:opacity-50"
        >
          <Sparkles className="w-3 h-3" />
          {proximoIngreso
            ? `Próximo ingreso: ${formatearFecha(proximoIngreso)}`
            : 'Registrar próximo ingreso'}
        </button>

        {mostrarIngreso && (
          <div className="flex w-full items-end gap-2">
            <FormField label="Fecha del próximo ingreso" className="flex-1">
              <Input
                type="date"
                value={fechaIngreso}
                onChange={(e) => guardarIngreso(e.target.value)}
              />
            </FormField>
            {proximoIngreso && (
              <button
                type="button"
                disabled={guardando}
                onClick={() => {
                  setFechaIngreso('')
                  onPersistirIngreso(null)
                }}
                className="mb-0.5 text-xs font-medium text-danger hover:opacity-80 disabled:opacity-50"
              >
                Quitar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
