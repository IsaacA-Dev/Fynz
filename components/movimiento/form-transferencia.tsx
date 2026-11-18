'use client'

import { useState, type FormEvent } from 'react'
import { ArrowLeftRight, DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import { transferir } from '@/lib/acciones-servidor'
import { formatearDinero } from '@/lib/utils/format'
import { parseCentavos } from '@/lib/dinero'
import type { Cuenta } from '@/lib/acciones'

interface FormTransferenciaProps {
  cuentas: Cuenta[]
  onClose: () => void
}

export function FormTransferencia({ cuentas, onClose }: FormTransferenciaProps) {
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [monto, setMonto] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  // Solo dinero líquido (efectivo y débito): las tarjetas no participan.
  const cuentasLiquidas = cuentas.filter((c) => c.metodo !== 'credito')
  const cuentasOrigen = cuentasLiquidas
  const cuentasDestino = cuentasLiquidas.filter((c) => c.cuenta_id !== Number(origen))

  let montoCentavos = 0
  try {
    montoCentavos = parseCentavos(monto)
  } catch {
    montoCentavos = 0
  }

  const valido =
    origen !== '' && destino !== '' && Number(origen) !== Number(destino) && montoCentavos > 0

  const ejecutarTransferencia = async () => {
    if (loading) return
    setLoading(true)
    setConfirmando(false)
    try {
      const cuentaOrigen = cuentasLiquidas.find((c) => c.cuenta_id === Number(origen))!
      const cuentaDestino = cuentasLiquidas.find((c) => c.cuenta_id === Number(destino))!
      const resultado = await transferir({
        cuentaOrigen: cuentaOrigen.cuenta_id,
        cuentaDestino: cuentaDestino.cuenta_id,
        monto: parseCentavos(monto),
        origenNombre: cuentaOrigen.nombre,
        destinoNombre: cuentaDestino.nombre,
      })
      if (!resultado.ok) {
        addToast(resultado.error, 'error')
        return
      }
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setConfirmando(true)
  }

  if (cuentasLiquidas.length < 2) {
    return (
      <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
        Necesitas al menos 2 cuentas de efectivo o débito para transferir.
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

      <ConfirmDialog
        open={confirmando}
        title="¿Confirmar transferencia?"
        message={`Se moverá ${formatearDinero(montoCentavos)} de ${cuentasLiquidas.find((c) => c.cuenta_id === Number(origen))?.nombre ?? ''} a ${cuentasLiquidas.find((c) => c.cuenta_id === Number(destino))?.nombre ?? ''}. Tu Disponible Real no cambia.`}
        confirmLabel="Transferir"
        cancelLabel="Cancelar"
        onConfirm={ejecutarTransferencia}
        onCancel={() => setConfirmando(false)}
      />
    </form>
  )
}
