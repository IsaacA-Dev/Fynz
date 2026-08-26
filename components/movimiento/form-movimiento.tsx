'use client'

import { useState, type FormEvent } from 'react'
import { DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { registrarMovimiento, type Cuenta, type TipoMovimiento } from '@/lib/acciones'

interface FormMovimientoProps {
  userId: string
  tipo: TipoMovimiento
  cuentas: Cuenta[]
  onClose: () => void
}

export function FormMovimiento({ userId, tipo, cuentas, onClose }: FormMovimientoProps) {
  const [monto, setMonto] = useState('')
  const [cuentaId, setCuentaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const esEgreso = tipo === 'egreso'
  const cuentaSeleccionada = cuentas.find((c) => c.cuenta_id === Number(cuentaId))
  const esCredito = cuentaSeleccionada?.metodo === 'credito'
  const valido = Number(monto) > 0 && cuentaId !== ''

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setLoading(true)
    try {
      await registrarMovimiento(userId, {
        cuentaId: Number(cuentaId),
        tipo,
        monto: Number(monto),
        descripcion: descripcion.trim() || undefined,
      })
      addToast(
        esEgreso
          ? esCredito
            ? 'Compra registrada'
            : 'Gasto registrado'
          : esCredito
            ? 'Pago a la tarjeta registrado'
            : 'Ingreso registrado',
        'success'
      )
      onClose()
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'No se pudo registrar el movimiento',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Monto"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        icon={<DollarSign className="w-4 h-4" />}
        required
      />

      <Select
        label="Cuenta"
        value={cuentaId}
        onChange={(e) => setCuentaId(e.target.value)}
        required
      >
        <option value="">Selecciona una cuenta</option>
        {cuentas.map((c) => (
          <option key={c.cuenta_id} value={c.cuenta_id}>
            {c.nombre}
          </option>
        ))}
      </Select>

      <Input
        label="Descripción (opcional)"
        placeholder="Ej. Quincena, Super..."
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        maxLength={60}
      />

      <Button type="submit" loading={loading} disabled={!valido}>
        {esEgreso
          ? esCredito
            ? 'Registrar Compra'
            : 'Registrar Gasto'
          : esCredito
            ? 'Registrar Pago'
            : 'Registrar Ingreso'}
      </Button>
    </form>
  )
}
