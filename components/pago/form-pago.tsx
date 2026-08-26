'use client'

import { useState, type FormEvent } from 'react'
import { CalendarDays, DollarSign, Repeat } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  actualizarProximoPago,
  crearProximoPago,
  type Cuenta,
  type ProximoPago,
} from '@/lib/acciones'

interface FormPagoProps {
  userId: string
  cuentas: Cuenta[]
  pago?: ProximoPago
  onClose: () => void
}

export function FormPago({ userId, cuentas, pago, onClose }: FormPagoProps) {
  const [descripcion, setDescripcion] = useState(pago?.descripcion ?? '')
  const [monto, setMonto] = useState(pago != null ? String(pago.monto) : '')
  const [recurrente, setRecurrente] = useState(pago?.recurrente ?? false)
  const [diaCobro, setDiaCobro] = useState(
    pago?.dia_cobro != null ? String(pago.dia_cobro) : ''
  )
  const [fecha, setFecha] = useState(
    pago && !pago.recurrente ? pago.fecha_vencimiento.slice(0, 10) : ''
  )
  const [reprogramarFecha, setReprogramarFecha] = useState('')
  const [domiciliado, setDomiciliado] = useState(
    pago?.domiciliado ?? false
  )
  const [cuentaId, setCuentaId] = useState(
    pago?.cuenta_id != null ? String(pago.cuenta_id) : ''
  )
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const esEdicion = pago != null

  const cuentasDomiciliables = cuentas.filter(
    (c) =>
      c.metodo !== 'credito' ||
      (pago?.cuenta_id != null && c.cuenta_id === pago.cuenta_id)
  )

  const diaValido =
    !recurrente ||
    (diaCobro !== '' && Number(diaCobro) >= 1 && Number(diaCobro) <= 31)

  const valido =
    descripcion.trim().length > 0 &&
    Number(monto) > 0 &&
    diaValido &&
    (recurrente || fecha !== '') &&
    (!domiciliado || cuentaId !== '')

  const handleTipoTiempo = (valor: boolean) => {
    setRecurrente(valor)
  }

  const handleDomiciliado = (valor: boolean) => {
    setDomiciliado(valor)
    if (!valor) setCuentaId('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setLoading(true)
    try {
      const datos = {
        descripcion: descripcion.trim(),
        monto: Number(monto),
        fechaVencimiento: recurrente
          ? new Date().toISOString()
          : new Date(`${fecha}T00:00:00`).toISOString(),
        domiciliado,
        cuentaId: domiciliado ? Number(cuentaId) : null,
        recurrente,
        diaCobro: recurrente ? Number(diaCobro) : null,
        reprogramarFecha:
          esEdicion && recurrente && reprogramarFecha !== ''
            ? new Date(`${reprogramarFecha}T00:00:00`).toISOString()
            : null,
      }
      if (esEdicion) {
        await actualizarProximoPago(userId, pago.proximo_pago_id, datos)
        addToast('Pago actualizado', 'success')
      } else {
        await crearProximoPago(userId, datos)
        addToast('Pago creado', 'success')
      }
      onClose()
    } catch (err) {
      addToast(
        err instanceof Error
          ? err.message
          : esEdicion
            ? 'No se pudo actualizar el pago'
            : 'No se pudo crear el pago',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Descripción"
        placeholder="Ej. Renta, Luz, Netflix..."
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        maxLength={60}
        required
      />

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

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
          Frecuencia
        </label>
        <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => handleTipoTiempo(false)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              !recurrente
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40'
            }`}
          >
            Único
          </button>
          <button
            type="button"
            onClick={() => handleTipoTiempo(true)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              recurrente
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40'
            }`}
          >
            Mensual
          </button>
        </div>
      </div>

      {recurrente ? (
        <div className="space-y-3">
          <Input
            label="Día de cobro (1-31)"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            placeholder="Ej. 25"
            value={diaCobro}
            onChange={(e) => setDiaCobro(e.target.value)}
            icon={<Repeat className="w-4 h-4" />}
            required
          />
          {esEdicion && (
            <div>
              <Input
                label="Reprogramar esta instancia (opcional)"
                type="date"
                value={reprogramarFecha}
                onChange={(e) => setReprogramarFecha(e.target.value)}
                icon={<CalendarDays className="w-4 h-4" />}
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
                El día de cobro seguirá aplicando a los siguientes periodos.
              </p>
            </div>
          )}
        </div>
      ) : (
        <Input
          label="Fecha de vencimiento"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          icon={<CalendarDays className="w-4 h-4" />}
          required
        />
      )}

      <div>
        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
          Domiciliado
        </label>
        <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => handleDomiciliado(false)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              !domiciliado
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => handleDomiciliado(true)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              domiciliado
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/40'
            }`}
          >
            Domiciliado
          </button>
        </div>
      </div>

      {domiciliado && (
        <Select
          label="Cuenta que se cobrará"
          value={cuentaId}
          onChange={(e) => setCuentaId(e.target.value)}
          required
        >
          <option value="">Selecciona una cuenta</option>
          {cuentasDomiciliables.map((c) => (
            <option key={c.cuenta_id} value={c.cuenta_id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      )}

      <Button type="submit" loading={loading} disabled={!valido}>
        {esEdicion ? 'Guardar Cambios' : 'Crear Pago'}
      </Button>
    </form>
  )
}
