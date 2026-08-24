'use client'

import { useState, type FormEvent } from 'react'
import { DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  actualizarCuenta,
  crearCuenta,
  METODO_LABELS,
  type Cuenta,
  type Metodo,
} from '@/lib/acciones'

interface FormCuentaProps {
  userId: string
  cuenta?: Cuenta
  onClose: () => void
}

export function FormCuenta({ userId, cuenta, onClose }: FormCuentaProps) {
  const [nombre, setNombre] = useState(cuenta?.nombre ?? '')
  const [metodo, setMetodo] = useState<Metodo | ''>((cuenta?.metodo as Metodo) ?? '')
  const [balanceInicial, setBalanceInicial] = useState(
    cuenta != null ? String(cuenta.balance_inicial) : ''
  )
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const esEdicion = cuenta != null
  const valido =
    nombre.trim().length > 0 &&
    metodo !== '' &&
    balanceInicial.trim() !== '' &&
    !Number.isNaN(Number(balanceInicial))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setLoading(true)
    try {
      const datos = {
        nombre: nombre.trim(),
        metodo: metodo as Metodo,
        balanceInicial: Number(balanceInicial),
      }
      if (esEdicion) {
        await actualizarCuenta(userId, cuenta.cuenta_id, datos)
        addToast('Cuenta actualizada', 'success')
      } else {
        await crearCuenta(userId, datos)
        addToast('Cuenta creada', 'success')
      }
      onClose()
    } catch (err) {
      addToast(
        err instanceof Error
          ? err.message
          : esEdicion
            ? 'No se pudo actualizar la cuenta'
            : 'No se pudo crear la cuenta',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre"
        placeholder="Ej. Mis finanzas, BBVA..."
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        maxLength={40}
        required
      />

      <Select
        label="Método"
        value={metodo}
        onChange={(e) => setMetodo(e.target.value as Metodo | '')}
        required
      >
        <option value="">Selecciona el método</option>
        {(Object.keys(METODO_LABELS) as Metodo[]).map((m) => (
          <option key={m} value={m}>
            {METODO_LABELS[m]}
          </option>
        ))}
      </Select>

      <Input
        label="Balance inicial"
        type="number"
        inputMode="decimal"
        step="0.01"
        placeholder="0.00"
        value={balanceInicial}
        onChange={(e) => setBalanceInicial(e.target.value)}
        icon={<DollarSign className="w-4 h-4" />}
        required
      />

      <Button type="submit" loading={loading} disabled={!valido}>
        {esEdicion ? 'Guardar Cambios' : 'Crear Cuenta'}
      </Button>
    </form>
  )
}
