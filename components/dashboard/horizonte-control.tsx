'use client'

import { useState } from 'react'
import { CalendarDays, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
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
    {
      clave: '7',
      etiqueta: '7 días',
      activo: horizonte.preferido === 7,
      alTocar: () => onPersistirPreferido(7, null),
    },
    {
      clave: '15',
      etiqueta: '15 días',
      activo: horizonte.preferido === 15,
      alTocar: () => onPersistirPreferido(15, null),
    },
    {
      clave: '30',
      etiqueta: '30 días',
      activo: horizonte.preferido === 30,
      alTocar: () => onPersistirPreferido(30, null),
    },
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
          <Chip
            key={chip.clave}
            role="button"
            tabIndex={0}
            aria-pressed={chip.activo}
            aria-disabled={guardando || undefined}
            interactive
            variant={chip.activo ? 'brand' : 'neutral'}
            onClick={() => {
              if (!guardando) chip.alTocar()
            }}
            onKeyDown={(evento) => {
              if (
                !guardando &&
                (evento.key === 'Enter' || evento.key === ' ')
              ) {
                evento.preventDefault()
                chip.alTocar()
              }
            }}
            className={guardando ? 'pointer-events-none opacity-60' : ''}
          >
            {chip.etiqueta}
          </Chip>
        ))}

        <label
          className={cn(
            'inline-flex rounded-full focus-within:ring-2 focus-within:ring-brand/80',
            guardando && 'pointer-events-none opacity-60'
          )}
        >
          <Chip
            interactive
            variant={esFecha ? 'brand' : 'neutral'}
            className="cursor-pointer"
          >
            <CalendarDays className="size-3" aria-hidden />
            Fecha
          </Chip>
          <Input
            type="date"
            value={esFecha ? (horizonte.preferidoFecha ?? '') : ''}
            onChange={(evento) =>
              onPersistirPreferido(null, evento.target.value || null)
            }
            className="sr-only h-px w-px"
            aria-label="Elegir fecha límite"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={guardando}
          onClick={() => {
            setMostrarIngreso((v) => !v)
            setFechaIngreso(proximoIngreso ?? '')
          }}
          aria-expanded={mostrarIngreso}
          aria-controls="campo-proximo-ingreso"
          className="h-7 px-0 text-xs text-brand hover:bg-transparent hover:text-brand-hover"
        >
          <Sparkles className="size-3" aria-hidden />
          {proximoIngreso
            ? `Próximo ingreso: ${formatearFecha(proximoIngreso)}`
            : 'Registrar próximo ingreso'}
        </Button>

        {mostrarIngreso && (
          <div className="flex w-full items-end gap-2">
            <FormField
              htmlFor="campo-proximo-ingreso"
              label="Fecha del próximo ingreso"
              className="flex-1"
            >
              <Input
                type="date"
                value={fechaIngreso}
                onChange={(evento) => guardarIngreso(evento.target.value)}
              />
            </FormField>
            {proximoIngreso && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={guardando}
                onClick={() => {
                  setFechaIngreso('')
                  onPersistirIngreso(null)
                }}
                aria-label="Quitar próximo ingreso"
                className="mb-0.5 text-danger hover:bg-danger-soft hover:text-danger"
              >
                <X className="size-3" aria-hidden />
                Quitar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
