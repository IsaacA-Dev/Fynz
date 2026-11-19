'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { CheckCircle2, DollarSign, RefreshCw } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { ponerAlDia } from '@/lib/acciones-servidor'
import {
  calcularPuestaAlDia,
  crearFilasCuentas,
  crearFilasPagos,
} from '@/lib/puesta-al-dia'
import { cn } from '@/lib/utils/cn'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { Cuenta, ProximoPago } from '@/lib/acciones'

interface FormPuestaAlDiaProps {
  cuentas: Cuenta[]
  pagos: ProximoPago[]
  hoy: string
  onClose: () => void
}

export function FormPuestaAlDia({
  cuentas,
  pagos,
  hoy,
  onClose,
}: FormPuestaAlDiaProps) {
  const cuentasBase = useMemo(() => crearFilasCuentas(cuentas), [cuentas])
  const pagosBase = useMemo(
    () => crearFilasPagos(pagos, hoy, cuentas),
    [pagos, hoy, cuentas]
  )

  const [saldos, setSaldos] = useState<Record<number, string>>(
    () =>
      Object.fromEntries(
        cuentasBase.map((cuenta) => [cuenta.cuentaId, cuenta.saldoTexto])
      ) as Record<number, string>
  )
  const [seleccionPagos, setSeleccionPagos] = useState<
    Record<number, { liquidar: boolean; cuentaOrigen: string }>
  >(
    () =>
      Object.fromEntries(
        pagosBase.map((pago) => [
          pago.pagoId,
          { liquidar: false, cuentaOrigen: pago.cuentaOrigen },
        ])
      ) as Record<number, { liquidar: boolean; cuentaOrigen: string }>
  )
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const cuentasLiquidas = cuentas.filter((cuenta) => cuenta.metodo !== 'credito')

  const filasCuentas = cuentasBase.map((cuenta) => ({
    ...cuenta,
    saldoTexto: saldos[cuenta.cuentaId] ?? '',
  }))

  const filasPagos = pagosBase.map((pago) => ({
    ...pago,
    liquidar: seleccionPagos[pago.pagoId]?.liquidar ?? false,
    cuentaOrigen:
      seleccionPagos[pago.pagoId]?.cuentaOrigen ?? pago.cuentaOrigen,
  }))

  const calculo = calcularPuestaAlDia(
    filasCuentas,
    filasPagos,
    cuentasLiquidas.map((cuenta) => cuenta.cuenta_id)
  )

  const pagosSeleccionados = filasPagos.filter((pago) => pago.liquidar).length
  const hayPagosSinMarcar =
    filasPagos.length > 0 && pagosSeleccionados === 0

  const handleSubmit = async (evento: FormEvent) => {
    evento.preventDefault()
    if (loading || !calculo.ok || !calculo.hayCambios) return

    setLoading(true)
    try {
      const resultado = await ponerAlDia({
        ajustes: calculo.ajustes.map((ajuste) => ({
          cuentaId: ajuste.cuentaId,
          saldoObjetivo: ajuste.saldoObjetivo,
        })),
        pagos: calculo.pagos.map((pago) => ({
          pagoId: pago.pagoId,
          cuentaOrigen: pago.cuentaOrigen,
        })),
      })

      if (!resultado.ok) {
        addToast(resultado.error, 'error')
      } else {
        const partes: string[] = []
        if (resultado.resumen.cuentasAjustadas > 0) {
          const cantidad = resultado.resumen.cuentasAjustadas
          partes.push(`${cantidad} ${cantidad === 1 ? 'cuenta' : 'cuentas'}`)
        }
        if (resultado.resumen.pagosLiquidados > 0) {
          const cantidad = resultado.resumen.pagosLiquidados
          partes.push(`${cantidad} ${cantidad === 1 ? 'pago' : 'pagos'}`)
        }
        addToast(
          partes.length > 0
            ? `Puesto al día: ${partes.join(' y ')}`
            : 'Todo estaba al día',
          'success'
        )
      }
      onClose()
    } catch {
      addToast('No pudimos poner al día tus cuentas', 'error')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const etiquetaDiferencia = (
    diferencia: number,
    esCredito: boolean
  ): { texto: string; clase: string } => {
    if (diferencia === 0) {
      return { texto: 'Sin cambio', clase: 'text-fg-subtle' }
    }
    const signo = diferencia > 0 ? '+' : ''
    return {
      texto: `${signo}${formatearDinero(diferencia)}`,
      clase:
        esCredito && diferencia > 0
          ? 'text-danger'
          : esCredito && diferencia < 0
            ? 'text-success'
            : 'text-fg-muted',
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-xs leading-relaxed text-fg-muted">
        Escribe lo que ves hoy en tus cuentas. No borra tu historial: Fynz
        registra un ajuste por la diferencia.
      </p>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-eyebrow uppercase text-fg-subtle">
            Saldos de hoy
          </h3>
          <Badge variant="neutral" size="sm">
            {cuentas.length} {cuentas.length === 1 ? 'cuenta' : 'cuentas'}
          </Badge>
        </div>

        <div className="divide-y divide-line rounded-panel border border-line">
          {filasCuentas.map((cuenta) => {
            const esCredito = cuenta.metodo === 'credito'
            const ajuste = calculo.ok
              ? calculo.ajustes.find(
                  (fila) => fila.cuentaId === cuenta.cuentaId
                )
              : undefined
            const diferencia = ajuste?.diferencia ?? 0
            const etiqueta = etiquetaDiferencia(diferencia, esCredito)

            return (
              <div key={cuenta.cuentaId} className="space-y-2 p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-fg">
                        {cuenta.nombre}
                      </p>
                      {esCredito && (
                        <Badge variant="danger" size="sm">
                          Crédito
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-fg-muted">
                      {esCredito ? 'Deuda en Fynz' : 'Saldo en Fynz'}:{' '}
                      <span
                        className={cn(
                          'font-medium',
                          esCredito ? 'text-danger' : 'text-fg'
                        )}
                      >
                        {formatearDinero(cuenta.saldoActual)}
                      </span>
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 text-right text-xs font-medium',
                      etiqueta.clase
                    )}
                  >
                    {etiqueta.texto}
                  </span>
                </div>

                <FormField
                  label={esCredito ? 'Deuda real hoy' : 'Saldo real hoy'}
                  required
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={cuenta.saldoTexto}
                    onChange={(evento) =>
                      setSaldos((previos) => ({
                        ...previos,
                        [cuenta.cuentaId]: evento.target.value,
                      }))
                    }
                    leadingIcon={<DollarSign className="size-4" />}
                    disabled={loading}
                    required
                  />
                </FormField>
              </div>
            )
          })}
        </div>
      </section>

      {filasPagos.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-eyebrow uppercase text-fg-subtle">
              Pagos vencidos
            </h3>
            <Badge variant="neutral" size="sm">
              {filasPagos.length}{' '}
              {filasPagos.length === 1 ? 'pago' : 'pagos'}
            </Badge>
          </div>

          {hayPagosSinMarcar && (
            <Alert variant="warning" title="Tienes pagos vencidos sin marcar">
              Si ya los pagaste, márcalos para que no se resten dos veces de tu
              Disponible Real.
            </Alert>
          )}

          <div className="divide-y divide-line rounded-panel border border-line">
            {filasPagos.map((pago) => {
              const seleccionado = pago.liquidar

              return (
                <div key={pago.pagoId} className="space-y-2.5 p-3.5">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={seleccionado}
                      onChange={(evento) =>
                        setSeleccionPagos((previos) => ({
                          ...previos,
                          [pago.pagoId]: {
                            liquidar: evento.target.checked,
                            cuentaOrigen: pago.cuentaOrigen,
                          },
                        }))
                      }
                      className="mt-0.5 size-4 shrink-0 accent-brand"
                      disabled={loading || cuentasLiquidas.length === 0}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-fg">
                          {pago.descripcion}
                        </span>
                        {pago.esTarjeta && (
                          <Badge variant="neutral" size="sm">
                            Tarjeta
                          </Badge>
                        )}
                      </span>
                      <span className="block text-xs text-fg-muted">
                        Venció el {formatearFecha(pago.fechaVencimiento)} ·{' '}
                        {formatearDinero(pago.monto)}
                      </span>
                    </span>
                  </label>

                  {seleccionado && (
                    <FormField label="¿Desde qué cuenta lo pagaste?" required>
                      <Select
                        value={pago.cuentaOrigen}
                        onChange={(evento) =>
                          setSeleccionPagos((previos) => ({
                            ...previos,
                            [pago.pagoId]: {
                              liquidar: true,
                              cuentaOrigen: evento.target.value,
                            },
                          }))
                        }
                        disabled={loading}
                        required
                      >
                        <option value="">Selecciona una cuenta</option>
                        {cuentasLiquidas.map((cuenta) => (
                          <option
                            key={cuenta.cuenta_id}
                            value={cuenta.cuenta_id}
                          >
                            {cuenta.nombre}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  )}
                </div>
              )
            })}
          </div>

          {cuentasLiquidas.length === 0 && (
            <p className="text-xs leading-relaxed text-fg-muted">
              Necesitas una cuenta de efectivo o débito para liquidar pagos.
            </p>
          )}
        </section>
      )}

      {!calculo.ok && (
        <Alert variant="warning" title="Revisa los datos">
          {calculo.error}
        </Alert>
      )}

      {calculo.ok && (
        <Card
          variant="soft"
          className="flex items-center justify-between gap-3 p-4"
        >
          <div className="min-w-0">
            {calculo.hayCambios ? (
              <>
                <p className="text-sm font-medium text-fg">
                  {calculo.resumen.cuentasAjustadas}{' '}
                  {calculo.resumen.cuentasAjustadas === 1
                    ? 'cuenta'
                    : 'cuentas'}{' '}
                  · {calculo.resumen.pagosLiquidados}{' '}
                  {calculo.resumen.pagosLiquidados === 1 ? 'pago' : 'pagos'}
                </p>
                <p className="text-xs text-fg-muted">
                  Ajuste total: {formatearDinero(calculo.resumen.totalAjustado)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-fg">
                  Todo coincide con Fynz
                </p>
                <p className="text-xs text-fg-muted">
                  No hay nada que ajustar por ahora.
                </p>
              </>
            )}
          </div>
          <RefreshCw className="size-5 shrink-0 text-brand" aria-hidden />
        </Card>
      )}

      <Button
        type="submit"
        loading={loading}
        disabled={loading || !calculo.ok || !calculo.hayCambios}
        className="w-full"
      >
        <CheckCircle2 className="size-4" aria-hidden />
        Poner al día
      </Button>
    </form>
  )
}
