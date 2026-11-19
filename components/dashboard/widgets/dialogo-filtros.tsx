'use client'

import { useState } from 'react'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import type { FiltrosTablero } from '@/lib/tablero'
import { REGISTRO_WIDGETS, type FiltroWidget } from './registry'

const HORIZONTE = [
  { valor: null as number | null, etiqueta: 'Completo' },
  { valor: 7, etiqueta: '7 días' },
  { valor: 15, etiqueta: '15 días' },
  { valor: 30, etiqueta: '30 días' },
]

const METODO = [
  { valor: 'todos' as FiltrosTablero['metodo'], etiqueta: 'Todas' },
  { valor: 'liquido' as FiltrosTablero['metodo'], etiqueta: 'Líquido' },
  { valor: 'tarjetas' as FiltrosTablero['metodo'], etiqueta: 'Tarjetas' },
]

const MESES = [
  { valor: 1 as FiltrosTablero['meses'], etiqueta: '1 mes' },
  { valor: 3 as FiltrosTablero['meses'], etiqueta: '3 meses' },
  { valor: 6 as FiltrosTablero['meses'], etiqueta: '6 meses' },
]

const OPCIONES: Record<FiltroWidget, { valor: never; etiqueta: string }[]> = {
  horizonte: HORIZONTE as never,
  metodo: METODO as never,
  meses: MESES as never,
}

const ETIQUETAS: Record<FiltroWidget, string> = {
  horizonte: 'Horizonte de pagos',
  metodo: 'Tipo de cuenta',
  meses: 'Periodo del flujo',
}

interface DialogoFiltrosProps {
  open: boolean
  tipo: string
  filtros: FiltrosTablero
  onGuardar: (filtros: FiltrosTablero) => void
  onCerrar: () => void
}

export function DialogoFiltros({ open, tipo, filtros, onGuardar, onCerrar }: DialogoFiltrosProps) {
  const definicion = REGISTRO_WIDGETS[tipo]
  return (
    <Sheet open={open} title={`Configurar ${definicion?.nombre ?? 'widget'}`} onClose={onCerrar}>
      {open && definicion && (
        <ContenidoFiltros
          filtros={filtros}
          filtrosDisponibles={definicion.filtrosDisponibles}
          onGuardar={onGuardar}
          onCerrar={onCerrar}
        />
      )}
    </Sheet>
  )
}

function ContenidoFiltros({
  filtros,
  filtrosDisponibles,
  onGuardar,
  onCerrar,
}: Omit<DialogoFiltrosProps, 'open' | 'tipo'> & { filtrosDisponibles: FiltroWidget[] }) {
  const [borrador, setBorrador] = useState<FiltrosTablero>(filtros)

  const elegir = (clave: FiltroWidget, valor: never) => {
    setBorrador((actual) => ({ ...actual, [clave]: valor }))
  }

  const activo = (clave: FiltroWidget, valor: never) => borrador[clave] === valor

  return (
    <div className="space-y-5">
      {filtrosDisponibles.map((clave) => (
        <div key={clave}>
          <p className="mb-2 text-eyebrow uppercase text-fg-subtle">
            {ETIQUETAS[clave]}
          </p>
          <div className="flex flex-wrap gap-2">
            {(OPCIONES[clave] as { valor: never; etiqueta: string }[]).map(
              (opcion) => {
                const seleccionado = activo(clave, opcion.valor)
                return (
                  <Chip
                    key={String(opcion.valor)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={seleccionado}
                    interactive
                    variant={seleccionado ? 'brand' : 'neutral'}
                    onClick={() => elegir(clave, opcion.valor)}
                    onKeyDown={(evento) => {
                      if (evento.key === 'Enter' || evento.key === ' ') {
                        evento.preventDefault()
                        elegir(clave, opcion.valor)
                      }
                    }}
                  >
                    {opcion.etiqueta}
                  </Chip>
                )
              }
            )}
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={onCerrar}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            onGuardar(borrador)
            onCerrar()
          }}
        >
          Guardar
        </Button>
      </div>
    </div>
  )
}
