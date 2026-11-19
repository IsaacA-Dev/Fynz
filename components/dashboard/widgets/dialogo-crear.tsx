'use client'

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  History,
  LayoutGrid,
  Plus,
  Receipt,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CATALOGO_WIDGETS } from './registry'
import { FILTROS_DEFECTO } from '@/lib/tablero'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { DatosDashboard } from '@/lib/acciones'
import type { TipoBloque } from '@/lib/layout'

interface DialogoCrearProps {
  open: boolean
  datos: DatosDashboard
  onAñadir: (tipo: string) => void
  onAñadirBloque: (tipo: TipoBloque) => void
  onCerrar: () => void
}

const BLOQUES: Array<{
  tipo: TipoBloque
  nombre: string
  descripcion: string
  Icon: LucideIcon
  soloEscritorio?: boolean
}> = [
  {
    tipo: 'hero',
    nombre: 'Disponible Real',
    descripcion: 'Tu número principal con horizonte y próximos ingresos.',
    Icon: LayoutGrid,
  },
  {
    tipo: 'estadisticas',
    nombre: 'Resumen',
    descripcion: 'Dinero líquido y pagos del horizonte.',
    Icon: LayoutGrid,
  },
  {
    tipo: 'acciones',
    nombre: 'Acciones rápidas',
    descripcion: 'Gasto, ingreso y transferir.',
    Icon: Zap,
  },
  {
    tipo: 'cuentas',
    nombre: 'Cuentas',
    descripcion: 'Tu lista de cuentas.',
    Icon: Wallet,
  },
  {
    tipo: 'pagos',
    nombre: 'Próximos pagos',
    descripcion: 'Compromisos del periodo.',
    Icon: Receipt,
    soloEscritorio: true,
  },
  {
    tipo: 'historial',
    nombre: 'Historial reciente',
    descripcion: 'Últimos movimientos.',
    Icon: History,
    soloEscritorio: true,
  },
]

export function DialogoCrear({
  open,
  datos,
  onAñadir,
  onAñadirBloque,
  onCerrar,
}: DialogoCrearProps) {
  return (
    <Sheet open={open} title="Añadir al panel" onClose={onCerrar}>
      {open && (
        <Tabs defaultValue="secciones" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="secciones">Secciones</TabsTrigger>
            <TabsTrigger value="widgets">
              Widgets ({CATALOGO_WIDGETS.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="secciones">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              {BLOQUES.map(({ tipo, nombre, descripcion, Icon, soloEscritorio }) => (
                <Card
                  key={tipo}
                  variant="soft"
                  className="flex flex-col gap-2 p-3"
                >
                  <div className="h-20 overflow-hidden rounded-panel border border-line bg-surface">
                    <MiniSeccion tipo={tipo} datos={datos} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Icon className="size-3.5 shrink-0 text-brand" aria-hidden />
                      <p className="text-xs font-medium leading-tight text-fg">
                        {nombre}
                      </p>
                      {soloEscritorio && (
                        <Badge variant="neutral" size="sm">
                          Escritorio
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-fg-muted">
                      {descripcion}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onAñadirBloque(tipo)}
                    aria-label={`Añadir ${nombre}`}
                    className="w-full"
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Añadir
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="widgets">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              {CATALOGO_WIDGETS.map((definicion) => {
                const filtros = {
                  ...FILTROS_DEFECTO,
                  ...(definicion.filtrosBase ?? {}),
                }
                const Contenido = definicion.Componente
                return (
                  <Card
                    key={definicion.id}
                    variant="soft"
                    className="flex flex-col gap-2 p-3"
                  >
                    <div className="h-24 overflow-hidden rounded-panel border border-line bg-surface">
                      <div className="pointer-events-none h-[170%] w-[220%] origin-top-left scale-[0.55] p-1.5">
                        <Contenido datos={datos} filtros={filtros} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <definicion.Icon
                          className="size-3.5 shrink-0 text-brand"
                          aria-hidden
                        />
                        <p className="text-xs font-medium leading-tight text-fg">
                          {definicion.nombre}
                        </p>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-fg-muted">
                        {definicion.descripcion}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onAñadir(definicion.id)}
                      aria-label={`Añadir ${definicion.nombre}`}
                      className="w-full"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      Añadir
                    </Button>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <p className="text-xs leading-relaxed text-fg-muted">
            Los widgets se añaden con su configuración por defecto; puedes
            ajustarla después desde «Editar panel». Puedes duplicar un mismo
            widget.
          </p>
        </Tabs>
      )}
    </Sheet>
  )
}

function MiniSeccion({ tipo, datos }: { tipo: string; datos: DatosDashboard }) {
  switch (tipo) {
    case 'hero':
      return (
        <div className="flex h-full flex-col justify-center bg-brand p-2.5 text-on-brand">
          <p className="text-[9px] font-medium text-on-brand/85">
            Disponible Real
          </p>
          <p className="text-sm font-bold break-words">
            {formatearDinero(datos.disponibleReal)}
          </p>
          <p className="mt-0.5 text-[8px] text-on-brand/70">
            Datos del{' '}
            {datos.actualizado ? formatearFecha(datos.actualizado) : '—'}
          </p>
        </div>
      )
    case 'estadisticas':
      return (
        <div className="h-full space-y-1.5 p-2">
          <FilaResumen
            etiqueta="Líquido"
            valor={formatearDinero(datos.dineroLiquido)}
          />
          <FilaResumen
            etiqueta="Pagos"
            valor={`-${formatearDinero(datos.totalPagos)}`}
          />
        </div>
      )
    case 'acciones':
      return (
        <div className="grid h-full grid-cols-3 place-items-center gap-1.5 p-2">
          <MiniAccion Icon={ArrowUpRight} label="Gasto" />
          <MiniAccion Icon={ArrowDownLeft} label="Ingreso" />
          <MiniAccion Icon={ArrowLeftRight} label="Tran." />
        </div>
      )
    case 'cuentas':
      return (
        <div className="h-full space-y-1.5 overflow-hidden p-2">
          {datos.cuentas.slice(0, 2).map((c) => (
            <div
              key={c.cuenta_id}
              className="flex items-center justify-between gap-1 text-[9px]"
            >
              <span className="truncate text-fg-muted">{c.nombre}</span>
              <span className="shrink-0 font-semibold text-fg">
                {formatearDinero(c.saldo)}
              </span>
            </div>
          ))}
        </div>
      )
    case 'pagos':
      return (
        <div className="h-full space-y-1.5 overflow-hidden p-2">
          {datos.pagos.slice(0, 2).map((p) => (
            <div key={p.proximo_pago_id} className="space-y-0.5 text-[9px]">
              <span className="block truncate font-medium text-fg">
                {p.descripcion}
              </span>
              <span className="text-fg-muted">
                {formatearFecha(p.fecha_vencimiento)} · {formatearDinero(p.monto)}
              </span>
            </div>
          ))}
        </div>
      )
    case 'historial':
      return (
        <div className="h-full space-y-1.5 overflow-hidden p-2">
          {datos.movimientos.slice(0, 2).map((m) => (
            <div
              key={m.transaccion_id}
              className="flex items-center justify-between gap-1 text-[9px]"
            >
              <span className="truncate text-fg-muted">
                {m.descripcion ?? (m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso')}
              </span>
              <span className="shrink-0 font-semibold text-fg">
                {formatearDinero(m.monto)}
              </span>
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

function FilaResumen({
  etiqueta,
  valor,
}: {
  etiqueta: string
  valor: string
}) {
  return (
    <div className="rounded bg-surface px-1.5 py-1">
      <p className="text-[8px] text-fg-muted">{etiqueta}</p>
      <p className="text-[11px] font-semibold text-fg">{valor}</p>
    </div>
  )
}

function MiniAccion({
  Icon,
  label,
}: {
  Icon: LucideIcon
  label: string
}) {
  return (
    <div className="flex h-9 w-10 flex-col items-center justify-center gap-0.5 rounded bg-surface">
      <Icon className="size-3 text-fg-muted" aria-hidden />
      <span className="text-[7px] text-fg-muted">{label}</span>
    </div>
  )
}
