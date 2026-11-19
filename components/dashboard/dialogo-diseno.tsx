'use client'

import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet } from '@/components/ui/sheet'
import { cn } from '@/lib/utils/cn'
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

export function DialogoDiseno({
  open,
  layout,
  onAplicar,
  onCerrar,
}: DialogoDisenoProps) {
  return (
    <Sheet open={open} title="Diseño del panel" onClose={onCerrar}>
      {open && (
        <Tabs defaultValue="disenos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="disenos">Diseños</TabsTrigger>
            <TabsTrigger value="ayuda">Cómo funciona</TabsTrigger>
          </TabsList>

          <TabsContent value="disenos" className="space-y-3">
            {PRESETS_LAYOUT.map((preset) => {
              const activo = coincideConPreset(layout, preset.id)
              return (
                <Card
                  key={preset.id}
                  variant={activo ? 'outline' : 'soft'}
                  className={cn('flex gap-3 p-3', activo && 'ring-1 ring-brand')}
                >
                  <MiniPreset preset={preset} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold text-fg">
                        {preset.nombre}
                      </p>
                      {activo && (
                        <Badge variant="brand" size="sm">
                          <Check className="size-3" aria-hidden />
                          Actual
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
                      {preset.descripcion}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onAplicar(preset.id)}
                      disabled={activo}
                      className="mt-2"
                    >
                      {activo ? 'En uso' : 'Aplicar'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="ayuda">
            <p className="text-sm leading-relaxed text-fg-muted">
              Los diseños reordenan y ajustan el tamaño de tus secciones y
              widgets; nada se elimina. Puedes seguir afinando a mano después.
            </p>
          </TabsContent>
        </Tabs>
      )}
    </Sheet>
  )
}

function claseCelda(tipo: TipoBloque): string {
  if (tipo === 'hero') {
    return 'bg-brand'
  }
  if (tipo === 'widget') {
    return 'border border-brand/20 bg-brand-soft'
  }
  return 'border border-line bg-surface-muted'
}

function MiniPreset({ preset }: { preset: PresetLayout }) {
  const celdas: Array<{
    id: string
    tipo: TipoBloque
    ancho: number
    filas: number
  }> = []
  const { ancho: anchoWidget, filas: filasWidget, despuesDe } = preset.widgets
  for (const spec of preset.bloques) {
    celdas.push({
      id: spec.tipo,
      tipo: spec.tipo,
      ancho: spec.ancho,
      filas: spec.filas,
    })
    if (spec.tipo === despuesDe) {
      celdas.push({
        id: 'widget-a',
        tipo: 'widget',
        ancho: anchoWidget,
        filas: filasWidget,
      })
      celdas.push({
        id: 'widget-b',
        tipo: 'widget',
        ancho: anchoWidget,
        filas: filasWidget,
      })
    }
  }

  return (
    <div
      aria-hidden
      className="grid w-24 shrink-0 auto-rows-2.5 grid-cols-4 gap-0.5 overflow-hidden rounded-panel"
    >
      {celdas.map((celda) => (
        <div
          key={celda.id}
          className={cn('rounded', claseCelda(celda.tipo))}
          style={{
            gridColumn: `span ${celda.ancho}`,
            gridRow: `span ${celda.filas}`,
          }}
        />
      ))}
    </div>
  )
}
