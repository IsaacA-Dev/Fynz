'use client'

import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { liquidarPago, type Cuenta, type ProximoPago } from '@/lib/acciones'
import { formatearDinero } from '@/lib/utils/format'

interface FormLiquidarProps {
  userId: string
  pago: ProximoPago
  cuentas: Cuenta[]
  onClose: () => void
}

export function FormLiquidar({ userId, pago, cuentas, onClose }: FormLiquidarProps) {
  const [cuentaId, setCuentaId] = useState(
    pago.cuenta_id != null ? String(pago.cuenta_id) : ''
  )
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const valido = cuentaId !== ''

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setLoading(true)
    try {
      await liquidarPago(userId, pago.proximo_pago_id, {
        cuentaId: Number(cuentaId),
        monto: pago.monto,
        descripcion: pago.descripcion,
        recurrente: pago.recurrente,
        diaCobro: pago.dia_cobro,
        domiciliado: pago.domiciliado,
      })
      addToast(pago.recurrente ? 'Pago liquidado, se generó el siguiente' : 'Pago liquidado', 'success')
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
      <div className="bg-[var(--color-border)]/40 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">{pago.descripcion}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Venció el {new Date(pago.fecha_vencimiento).toLocaleDateString('es-MX')}</p>
        </div>
        <p className="text-xl font-bold text-[var(--color-text)]">
          {formatearDinero(pago.monto)}
        </p>
      </div>

      <Select label="¿Desde qué cuenta se pagó?" value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} required>
        <option value="">Selecciona una cuenta</option>
        {cuentas.map((c) => (
          <option key={c.cuenta_id} value={c.cuenta_id}>
            {c.nombre}
          </option>
        ))}
      </Select>

      <Button type="submit" loading={loading} disabled={!valido}>
        <Check className="w-4 h-4" />
        Confirmar pago
      </Button>
    </form>
  )
}
