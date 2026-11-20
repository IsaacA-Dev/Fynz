'use client'

import { useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { CATALOGO_WIDGETS } from '@/components/dashboard/widgets/registry'

interface DialogoWidgetsProps {
  open: boolean
  activos: string[]
  onGuardar: (activos: string[]) => Promise<boolean>
  onCerrar: () => void
}

export function DialogoWidgets({
  open,
  activos,
  onGuardar,
  onCerrar,
}: DialogoWidgetsProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(abierto) => {
        if (!abierto) onCerrar()
      }}
    >
      <DialogContent className="max-w-md">
        <ContenidoWidgets
          key={open ? 'abierto' : 'cerrado'}
          activos={activos}
          onGuardar={onGuardar}
          onCerrar={onCerrar}
        />
      </DialogContent>
    </Dialog>
  )
}

function ContenidoWidgets({
  activos,
  onGuardar,
  onCerrar,
}: Omit<DialogoWidgetsProps, 'open'>) {
  const [seleccion, setSeleccion] = useState<string[]>(activos)
  const [guardando, setGuardando] = useState(false)

  const alternar = (id: string) => {
    setSeleccion((previos) =>
      previos.includes(id)
        ? previos.filter((actual) => actual !== id)
        : [...previos, id]
    )
  }

  const hayCambios =
    seleccion.length !== activos.length ||
    seleccion.some((id) => !activos.includes(id))

  const guardar = async () => {
    if (guardando || !hayCambios) return
    setGuardando(true)
    const ordenados = CATALOGO_WIDGETS.map((widget) => widget.id).filter(
      (id) => seleccion.includes(id)
    )
    const ok = await onGuardar(ordenados)
    setGuardando(false)
    if (ok) onCerrar()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <LayoutGrid className="size-4 text-brand" aria-hidden />
          Widgets del tablero
        </DialogTitle>
        <DialogDescription>
          Elige qué widgets quieres ver en la franja inferior de tu panel.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        {CATALOGO_WIDGETS.map((widget) => {
          const activo = seleccion.includes(widget.id)
          const Icono = widget.Icon
          return (
            <div
              key={widget.id}
              className="flex items-start justify-between gap-3 rounded-panel border border-line p-3"
            >
              <div className="flex min-w-0 gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icono className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">
                    {widget.nombre}
                  </p>
                  <p className="text-xs leading-relaxed text-fg-muted">
                    {widget.descripcion}
                  </p>
                </div>
              </div>
              <Switch
                checked={activo}
                onCheckedChange={() => alternar(widget.id)}
                aria-label={`Mostrar ${widget.nombre}`}
                disabled={guardando}
                className="mt-0.5"
              />
            </div>
          )
        })}
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={onCerrar}
          disabled={guardando}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={guardar}
          loading={guardando}
          disabled={guardando || !hayCambios}
        >
          Guardar cambios
        </Button>
      </DialogFooter>
    </>
  )
}
