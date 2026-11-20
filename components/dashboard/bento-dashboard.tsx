'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  LayoutGrid,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { NumeroAnimado } from '@/components/ui/motion/numero-animado'
import { CuentaRow } from '@/components/dashboard/rows/cuenta-row'
import { PagoRow } from '@/components/dashboard/rows/pago-row'
import { MovimientoRow } from '@/components/dashboard/rows/movimiento-row'
import { REGISTRO_WIDGETS } from '@/components/dashboard/widgets/registry'
import { ChecklistSemanal } from '@/components/dashboard/checklist-semanal'
import { cn } from '@/lib/utils/cn'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import { FILTROS_DEFECTO, columnasWidgets } from '@/lib/tablero'
import { pagosParaProximos } from '@/lib/checklist-semanal'
import type {
  Cuenta,
  DatosDashboard,
  ProximoPago,
  Vista,
} from '@/lib/acciones'

const LIMITE = 4

export interface BentoDashboardProps {
  datos: DatosDashboard
  hoy: string
  horizonteControl: ReactNode
  modo: Vista
  onNuevoGasto: () => void
  onNuevoIngreso: () => void
  onTransferir: () => void
  onNuevaCuenta: () => void
  onPonerAlDia: () => void
  onEditarCuenta: (cuenta: Cuenta) => void
  onEliminarCuenta: (cuenta: Cuenta) => void
  onNuevoPago: () => void
  onEditarPago: (pago: ProximoPago) => void
  onEliminarPago: (pago: ProximoPago) => void
  onPagarPago: (pago: ProximoPago) => void
  onAdelantarPago: (pago: ProximoPago) => void
  onPagarSemanal: (pago: ProximoPago, cuentaId: number) => Promise<boolean>
  onEditarWidgets: () => void
}

export function BentoDashboard(props: BentoDashboardProps) {
  return props.modo === 'movil' ? (
    <BentoMovil {...props} />
  ) : (
    <BentoEscritorio {...props} />
  )
}

function PanelHeader({
  onEditarWidgets,
}: {
  onEditarWidgets: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium text-fg-muted">Tu panel</p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onEditarWidgets}
      >
        <LayoutGrid className="size-3.5" aria-hidden />
        Widgets
      </Button>
    </div>
  )
}

function BentoEscritorio(props: BentoDashboardProps) {
  const { datos, onEditarWidgets } = props

  return (
    <div className="space-y-4">
      <PanelHeader onEditarWidgets={onEditarWidgets} />

      <ChecklistSemanal
        pagos={datos.pagos}
        cuentas={datos.cuentas}
        hoy={props.hoy}
        onPagar={props.onPagarSemanal}
        onEditarPago={props.onEditarPago}
        onNuevaCuenta={props.onNuevaCuenta}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Hero {...props} />
        </div>
        <div className="lg:col-span-5">
          <Pagos {...props} />
        </div>
        <div className="lg:col-span-5">
          <Cuentas {...props} />
        </div>
        <div className="lg:col-span-7">
          <Historial {...props} />
        </div>

        {datos.widgetsActivos.length > 0 && (
          <div className="lg:col-span-12">
            <FranjaWidgets
              datos={datos}
              columnas={columnasWidgets(datos.widgetsActivos.length)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function BentoMovil(props: BentoDashboardProps) {
  const { datos, onEditarWidgets } = props

  return (
    <div className="space-y-4">
      <PanelHeader onEditarWidgets={onEditarWidgets} />
      <ChecklistSemanal
        pagos={datos.pagos}
        cuentas={datos.cuentas}
        hoy={props.hoy}
        onPagar={props.onPagarSemanal}
        onEditarPago={props.onEditarPago}
        onNuevaCuenta={props.onNuevaCuenta}
      />
      <Hero {...props} />
      <Cuentas {...props} />

      {datos.widgetsActivos.length > 0 && (
        <FranjaWidgets datos={datos} columnas={1} />
      )}
    </div>
  )
}

function Hero(props: BentoDashboardProps) {
  const {
    datos,
    horizonteControl,
    onNuevoGasto,
    onNuevoIngreso,
    onTransferir,
    onPonerAlDia,
  } = props

  const sinActividad =
    datos.cuentas.length === 0 &&
    datos.movimientos.length === 0 &&
    datos.pagos.length === 0

  return (
    <div className="flex h-full flex-col gap-3">
      <Card
        variant="soft"
        className="rounded-panel bg-brand-softer p-5 @lg:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-eyebrow uppercase text-brand">Disponible Real</p>
            <p className="mt-1 break-words text-3xl font-semibold tracking-tight text-fg @lg:text-4xl @4xl:text-5xl">
              <NumeroAnimado valor={datos.disponibleReal} duracion="normal" />
            </p>
            <p className="mt-1.5 text-sm text-fg-muted">
              Disponible {datos.horizonte.etiqueta}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-right">
            <Badge variant="neutral" size="sm">
              {datos.actualizado
                ? `Datos del ${formatearFecha(datos.actualizado)}`
                : sinActividad
                  ? 'Empieza aquí'
                  : 'Sin verificar'}
            </Badge>
            {datos.desactualizado && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                <AlertTriangle className="size-3.5" aria-hidden />
                Verifica tus saldos
              </span>
            )}
            {datos.cuentas.length > 0 && (
              <Button
                type="button"
                variant={datos.desactualizado ? 'solid' : 'secondary'}
                size="sm"
                onClick={onPonerAlDia}
                className="mt-0.5"
              >
                <RefreshCw className="size-3.5" aria-hidden />
                Poner al día
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-panel bg-surface/70 p-3">
            <p className="text-[11px] font-medium text-fg-subtle">
              Dinero líquido
            </p>
            <p className="mt-0.5 text-lg font-semibold text-fg">
              {formatearDinero(datos.dineroLiquido)}
            </p>
          </div>
          <div className="rounded-panel bg-surface/70 p-3">
            <p className="text-[11px] font-medium text-fg-subtle">
              Pagos del horizonte
            </p>
            <p className="mt-0.5 text-lg font-semibold text-fg">
              -{formatearDinero(datos.totalPagos)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onNuevoGasto}
            aria-label="Registrar gasto"
          >
            <ArrowUpRight className="size-3.5 text-fg-muted" aria-hidden />
            Gasto
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onNuevoIngreso}
            aria-label="Registrar ingreso"
          >
            <ArrowDownLeft className="size-3.5 text-success" aria-hidden />
            Ingreso
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onTransferir}
            aria-label="Transferir entre cuentas"
          >
            <ArrowLeftRight className="size-3.5 text-brand" aria-hidden />
            Transferir
          </Button>
        </div>
      </Card>

      <div>{horizonteControl}</div>

      {datos.alertas.length > 0 && (
        <Alert
          variant="warning"
          title="No alcanza el saldo para tus pagos domiciliados"
        >
          <div className="space-y-2">
            {datos.alertas.map((alerta) => (
              <p key={alerta.pagoId}>
                <strong>{alerta.descripcion}</strong> (domiciliado, vence{' '}
                {formatearFecha(alerta.fechaVencimiento)}): faltan{' '}
                <strong>{formatearDinero(alerta.faltante)}</strong> para
                cubrirlo en {alerta.cuentaNombre}.
              </p>
            ))}
          </div>
        </Alert>
      )}

      {datos.presionFutura.length > 0 && (
        <div className="rounded-panel bg-surface-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-eyebrow uppercase text-fg-subtle">
              Presión futura
            </h3>
            <p className="text-xs text-fg-muted">
              después del {formatearFecha(datos.horizonte.fechaLimite)}
            </p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-fg-muted">
            No se descuentan del Disponible Real, pero tenlos presentes.
          </p>
          <div className="mt-3 divide-y divide-line">
            {datos.presionFutura.slice(0, 5).map((pago) => (
              <div
                key={pago.proximo_pago_id}
                className="flex items-center justify-between gap-2 py-1.5 text-sm"
              >
                <span className="truncate text-fg-muted">
                  {pago.descripcion} · {formatearFecha(pago.fecha_vencimiento)}
                </span>
                <span className="shrink-0 font-medium text-fg">
                  {formatearDinero(pago.monto)}
                </span>
              </div>
            ))}
          </div>
          {datos.presionFutura.length > 5 && (
            <p className="mt-2 text-xs text-fg-muted">
              +{datos.presionFutura.length - 5} pagos más
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Pagos(props: BentoDashboardProps) {
  const {
    datos,
    hoy,
    onNuevoPago,
    onEditarPago,
    onEliminarPago,
    onPagarPago,
    onAdelantarPago,
  } = props
  const [verMas, setVerMas] = useState(false)
  const pagos = pagosParaProximos(datos.pagos, hoy)
  const mostrados = verMas ? pagos : pagos.slice(0, LIMITE)

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-eyebrow uppercase text-fg-subtle">
          Próximos pagos
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onNuevoPago}
          aria-label="Nuevo pago"
          className="size-8 text-brand hover:bg-brand-soft"
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </div>

      {pagos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4 text-center">
          <p className="text-sm text-fg-muted">
            {datos.pagos.length > 0
              ? 'Los pagos semanales de esta semana están en el checklist de arriba.'
              : 'No hay pagos pendientes por el momento.'}
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={onNuevoPago}>
            <Plus className="size-3.5" aria-hidden />
            Nuevo pago
          </Button>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-line">
          {mostrados.map((pago) => (
            <PagoRow
              key={pago.proximo_pago_id}
              pago={pago}
              hoy={hoy}
              onEditar={() => onEditarPago(pago)}
              onEliminar={() => onEliminarPago(pago)}
              onPagar={() => onPagarPago(pago)}
              onAdelantar={
                pago.recurrente && !pago.es_tarjeta
                  ? () => onAdelantarPago(pago)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {pagos.length > LIMITE && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setVerMas((valor) => !valor)}
          className="mt-auto w-full"
        >
          {verMas ? 'Ver menos' : `Ver más (${pagos.length - LIMITE})`}
        </Button>
      )}
    </Card>
  )
}

function Cuentas(props: BentoDashboardProps) {
  const {
    datos,
    onNuevaCuenta,
    onPonerAlDia,
    onEditarCuenta,
    onEliminarCuenta,
  } = props
  const [verMas, setVerMas] = useState(false)
  const mostradas = verMas ? datos.cuentas : datos.cuentas.slice(0, LIMITE)

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-eyebrow uppercase text-fg-subtle">Cuentas</h4>
        <div className="flex items-center gap-1">
          {datos.cuentas.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onPonerAlDia}
              aria-label="Poner al día"
              title="Poner al día"
              className="size-8 text-fg-muted hover:bg-brand-soft hover:text-brand"
            >
              <RefreshCw className="size-4" aria-hidden />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNuevaCuenta}
            aria-label="Nueva cuenta"
            className="size-8 text-brand hover:bg-brand-soft"
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {datos.cuentas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4 text-center">
          <p className="text-sm text-fg-muted">
            Aún no tienes cuentas. Agrega la primera para empezar.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={onNuevaCuenta}>
            <Plus className="size-3.5" aria-hidden />
            Nueva cuenta
          </Button>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-line">
          {mostradas.map((cuenta) => (
            <CuentaRow
              key={cuenta.cuenta_id}
              cuenta={cuenta}
              onEditar={() => onEditarCuenta(cuenta)}
              onEliminar={() => onEliminarCuenta(cuenta)}
            />
          ))}
        </div>
      )}

      {datos.cuentas.length > LIMITE && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setVerMas((valor) => !valor)}
          className="mt-auto w-full"
        >
          {verMas ? 'Ver menos' : `Ver más (${datos.cuentas.length - LIMITE})`}
        </Button>
      )}
    </Card>
  )
}

function Historial({ datos }: BentoDashboardProps) {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-eyebrow uppercase text-fg-subtle">
          Historial reciente
        </h4>
        <Link
          href="/historial"
          className="text-xs font-medium text-brand transition-colors hover:text-brand-hover"
        >
          Ver todo
        </Link>
      </div>

      {datos.movimientos.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-6 text-center">
          <p className="text-sm text-fg-muted">
            Tus movimientos aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="mt-1 flex-1 divide-y divide-line">
          {datos.movimientos.slice(0, LIMITE).map((movimiento) => (
            <MovimientoRow
              key={movimiento.transaccion_id}
              movimiento={movimiento}
              categoria={
                movimiento.categoria_id != null
                  ? datos.categorias[String(movimiento.categoria_id)] ?? null
                  : null
              }
            />
          ))}
        </div>
      )}
    </Card>
  )
}

function FranjaWidgets({
  datos,
  columnas,
}: {
  datos: DatosDashboard
  columnas: 1 | 2 | 3
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4',
        columnas === 2 && 'lg:grid-cols-2',
        columnas === 3 && 'lg:grid-cols-3'
      )}
    >
      {datos.widgetsActivos.map((tipo) => {
        const definicion = REGISTRO_WIDGETS[tipo]
        if (!definicion) return null
        const Icono = definicion.Icon
        const filtros = {
          ...FILTROS_DEFECTO,
          ...(definicion.filtrosBase ?? {}),
        }
        const Contenido = definicion.Componente

        return (
          <Card key={tipo} className="flex min-h-[220px] flex-col p-4">
            <div className="flex items-center gap-2">
              <Icono className="size-4 text-brand" aria-hidden />
              <h4 className="text-eyebrow uppercase text-fg-subtle">
                {definicion.nombre}
              </h4>
            </div>
            <div className="mt-3 flex flex-1 flex-col justify-center">
              <Contenido datos={datos} filtros={filtros} />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
