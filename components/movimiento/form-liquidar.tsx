'use client'

import { useState, type FormEvent } from 'react'
import { Check, DollarSign } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { liquidarPago } from '@/lib/acciones-servidor'
import { centavosACadena, parseCentavos } from '@/lib/dinero'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { Cuenta, ProximoPago } from '@/lib/acciones'

interface FormLiquidarProps {
  pago: ProximoPago
  cuentas: Cuenta[]
  onClose: () => void
}

export function FormLiquidar({ pago, cuentas, onClose }: FormLiquidarProps) {
  const [cuentaId, setCuentaId] = useState(
    pago.cuenta_id != null ? String(pago.cuenta_id) : ''
  )
  const [montoTexto, setMontoTexto] = useState(centavosACadena(pago.monto))
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const cuentasLiquidas = cuentas.filter((c) => c.metodo !== 'credito')

  let montoCentavos = 0
  try {
    montoCentavos = parseCentavos(montoTexto)
  } catch {
    montoCentavos = 0
  }
  const valido = cuentaId !== '' && montoCentavos > 0

  const esPagoParcial = pago.es_tarjeta && montoCentavos > 0 && montoCentavos < pago.monto

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setLoading(true)
    try {
      const resultado = await liquidarPago(pago.proximo_pago_id, {
        cuentaId: Number(cuentaId),
        monto: montoCentavos,
      })
      if (!resultado.ok) {
        addToast(resultado.error, 'error')
        return
      }
      addToast(
        pago.recurrente ? 'Pago liquidado, se generó el siguiente' : 'Pago liquidado',
        'success'
      )
      onClose()
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'No se pudo liquidar el pago',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card variant="soft" className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-fg">{pago.descripcion}</p>
          <p className="text-xs text-fg-muted">
            Vence el {formatearFecha(pago.fecha_vencimiento)}
          </p>
          {pago.es_tarjeta && (
            <p className="mt-0.5 text-xs text-fg-muted">
              Monto estimado del ciclo: {formatearDinero(pago.monto)}
            </p>
          )}
          {pago.es_tarjeta && pago.minimo != null && pago.minimo > 0 && (
            <p className="text-xs text-fg-muted">
              Mín. del banco: {formatearDinero(pago.minimo)}
            </p>
          )}
        </div>
        <p className="shrink-0 text-xl font-semibold text-fg">
          {formatearDinero(pago.monto)}
        </p>
      </Card>

      <FormField
        label={pago.es_tarjeta ? 'Monto a pagar' : 'Monto'}
        hint={
          esPagoParcial
            ? 'Pago parcial: el compromiso del ciclo se reducirá al resto pendiente.'
            : undefined
        }
        required
      >
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={montoTexto}
          onChange={(e) => setMontoTexto(e.target.value)}
          leadingIcon={<DollarSign className="size-4" />}
          required
        />
      </FormField>

      <FormField label="¿Desde qué cuenta se pagó?" required>
        <Select
          value={cuentaId}
          onChange={(e) => setCuentaId(e.target.value)}
          required
        >
          <option value="">Selecciona una cuenta</option>
          {cuentasLiquidas.map((c) => (
            <option key={c.cuenta_id} value={c.cuenta_id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </FormField>

      <Button type="submit" loading={loading} disabled={!valido} className="w-full">
        <Check className="size-4" />
        Confirmar pago
      </Button>
    </form>
  )
}
