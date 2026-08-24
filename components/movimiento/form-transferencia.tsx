'use client'

import { useState, type FormEvent } from 'react'
import { ArrowLeftRight, DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { transferir, type Cuenta } from '@/lib/acciones'

interface FormTransferenciaProps {
  userId: string
  cuentas: Cuenta[]
  onClose: () => void
}

export function FormTransferencia({ userId, cuentas, onClose }: FormTransferenciaProps) {
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [monto, setMonto] = useState('')
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const cuentasOrigen = cuentas
  const cuentasDestino = cuentas.filter((c) => c.cuenta_id !== Number(origen))

  const valido =
    origen !== '' && destino !== '' && Number(origen) !== Number(destino) && Number(monto) > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setLoading(true)
    try {
      const cuentaOrigen = cuentas.find((c) => c.cuenta_id === Number(origen))!
      const cuentaDestino = cuentas.find((c) => c.cuenta_id === Number(destino))!
      await transferir(userId, {
        cuentaOrigen: cuentaOrigen.cuenta_id,
        cuentaDestino: cuentaDestino.cuenta_id,
        monto: Number(monto),
        origenNombre: cuentaOrigen.nombre,
        destinoNombre: cuentaDestino.nombre,
      })
      addToast('Transferencia completada', 'success')
      onClose()
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'No se pudo registrar la transferencia',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  if (cuentas.length < 2) {
    return (
      <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
        Necesitas al menos 2 cuentas para transferir.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select label="Cuenta origen" value={origen} onChange={(e) => { setOrigen(e.target.value); if (destino === e.target.value) setDestino('') }} required>
        <option value="">Elige la cuenta</option>
        {cuentasOrigen.map((c) => (
          <option key={c.cuenta_id} value={c.cuenta_id}>
            {c.nombre}
          </option>
        ))}
      </Select>

      <Select label="Cuenta destino" value={destino} onChange={(e) => setDestino(e.target.value)} required>
        <option value="">Elige la cuenta</option>
        {cuentasDestino.map((c) => (
          <option key={c.cuenta_id} value={c.cuenta_id}>
            {c.nombre}
          </option>
        ))}
      </Select>

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

      <Button type="submit" loading={loading} disabled={!valido}>
        <ArrowLeftRight className="w-4 h-4" />
        Transferir
      </Button>
    </form>
  )
}
