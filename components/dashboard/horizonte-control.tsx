'use client'

import { useState } from 'react'
import { CalendarDays, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils/cn'
import { hoyLocal } from '@/lib/fechas'
import { formatearFecha } from '@/lib/utils/format'
import {
  FRECUENCIAS_PROXIMO_INGRESO,
  etiquetaFrecuenciaProximoIngreso,
  siguienteFechaProximoIngreso,
  type FrecuenciaProximoIngreso,
} from '@/lib/proximo-ingreso'
import type { Horizonte } from '@/lib/acciones'

interface HorizonteControlProps {
  horizonte: Horizonte
  proximoIngreso: string | null
  frecuenciaProximoIngreso: FrecuenciaProximoIngreso
  guardando: boolean
  onPersistirPreferido: (preferido: number | null, fecha: string | null) => void
  onPersistirIngreso: (
    fecha: string | null,
    frecuencia: FrecuenciaProximoIngreso
  ) => void
}

export function HorizonteControl({
  horizonte,
  proximoIngreso,
  frecuenciaProximoIngreso,
  guardando,
  onPersistirPreferido,
  onPersistirIngreso,
}: HorizonteControlProps) {
  const [mostrarIngreso, setMostrarIngreso] = useState(false)
  const [fechaIngreso, setFechaIngreso] = useState(proximoIngreso ?? '')
  const [frecuenciaIngreso, setFrecuenciaIngreso] = useState(
    frecuenciaProximoIngreso
  )

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
    if (valor === '') {
      setFechaIngreso('')
      setFrecuenciaIngreso('unica')
      onPersistirIngreso(null, 'unica')
      return
    }

    if (valor.length < 10) {
      setFechaIngreso(valor)
      return
    }

    const fecha = siguienteFechaProximoIngreso(
      valor.slice(0, 10),
      frecuenciaIngreso,
      hoyLocal()
    )
    const fechaEfectiva = fecha ?? valor.slice(0, 10)
    setFechaIngreso(fechaEfectiva)
    onPersistirIngreso(fechaEfectiva, frecuenciaIngreso)
  }

  const cambiarFrecuencia = (valor: FrecuenciaProximoIngreso) => {
    setFrecuenciaIngreso(valor)
    if (fechaIngreso === '') return

    const fecha = siguienteFechaProximoIngreso(
      fechaIngreso,
      valor,
      hoyLocal()
    )
    const fechaEfectiva = fecha ?? fechaIngreso
    setFechaIngreso(fechaEfectiva)
    onPersistirIngreso(fechaEfectiva, valor)
  }

  const quitarIngreso = () => {
    setFechaIngreso('')
    setFrecuenciaIngreso('unica')
    onPersistirIngreso(null, 'unica')
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
            setFrecuenciaIngreso(frecuenciaProximoIngreso)
          }}
          aria-expanded={mostrarIngreso}
          aria-controls="campo-proximo-ingreso"
          className="h-7 px-0 text-xs text-brand hover:bg-transparent hover:text-brand-hover"
        >
          <Sparkles className="size-3" aria-hidden />
          {proximoIngreso
            ? `Próximo ingreso: ${formatearFecha(proximoIngreso)}${
                frecuenciaProximoIngreso !== 'unica'
                  ? ` · ${etiquetaFrecuenciaProximoIngreso(frecuenciaProximoIngreso)}`
                  : ''
              }`
            : 'Registrar próximo ingreso'}
        </Button>

        {mostrarIngreso && (
          <div className="w-full space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_7.25rem] items-end gap-2">
              <FormField
                htmlFor="campo-proximo-ingreso"
                label="Fecha del próximo ingreso"
                className="min-w-0"
              >
                <Input
                  type="date"
                  value={fechaIngreso}
                  onChange={(evento) => guardarIngreso(evento.target.value)}
                  disabled={guardando}
                />
              </FormField>

              <FormField label="Repetición">
                <Select
                  value={frecuenciaIngreso}
                  onChange={(evento) =>
                    cambiarFrecuencia(
                      evento.target.value as FrecuenciaProximoIngreso
                    )
                  }
                  disabled={guardando || fechaIngreso === ''}
                  aria-label="Frecuencia del próximo ingreso"
                  className="h-10"
                >
                  {FRECUENCIAS_PROXIMO_INGRESO.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-fg-muted">
                {fechaIngreso === ''
                  ? 'Elige una fecha para configurar la repetición.'
                  : frecuenciaIngreso === 'unica'
                    ? 'Solo se usa esta fecha.'
                    : `Se repite cada ${
                        frecuenciaIngreso === 'semanal' ? 7 : 14
                      } días.`}
              </p>
              {proximoIngreso && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={guardando}
                  onClick={quitarIngreso}
                  aria-label="Quitar próximo ingreso"
                  className="h-7 shrink-0 px-2 text-danger hover:bg-danger-soft hover:text-danger"
                >
                  <X className="size-3" aria-hidden />
                  Quitar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
