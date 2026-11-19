'use client'

import { useState, type FormEvent } from 'react'
import { CalendarDays, DollarSign, Repeat } from 'lucide-react'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import { actualizarProximoPago, crearProximoPago } from '@/lib/acciones-servidor'
import { centavosACadena, parseCentavos } from '@/lib/dinero'
import { FRECUENCIAS, type Frecuencia } from '@/lib/recurrencia'
import type { Cuenta, ProximoPago } from '@/lib/acciones'

interface FormPagoProps {
  cuentas: Cuenta[]
  pago?: ProximoPago
  onClose: () => void
}

export function FormPago({ cuentas, pago, onClose }: FormPagoProps) {
  const frecuenciaInicial: Frecuencia = pago
    ? (pago.frecuencia ?? (pago.recurrente ? 'mensual' : 'unico'))
    : 'unico'

  const [descripcion, setDescripcion] = useState(pago?.descripcion ?? '')
  const [monto, setMonto] = useState(
    pago != null ? centavosACadena(pago.monto) : ''
  )
  const [frecuencia, setFrecuencia] =
    useState<Frecuencia>(frecuenciaInicial)
  const [diaCobro, setDiaCobro] = useState(
    pago?.dia_cobro != null ? String(pago.dia_cobro) : ''
  )
  const [fecha, setFecha] = useState(
    pago && frecuenciaInicial !== 'mensual'
      ? pago.fecha_vencimiento.slice(0, 10)
      : ''
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
  const esMensual = frecuencia === 'mensual'

  const cuentasDomiciliables = cuentas.filter(
    (c) =>
      c.metodo !== 'credito' ||
      (pago?.cuenta_id != null && c.cuenta_id === pago.cuenta_id)
  )

  const diaValido =
    !esMensual ||
    (diaCobro !== '' && Number(diaCobro) >= 1 && Number(diaCobro) <= 31)

  const fechaValida = esMensual || fecha !== ''

  const montoValido = (() => {
    try {
      return parseCentavos(monto) > 0
    } catch {
      return false
    }
  })()

  const valido =
    descripcion.trim().length > 0 &&
    montoValido &&
    diaValido &&
    fechaValida &&
    (!domiciliado || cuentaId !== '')

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
        monto: parseCentavos(monto),
        fechaVencimiento: esMensual ? null : fecha,
        domiciliado,
        cuentaId: domiciliado ? Number(cuentaId) : null,
        frecuencia,
        diaCobro: esMensual ? Number(diaCobro) : null,
        reprogramarFecha:
          esEdicion && esMensual && reprogramarFecha !== ''
            ? reprogramarFecha
            : null,
      }
      const resultado = esEdicion
        ? await actualizarProximoPago(pago.proximo_pago_id, datos)
        : await crearProximoPago(datos)
      if (!resultado.ok) {
        addToast(resultado.error, 'error')
        return
      }
      addToast(esEdicion ? 'Pago actualizado' : 'Pago creado', 'success')
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

  const ayudaFrecuencia =
    FRECUENCIAS.find((opcion) => opcion.valor === frecuencia)?.ayuda ?? ''

  const campoFecha = (etiqueta: string) => (
    <FormField label={etiqueta} hint={ayudaFrecuencia} required>
      <Input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        leadingIcon={<CalendarDays className="size-4" />}
        required
      />
    </FormField>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Descripción" required>
        <Input
          placeholder="Ej. Renta, Luz, Comedor..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={60}
          required
        />
      </FormField>

      <FormField label="Monto" required>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          leadingIcon={<DollarSign className="size-4" />}
          required
        />
      </FormField>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-fg-muted">Frecuencia</p>
        <Tabs
          defaultValue="unico"
          value={frecuencia}
          onValueChange={(valor) => setFrecuencia(valor as Frecuencia)}
          className="space-y-3"
        >
          <TabsList
            aria-label="Frecuencia del pago"
            className="grid w-full grid-cols-4"
          >
            {FRECUENCIAS.map((opcion) => (
              <TabsTrigger
                key={opcion.valor}
                value={opcion.valor}
                className="w-full px-1.5"
              >
                {opcion.etiqueta}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="unico">
            {campoFecha('Fecha de vencimiento')}
          </TabsContent>

          <TabsContent value="semanal">
            {campoFecha(
              esEdicion ? 'Próximo vencimiento' : 'Primer vencimiento'
            )}
          </TabsContent>

          <TabsContent value="quincenal">
            {campoFecha(
              esEdicion ? 'Próximo vencimiento' : 'Primer vencimiento'
            )}
          </TabsContent>

          <TabsContent value="mensual" className="space-y-3">
            <FormField label="Día de cobro (1-31)" required>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                max="31"
                placeholder="Ej. 25"
                value={diaCobro}
                onChange={(e) => setDiaCobro(e.target.value)}
                leadingIcon={<Repeat className="size-4" />}
                required
              />
            </FormField>
            {esEdicion && (
              <FormField
                label="Reprogramar esta instancia (opcional)"
                hint="El día de cobro seguirá aplicando a los siguientes periodos."
              >
                <Input
                  type="date"
                  value={reprogramarFecha}
                  onChange={(e) => setReprogramarFecha(e.target.value)}
                  leadingIcon={<CalendarDays className="size-4" />}
                />
              </FormField>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-fg-muted">Domiciliado</p>
        <Tabs
          defaultValue="normal"
          value={domiciliado ? 'domiciliado' : 'normal'}
          onValueChange={(valor) => handleDomiciliado(valor === 'domiciliado')}
          className="space-y-3"
        >
          <TabsList
            aria-label="Tipo de cobro"
            className="grid w-full grid-cols-2"
          >
            <TabsTrigger value="normal" className="w-full">
              Normal
            </TabsTrigger>
            <TabsTrigger value="domiciliado" className="w-full">
              Domiciliado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="normal">
            <p className="text-xs leading-relaxed text-fg-muted">
              Lo marcarás como pagado manualmente cuando lo cubras.
            </p>
          </TabsContent>

          <TabsContent value="domiciliado">
            <FormField label="Cuenta que se cobrará" required>
              <Select
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
            </FormField>
          </TabsContent>
        </Tabs>
      </div>

      <Button type="submit" loading={loading} disabled={!valido} className="w-full">
        {esEdicion ? 'Guardar Cambios' : 'Crear Pago'}
      </Button>
    </form>
  )
}
