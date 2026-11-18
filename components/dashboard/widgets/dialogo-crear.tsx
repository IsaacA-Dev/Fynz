'use client'

import { useState } from 'react'
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  History,
  LayoutGrid,
  Receipt,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { Sheet } from '@/components/ui/sheet'
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

type Pestana = 'secciones' | 'widgets'

const BLOQUES: Array<{
  tipo: TipoBloque
  nombre: string
  descripcion: string
  Icon: LucideIcon
  soloEscritorio?: boolean
}> = [
  { tipo: 'hero', nombre: 'Disponible Real', descripcion: 'Tu número principal con horizonte y próximos ingresos.', Icon: LayoutGrid },
  { tipo: 'estadisticas', nombre: 'Resumen', descripcion: 'Dinero líquido y pagos del horizonte.', Icon: LayoutGrid },
  { tipo: 'acciones', nombre: 'Acciones rápidas', descripcion: 'Gasto, ingreso y transferir.', Icon: Zap },
  { tipo: 'cuentas', nombre: 'Cuentas', descripcion: 'Tu lista de cuentas.', Icon: Wallet },
  { tipo: 'pagos', nombre: 'Próximos pagos', descripcion: 'Compromisos del periodo.', Icon: Receipt, soloEscritorio: true },
  { tipo: 'historial', nombre: 'Historial reciente', descripcion: 'Últimos movimientos.', Icon: History, soloEscritorio: true },
]

export function DialogoCrear({ open, datos, onAñadir, onAñadirBloque, onCerrar }: DialogoCrearProps) {
  const [pestana, setPestana] = useState<Pestana>('secciones')

  return (
    <Sheet open={open} title="Añadir al panel" onClose={onCerrar}>
      {open && (
        <div className="space-y-4">
          <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
            <button
              type="button"
              onClick={() => setPestana('secciones')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                pestana === 'secciones'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40'
              }`}
            >
              Secciones
            </button>
            <button
              type="button"
              onClick={() => setPestana('widgets')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                pestana === 'widgets'
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40'
              }`}
            >
              Widgets ({CATALOGO_WIDGETS.length})
            </button>
          </div>

          {pestana === 'secciones' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              {BLOQUES.map(({ tipo, nombre, descripcion, Icon, soloEscritorio }) => (
                <div
                  key={tipo}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-2.5 flex flex-col gap-2"
                >
                  <div className="h-20 rounded-lg overflow-hidden border border-[var(--color-border-soft)]">
                    <MiniSeccion tipo={tipo} datos={datos} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--color-text)] flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                      <span className="truncate">{nombre}</span>
                      {soloEscritorio && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--color-border)]/50 text-[var(--color-text-muted)] shrink-0">
                          escritorio
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed line-clamp-2 mt-0.5">
                      {descripcion}
                    </p>
                  </div>
                  <button
                    onClick={() => onAñadirBloque(tipo)}
                    aria-label={`Añadir ${nombre}`}
                    className="w-full text-xs font-medium py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors"
                  >
                    Añadir
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              {CATALOGO_WIDGETS.map((definicion) => {
                const filtros = { ...FILTROS_DEFECTO, ...(definicion.filtrosBase ?? {}) }
                const Contenido = definicion.Componente
                return (
                  <div
                    key={definicion.id}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-2.5 flex flex-col gap-2"
                  >
                    <div className="h-24 rounded-lg overflow-hidden border border-[var(--color-border-soft)] bg-[var(--color-background)]">
                      <div className="pointer-events-none w-[220%] h-[170%] scale-[0.55] origin-top-left p-1.5">
                        <Contenido datos={datos} filtros={filtros} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--color-text)] flex items-center gap-1.5">
                        <definicion.Icon className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                        <span className="truncate">{definicion.nombre}</span>
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed line-clamp-2 mt-0.5">
                        {definicion.descripcion}
                      </p>
                    </div>
                    <button
                      onClick={() => onAñadir(definicion.id)}
                      aria-label={`Añadir ${definicion.nombre}`}
                      className="w-full text-xs font-medium py-1.5 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors"
                    >
                      Añadir
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-xs text-[var(--color-text-muted)]">
            Los widgets se añaden con su configuración por defecto; puedes ajustarla después
            desde «Editar panel». Puedes duplicar un mismo widget.
          </p>
        </div>
      )}
    </Sheet>
  )
}

function MiniSeccion({ tipo, datos }: { tipo: string; datos: DatosDashboard }) {
  switch (tipo) {
    case 'hero':
      return (
        <div className="h-full bg-linear-to-br from-[var(--color-banner-start)] to-[var(--color-banner-end)] p-2.5 text-white flex flex-col justify-center">
          <p className="text-[9px] text-white/85 font-medium">Disponible Real</p>
          <p className="text-sm font-bold break-words">{formatearDinero(datos.disponibleReal)}</p>
          <p className="text-[8px] text-white/70 mt-0.5">Datos del {datos.actualizado ? formatearFecha(datos.actualizado) : '—'}</p>
        </div>
      )
    case 'estadisticas':
      return (
        <div className="h-full p-2 space-y-1.5">
          <FilaResumen etiqueta="Líquido" valor={formatearDinero(datos.dineroLiquido)} />
          <FilaResumen etiqueta="Pagos" valor={`-${formatearDinero(datos.totalPagos)}`} negativo />
        </div>
      )
    case 'acciones':
      return (
        <div className="h-full p-2 grid grid-cols-3 gap-1.5 place-items-center">
          <MiniAccion Icon={ArrowUpRight} label="Gasto" />
          <MiniAccion Icon={ArrowDownLeft} label="Ingreso" />
          <MiniAccion Icon={ArrowLeftRight} label="Tran." />
        </div>
      )
    case 'cuentas':
      return (
        <div className="h-full p-2 space-y-1.5 overflow-hidden">
          {datos.cuentas.slice(0, 2).map((c) => (
            <div key={c.cuenta_id} className="flex items-center justify-between gap-1 text-[9px]">
              <span className="text-[var(--color-text-muted)] truncate">{c.nombre}</span>
              <span
                className={`font-semibold shrink-0 ${
                  c.metodo === 'credito' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'
                }`}
              >
                {formatearDinero(c.saldo)}
              </span>
            </div>
          ))}
        </div>
      )
    case 'pagos':
      return (
        <div className="h-full p-2 space-y-1.5 overflow-hidden">
          {datos.pagos.slice(0, 2).map((p) => (
            <div key={p.proximo_pago_id} className="text-[9px] space-y-0.5">
              <span className="text-[var(--color-text)] font-medium block truncate">{p.descripcion}</span>
              <span className="text-[var(--color-text-muted)]">
                {formatearFecha(p.fecha_vencimiento)} · {formatearDinero(p.monto)}
              </span>
            </div>
          ))}
        </div>
      )
    case 'historial':
      return (
        <div className="h-full p-2 space-y-1.5 overflow-hidden">
          {datos.movimientos.slice(0, 2).map((m) => (
            <div key={m.transaccion_id} className="flex items-center justify-between gap-1 text-[9px]">
              <span className="text-[var(--color-text-muted)] truncate">
                {m.descripcion ?? (m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso')}
              </span>
              <span className="font-semibold shrink-0">{formatearDinero(m.monto)}</span>
            </div>
          ))}
        </div>
      )
    default:
      return null
  }
}

function FilaResumen({ etiqueta, valor, negativo = false }: { etiqueta: string; valor: string; negativo?: boolean }) {
  return (
    <div className="rounded-md bg-[var(--color-border)]/40 px-1.5 py-1">
      <p className="text-[8px] text-[var(--color-text-muted)]">{etiqueta}</p>
      <p className={`text-[11px] font-semibold ${negativo ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}`}>
        {valor}
      </p>
    </div>
  )
}

function MiniAccion({ Icon, label }: { Icon: LucideIcon; label: string }) {
  return (
    <div className="w-10 h-9 rounded-lg bg-[var(--color-border)]/40 flex flex-col items-center justify-center gap-0.5">
      <Icon className="w-3 h-3 text-[var(--color-text-muted)]" />
      <span className="text-[7px] text-[var(--color-text-muted)]">{label}</span>
    </div>
  )
}
