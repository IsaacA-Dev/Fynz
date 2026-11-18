'use client'

import { Check } from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import {
  PRESETS_LAYOUT,
  coincideConPreset,
  type ConfiguracionLayout,
  type PresetLayout,
  type TipoBloque,
} from '@/lib/layout'

interface DialogoDisenoProps {
  open: boolean
  layout: ConfiguracionLayout
  onAplicar: (presetId: string) => void
  onCerrar: () => void
}

export function DialogoDiseno({ open, layout, onAplicar, onCerrar }: DialogoDisenoProps) {
  return (
    <Sheet open={open} title="Diseño del panel" onClose={onCerrar}>
      {open && (
        <div className="space-y-3">
          {PRESETS_LAYOUT.map((preset) => {
            const activo = coincideConPreset(layout, preset.id)
            return (
              <div
                key={preset.id}
                className={`bg-[var(--color-surface)] rounded-xl p-3 border flex gap-3 items-start transition-colors ${
                  activo
                    ? 'border-[var(--color-primary)]'
                    : 'border-[var(--color-border-soft)]'
                }`}
              >
                <MiniPreset preset={preset} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-1.5">
                    {preset.nombre}
                    {activo && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                        <Check className="w-3 h-3" />
                        Actual
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mt-0.5">
                    {preset.descripcion}
                  </p>
                  <button
                    type="button"
                    onClick={() => onAplicar(preset.id)}
                    disabled={activo}
                    className={`mt-2 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                      activo
                        ? 'bg-[var(--color-border-soft)] text-[var(--color-text-muted)] cursor-default'
                        : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                    }`}
                  >
                    {activo ? 'En uso' : 'Aplicar'}
                  </button>
                </div>
              </div>
            )
          })}

          <p className="text-xs text-[var(--color-text-muted)]">
            Los diseños reordenan y ajustan el tamaño de tus secciones y widgets; nada se
            elimina. Puedes seguir afinando a mano después.
          </p>
        </div>
      )}
    </Sheet>
  )
}

function claseCelda(tipo: TipoBloque): string {
  if (tipo === 'hero') {
    return 'bg-linear-to-br from-[var(--color-banner-start)] to-[var(--color-banner-end)]'
  }
  if (tipo === 'widget') {
    return 'bg-[var(--color-primary-soft)] border border-[var(--color-primary)]/30'
  }
  return 'bg-[var(--color-background)] border border-[var(--color-border-soft)]'
}

function MiniPreset({ preset }: { preset: PresetLayout }) {
  const celdas: Array<{ id: string; tipo: TipoBloque; ancho: number; filas: number }> = []
  const { ancho: anchoWidget, filas: filasWidget, despuesDe } = preset.widgets
  for (const spec of preset.bloques) {
    celdas.push({ id: spec.tipo, tipo: spec.tipo, ancho: spec.ancho, filas: spec.filas })
    if (spec.tipo === despuesDe) {
      celdas.push({ id: 'widget-a', tipo: 'widget', ancho: anchoWidget, filas: filasWidget })
      celdas.push({ id: 'widget-b', tipo: 'widget', ancho: anchoWidget, filas: filasWidget })
    }
  }

  return (
    <div
      aria-hidden
      className="grid grid-cols-4 gap-[3px] auto-rows-[11px] w-24 shrink-0 rounded-md overflow-hidden"
    >
      {celdas.map((celda) => (
        <div
          key={celda.id}
          className={`rounded-[3px] ${claseCelda(celda.tipo)}`}
          style={{ gridColumn: `span ${celda.ancho}`, gridRow: `span ${celda.filas}` }}
        />
      ))}
    </div>
  )
}
