'use client'

import { useState, type FormEvent } from 'react'
import { CalendarDays, CreditCard, DollarSign } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { actualizarCuenta, crearCuenta } from '@/lib/acciones-servidor'
import { centavosACadena, parseCentavos } from '@/lib/dinero'
import { METODO_LABELS, type Cuenta, type Metodo } from '@/lib/acciones'

interface FormCuentaProps {
  cuenta?: Cuenta
  onClose: () => void
}

function centavosDeTexto(texto: string): number {
  try {
    return parseCentavos(texto)
  } catch {
    return Number.NaN
  }
}

export function FormCuenta({ cuenta, onClose }: FormCuentaProps) {
  const [nombre, setNombre] = useState(cuenta?.nombre ?? '')
  const [metodo, setMetodo] = useState<Metodo | ''>((cuenta?.metodo as Metodo) ?? '')
  const [balanceInicial, setBalanceInicial] = useState(
    cuenta != null ? centavosACadena(cuenta.saldo) : ''
  )
  const [diaCorte, setDiaCorte] = useState(
    cuenta?.dia_corte != null ? String(cuenta.dia_corte) : ''
  )
  const [diaPago, setDiaPago] = useState(
    cuenta?.dia_pago != null ? String(cuenta.dia_pago) : ''
  )
  const [limite, setLimite] = useState(
    cuenta?.limite != null ? centavosACadena(cuenta.limite) : ''
  )
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const esCredito = metodo === 'credito'

  const diaValido = (valor: string) =>
    valor === '' || (Number.isInteger(Number(valor)) && Number(valor) >= 1 && Number(valor) <= 31)

  const limiteValido = limite.trim() === '' || centavosDeTexto(limite) >= 0

  const cicloIncompleto =
    esCredito && (diaCorte.trim() === '') !== (diaPago.trim() === '')

  const esEdicion = cuenta != null
  const saldoActual = esEdicion ? cuenta.saldo : 0
  const saldoObjetivo = centavosDeTexto(balanceInicial)
  const hayAjuste =
    esEdicion &&
    balanceInicial.trim() !== '' &&
    !Number.isNaN(saldoObjetivo) &&
    saldoObjetivo !== saldoActual

  const valido =
    nombre.trim().length > 0 &&
    metodo !== '' &&
    balanceInicial.trim() !== '' &&
    !Number.isNaN(saldoObjetivo) &&
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
        saldoObjetivo: saldoObjetivo,
        diaCorte: esCredito && diaCorte.trim() !== '' ? Number(diaCorte) : null,
        diaPago: esCredito && diaPago.trim() !== '' ? Number(diaPago) : null,
        limite: esCredito && limite.trim() !== '' ? centavosDeTexto(limite) : null,
      }
      const resultado = esEdicion
        ? await actualizarCuenta(cuenta.cuenta_id, datos)
        : await crearCuenta({ ...datos, balanceInicial: datos.saldoObjetivo })
      if (!resultado.ok) {
        addToast(resultado.error, 'error')
        return
      }
      addToast(esEdicion ? 'Cuenta actualizada' : 'Cuenta creada', 'success')
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
      <FormField label="Nombre" required>
        <Input
          placeholder="Ej. Mis finanzas, BBVA..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={40}
          required
        />
      </FormField>

      <FormField label="Método" required>
        <Select
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
      </FormField>

      <FormField label={esCredito ? 'Deuda actual' : 'Balance inicial'} required>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={balanceInicial}
          onChange={(e) => setBalanceInicial(e.target.value)}
          leadingIcon={<DollarSign className="size-4" />}
          required
        />
      </FormField>

      {esCredito && (
        <div className="space-y-4">
          <FormField
            label="Límite de crédito (opcional)"
            hint="Si tu banco cambia tu línea de crédito, edítalo aquí. No genera movimientos."
          >
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              leadingIcon={<CreditCard className="size-4" />}
            />
          </FormField>

          <FormField
            label="Día de corte"
            error={
              cicloIncompleto
                ? 'Si defines ciclo, necesitas ambos días (corte y pago).'
                : undefined
            }
          >
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              placeholder="Ej. 20"
              value={diaCorte}
              onChange={(e) => setDiaCorte(e.target.value)}
              leadingIcon={<CalendarDays className="size-4" />}
            />
          </FormField>

          <FormField
            label="Día de pago (límite)"
            hint="Tu banco define estos días. Fynz generará el pago de la tarjeta con esa fecha."
          >
            <Input
              type="number"
              inputMode="numeric"
              min="1"
              max="31"
              placeholder="Ej. 28"
              value={diaPago}
              onChange={(e) => setDiaPago(e.target.value)}
              leadingIcon={<CalendarDays className="size-4" />}
            />
          </FormField>
        </div>
      )}

      {hayAjuste && (
        <p className="text-xs text-fg-muted">
          Al guardar, se registrará un movimiento de ajuste en tu historial.
        </p>
      )}

      <Button type="submit" loading={loading} disabled={!valido} className="w-full">
        {esEdicion ? 'Guardar Cambios' : 'Crear Cuenta'}
      </Button>
    </form>
  )
}
