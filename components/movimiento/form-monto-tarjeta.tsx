'use client'

import { useState, type FormEvent } from 'react'
import { RotateCcw, Save } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { guardarMontoManualTarjeta } from '@/lib/acciones-servidor'
import { centavosACadena, parseCentavos } from '@/lib/dinero'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { ProximoPago } from '@/lib/acciones'

interface FormMontoTarjetaProps {
  pago: ProximoPago
  onClose: () => void
}

export function FormMontoTarjeta({ pago, onClose }: FormMontoTarjetaProps) {
  const [montoTexto, setMontoTexto] = useState(centavosACadena(pago.monto))
  const [minimoTexto, setMinimoTexto] = useState(
    pago.minimo != null && pago.minimo > 0 ? centavosACadena(pago.minimo) : ''
  )
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  let montoCentavos = 0
  try {
    montoCentavos = parseCentavos(montoTexto)
  } catch {
    montoCentavos = 0
  }

  let minimoCentavos = 0
  try {
    minimoCentavos = parseCentavos(minimoTexto)
  } catch {
    minimoCentavos = 0
  }

  const valido = montoCentavos >= 0

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setLoading(true)
    const resultado = await guardarMontoManualTarjeta(pago.proximo_pago_id, {
      objetivoManual: montoCentavos > 0 ? montoCentavos : null,
      minimo: minimoCentavos > 0 ? minimoCentavos : null,
    })
    setLoading(false)
    if (!resultado.ok) {
      addToast(resultado.error, 'error')
      return
    }
    addToast('Monto del ciclo actualizado', 'success')
    onClose()
  }

  const quitarManual = async () => {
    if (loading) return
    setLoading(true)
    const resultado = await guardarMontoManualTarjeta(pago.proximo_pago_id, {
      objetivoManual: null,
      minimo: null,
    })
    setLoading(false)
    if (!resultado.ok) {
      addToast(resultado.error, 'error')
      return
    }
    addToast('Se vuelve a usar el monto estimado', 'success')
    onClose()
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <Card variant="soft" className="p-4">
        <p className="text-sm font-medium text-fg">{pago.descripcion}</p>
        <p className="text-xs text-fg-muted">
          Vence el {formatearFecha(pago.fecha_vencimiento)} · estimado{' '}
          {formatearDinero(pago.monto)}
        </p>
      </Card>

      <p className="text-xs leading-relaxed text-fg-muted">
        Si tu estado de cuenta indica otra cantidad, escríbela aquí. Fynz la
        usará como el pago de este ciclo; la deuda real sigue calculándose sola.
      </p>

      <FormField label="Monto que sí pagarás (opcional)">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={montoTexto}
          onChange={(e) => setMontoTexto(e.target.value)}
        />
      </FormField>

      <FormField label="Mínimo del banco (opcional)">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={minimoTexto}
          onChange={(e) => setMinimoTexto(e.target.value)}
        />
      </FormField>

      <Button type="submit" loading={loading} disabled={!valido} className="w-full">
        <Save className="size-4" />
        Usar mi monto del estado de cuenta
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={quitarManual}
        disabled={loading}
        aria-label="Quitar monto manual"
        className="w-full text-danger hover:bg-danger-soft hover:text-danger"
      >
        <RotateCcw className="size-3" aria-hidden />
        Quitar monto manual
      </Button>
    </form>
  )
}
