'use client'

import { useState, type FormEvent } from 'react'
import { CalendarDays, CreditCard, DollarSign } from 'lucide-react'
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
    cuenta != null ? String(cuenta.saldo) : ''
  )
  const [diaCorte, setDiaCorte] = useState(
    cuenta?.dia_corte != null ? String(cuenta.dia_corte) : ''
  )
  const [diaPago, setDiaPago] = useState(
    cuenta?.dia_pago != null ? String(cuenta.dia_pago) : ''
  )
  const [limite, setLimite] = useState(
    cuenta?.limite != null ? String(cuenta.limite) : ''
  )
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const esCredito = metodo === 'credito'

  const diaValido = (valor: string) =>
    valor === '' || (Number.isInteger(Number(valor)) && Number(valor) >= 1 && Number(valor) <= 31)

  const limiteValido = limite.trim() === '' || Number(limite) >= 0

  const cicloIncompleto =
    esCredito && (diaCorte.trim() === '') !== (diaPago.trim() === '')

  const esEdicion = cuenta != null
  const saldoActual = esEdicion ? cuenta.saldo : 0
  const hayAjuste =
    esEdicion &&
    balanceInicial.trim() !== '' &&
    !Number.isNaN(Number(balanceInicial)) &&
    Number(balanceInicial) !== saldoActual

  const valido =
    nombre.trim().length > 0 &&
    metodo !== '' &&
    balanceInicial.trim() !== '' &&
    !Number.isNaN(Number(balanceInicial)) &&
    !cicloIncompleto &&
    diaValido(diaCorte) &&
    diaValido(diaPago) &&
    limiteValido

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setLoading(true)
    try {
      const datos = {
        nombre: nombre.trim(),
        metodo: metodo as Metodo,
        saldoObjetivo: Number(balanceInicial),
        diaCorte: esCredito && diaCorte.trim() !== '' ? Number(diaCorte) : null,
        diaPago: esCredito && diaPago.trim() !== '' ? Number(diaPago) : null,
        limite: esCredito && limite.trim() !== '' ? Number(limite) : null,
      }
      if (esEdicion) {
        await actualizarCuenta(userId, cuenta.cuenta_id, datos, saldoActual)
        addToast('Cuenta actualizada', 'success')
      } else {
        await crearCuenta(userId, {
          ...datos,
          balanceInicial: datos.saldoObjetivo,
        })
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
        onChange={(e) => {
          const nuevo = e.target.value as Metodo | ''
          setMetodo(nuevo)
          if (nuevo === 'credito' && balanceInicial.trim() === '') {
            setBalanceInicial('0')
          }
        }}
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
        label={esCredito ? 'Deuda actual' : 'Balance inicial'}
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={balanceInicial}
        onChange={(e) => setBalanceInicial(e.target.value)}
        icon={<DollarSign className="w-4 h-4" />}
        required
      />

      {esCredito && (
        <div className="space-y-3">
          <Input
            label="Límite de crédito (opcional)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            icon={<CreditCard className="w-4 h-4" />}
          />
          <p className="text-xs text-[var(--color-text-muted)] -mt-1">
            Si tu banco cambia tu línea de crédito, edítalo aquí. No genera movimientos.
          </p>

          <Input
            label="Día de corte"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            placeholder="Ej. 20"
            value={diaCorte}
            onChange={(e) => setDiaCorte(e.target.value)}
            icon={<CalendarDays className="w-4 h-4" />}
          />
          <Input
            label="Día de pago (límite)"
            type="number"
            inputMode="numeric"
            min="1"
            max="31"
            placeholder="Ej. 28"
            value={diaPago}
            onChange={(e) => setDiaPago(e.target.value)}
            icon={<CalendarDays className="w-4 h-4" />}
          />
          {cicloIncompleto ? (
            <p className="text-xs text-[var(--color-error)] -mt-1">
              Si defines ciclo, necesitas ambos días (corte y pago).
            </p>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)] -mt-1">
              Tu banco define estos días. Fynz generará el pago de la tarjeta con esa fecha.
            </p>
          )}
        </div>
      )}

      {hayAjuste && (
        <p className="text-xs text-[var(--color-text-muted)] -mt-1">
          Al guardar, se registrará un movimiento de ajuste en tu historial.
        </p>
      )}

      <Button type="submit" loading={loading} disabled={!valido}>
        {esEdicion ? 'Guardar Cambios' : 'Crear Cuenta'}
      </Button>
    </form>
  )
}
