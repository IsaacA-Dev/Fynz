'use client'

import { useState } from 'react'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
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
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
            {ETIQUETAS[clave]}
          </p>
          <div className="flex flex-wrap gap-2">
            {(OPCIONES[clave] as { valor: never; etiqueta: string }[]).map((opcion) => (
              <button
                key={String(opcion.valor)}
                onClick={() => elegir(clave, opcion.valor)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activo(clave, opcion.valor)
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-border-soft)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                }`}
              >
                {opcion.etiqueta}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={onCerrar}
          className="flex-1 py-2.5 rounded-xl font-medium bg-[var(--color-border)]/50 text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
        >
          Cancelar
        </button>
        <Button
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
