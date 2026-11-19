'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Check, DollarSign, Pencil, Trash2, X } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Chip } from '@/components/ui/chip'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'
import {
  crearCategoria,
  eliminarCategoria,
  listarCategorias,
  registrarMovimiento,
  renombrarCategoria,
  type CategoriaConUsos,
} from '@/lib/acciones-servidor'
import { CATEGORIAS_SUGERIDAS, normalizarNombreCategoria } from '@/lib/categorias'
import { parseCentavos } from '@/lib/dinero'
import { impactoCompra, type ImpactoCompra } from '@/lib/simulador'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { Cuenta, Horizonte, ProximoPago, TipoMovimiento } from '@/lib/acciones'

interface FormMovimientoProps {
  tipo: TipoMovimiento
  cuentas: Cuenta[]
  pagos: ProximoPago[]
  horizonte: Horizonte
  disponibleReal: number
  hoy: string
  onClose: () => void
}

function tonoImpacto(impacto: ImpactoCompra): {
  variant: 'info' | 'warning' | 'danger'
  title: string
} {
  if (impacto.tipo === 'liquido') {
    const rompeCapacidad =
      impacto.disponibleDespues < 0 || impacto.alertas.length > 0
    if (rompeCapacidad) {
      return {
        variant: 'danger',
        title: 'Este gasto compromete tus pagos',
      }
    }
    return {
      variant: 'info',
      title: 'Impacto en tu Disponible Real',
    }
  }

  if (
    impacto.dentroDelHorizonte &&
    impacto.disponibleDespues != null &&
    impacto.disponibleDespues < 0
  ) {
    return {
      variant: 'danger',
      title: 'El pago de este ciclo no cabe en tu horizonte',
    }
  }

  if (impacto.dentroDelHorizonte && impacto.vencimientoCiclo != null) {
    return {
      variant: 'warning',
      title: 'Este ciclo reduce tu Disponible Real',
    }
  }

  return {
    variant: 'info',
    title: 'Impacto de la compra con crédito',
  }
}

export function FormMovimiento({
  tipo,
  cuentas,
  pagos,
  horizonte,
  disponibleReal,
  hoy,
  onClose,
}: FormMovimientoProps) {
  const [monto, setMonto] = useState('')
  const [cuentaId, setCuentaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [editandoCategorias, setEditandoCategorias] = useState(false)
  const [categorias, setCategorias] = useState<CategoriaConUsos[]>([])
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [renombrandoId, setRenombrandoId] = useState<number | null>(null)
  const [renombrandoNombre, setRenombrandoNombre] = useState('')
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<CategoriaConUsos | null>(null)
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const esEgreso = tipo === 'egreso'
  const cuentaSeleccionada = cuentas.find((c) => c.cuenta_id === Number(cuentaId))
  const esCredito = cuentaSeleccionada?.metodo === 'credito'

  const recargarCategorias = async () => {
    setCategorias(await listarCategorias())
  }

  useEffect(() => {
    let activo = true
    listarCategorias()
      .then((lista) => {
        if (activo) setCategorias(lista)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  let montoCentavos = 0
  try {
    montoCentavos = parseCentavos(monto)
  } catch {
    montoCentavos = 0
  }
  const valido = montoCentavos > 0 && cuentaId !== ''

  const impacto = esEgreso
    ? impactoCompra({
        monto: montoCentavos,
        cuentaId: Number(cuentaId),
        cuentas,
        pagos,
        horizonte,
        disponibleReal,
        hoy,
      })
    : null

  const tono = impacto ? tonoImpacto(impacto) : null

  const crearNueva = async () => {
    const normalizado = normalizarNombreCategoria(nuevaCategoria)
    if (!normalizado) {
      addToast('Escribe un nombre de 1 a 40 caracteres.', 'error')
      return
    }
    const resultado = await crearCategoria(normalizado)
    if (!resultado.ok) {
      addToast(resultado.error, 'error')
      return
    }
    setNuevaCategoria('')
    await recargarCategorias()
    if (resultado.categoriaId != null) setCategoriaId(String(resultado.categoriaId))
    addToast('Categoría creada', 'success')
  }

  const guardarRenombrado = async (cat: CategoriaConUsos) => {
    const normalizado = normalizarNombreCategoria(renombrandoNombre)
    if (!normalizado) {
      addToast('Escribe un nombre de 1 a 40 caracteres.', 'error')
      return
    }
    const resultado = await renombrarCategoria(cat.categoria_id, normalizado)
    if (!resultado.ok) {
      addToast(resultado.error, 'error')
      return
    }
    setRenombrandoId(null)
    await recargarCategorias()
  }

  const confirmarEliminar = async () => {
    if (!confirmandoEliminar) return
    const resultado = await eliminarCategoria(confirmandoEliminar.categoria_id)
    if (!resultado.ok) {
      addToast(resultado.error, 'error')
      setConfirmandoEliminar(null)
      return
    }
    setCategoriaId((actual) =>
      actual === String(confirmandoEliminar.categoria_id) ? '' : actual
    )
    setConfirmandoEliminar(null)
    await recargarCategorias()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || loading) return
    setLoading(true)
    try {
      const resultado = await registrarMovimiento({
        cuentaId: Number(cuentaId),
        tipo,
        monto: montoCentavos,
        descripcion: descripcion.trim() || undefined,
        categoriaId: categoriaId === '' ? null : Number(categoriaId),
      })
      if (!resultado.ok) {
        addToast(resultado.error, 'error')
        return
      }
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
      addToast(err instanceof Error ? err.message : 'No se pudo registrar el movimiento', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <FormField label="Cuenta" required>
        <Select
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
      </FormField>

      {impacto && tono && (
        <Alert variant={tono.variant} title={tono.title}>
          {impacto.tipo === 'liquido' ? (
            <div className="space-y-2">
              <p>
                Disponible hoy{' '}
                <strong className="text-fg">
                  {formatearDinero(impacto.disponibleAntes)}
                </strong>{' '}
                → después{' '}
                <strong className="text-fg">
                  {formatearDinero(impacto.disponibleDespues)}
                </strong>
                .
              </p>
              {impacto.disponibleDespues < 0 && (
                <p>
                  El gasto deja tu Disponible Real en negativo: no alcanza para
                  cubrir todos los compromisos del horizonte.
                </p>
              )}
              {impacto.alertas.length > 0 ? (
                <div className="space-y-1.5">
                  {impacto.alertas.map((alerta) => (
                    <p key={`${alerta.cuentaNombre}-${alerta.descripcion}`}>
                      La cuenta{' '}
                      <strong className="text-fg">{alerta.cuentaNombre}</strong>{' '}
                      no alcanzaría para{' '}
                      <strong className="text-fg">{alerta.descripcion}</strong>:
                      faltarían{' '}
                      <strong className="text-fg">
                        {formatearDinero(alerta.faltante)}
                      </strong>
                      .
                    </p>
                  ))}
                </div>
              ) : (
                impacto.disponibleDespues >= 0 && (
                  <p>Tus pagos del horizonte seguirían cubiertos.</p>
                )
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p>
                Deuda de la tarjeta:{' '}
                <strong className="text-fg">
                  {formatearDinero(impacto.deudaAntes)}
                </strong>{' '}
                →{' '}
                <strong className="text-fg">
                  {formatearDinero(impacto.deudaDespues)}
                </strong>
                {impacto.vencimientoCiclo && (
                  <>
                    {' '}
                    · este ciclo vence el{' '}
                    <strong className="text-fg">
                      {formatearFecha(impacto.vencimientoCiclo)}
                    </strong>
                  </>
                )}
                .
              </p>
              <p>El dinero líquido no cambia hoy: la tarjeta se paga después.</p>

              {impacto.vencimientoCiclo ? (
                <>
                  {impacto.montoCompromiso != null && (
                    <p>
                      Pago estimado del ciclo:{' '}
                      <strong className="text-fg">
                        {formatearDinero(impacto.montoCompromiso)}
                      </strong>
                      .
                    </p>
                  )}
                  {impacto.dentroDelHorizonte &&
                  impacto.disponibleDespues != null ? (
                    <p>
                      Disponible con ese ciclo:{' '}
                      <strong className="text-fg">
                        {formatearDinero(impacto.disponibleAntes)}
                      </strong>{' '}
                      →{' '}
                      <strong className="text-fg">
                        {formatearDinero(impacto.disponibleDespues)}
                      </strong>
                      .
                    </p>
                  ) : (
                    <p>
                      Este pago queda después de tu horizonte: no baja el
                      Disponible Real hoy; lo verás como presión futura.
                    </p>
                  )}
                </>
              ) : (
                <p>
                  No pudimos estimar el ciclo con los datos actuales; revisa el
                  pago indicado en tu estado de cuenta.
                </p>
              )}
            </div>
          )}
        </Alert>
      )}

      <FormField label="Descripción (opcional)">
        <Input
          placeholder="Ej. Quincena, Super..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={60}
        />
      </FormField>

      <div className="space-y-2">
        <FormField label="Categoría (opcional)">
          <Select
            value={categoriaId}
            onChange={(e) => {
              if (e.target.value === '__nueva') {
                setNuevaCategoria('')
                setCategoriaId('__nueva')
              } else {
                setCategoriaId(e.target.value)
              }
            }}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.categoria_id} value={c.categoria_id}>
                {c.nombre}
              </option>
            ))}
            <option value="__nueva">+ Nueva categoría…</option>
          </Select>
        </FormField>

        {categorias.length === 0 && (
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIAS_SUGERIDAS.slice(0, 5).map((sugerida) => (
              <Chip
                key={sugerida}
                role="button"
                tabIndex={0}
                interactive
                variant="neutral"
                onClick={() => {
                  setCategoriaId('__nueva')
                  setNuevaCategoria(sugerida)
                }}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter' || evento.key === ' ') {
                    evento.preventDefault()
                    setCategoriaId('__nueva')
                    setNuevaCategoria(sugerida)
                  }
                }}
              >
                {sugerida}
              </Chip>
            ))}
          </div>
        )}

        {categoriaId === '__nueva' && (
          <div className="flex items-end gap-2">
            <FormField label="Nombre de la categoría" className="flex-1">
              <Input
                placeholder="Ej. Hogar"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                maxLength={40}
                autoFocus
              />
            </FormField>
            <Button
              type="button"
              size="icon"
              onClick={crearNueva}
              aria-label="Crear categoría"
              className="mb-0.5 shrink-0"
            >
              <Check className="size-4" aria-hidden />
            </Button>
          </div>
        )}

        {categorias.length > 0 && (
          <div className="pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditandoCategorias((v) => !v)}
              className="h-7 px-0 text-xs text-brand hover:bg-transparent hover:text-brand-hover"
            >
              {editandoCategorias ? (
                <>
                  <X className="size-3" aria-hidden />
                  Cerrar administración
                </>
              ) : (
                <>
                  <Pencil className="size-3" aria-hidden />
                  Administrar categorías
                </>
              )}
            </Button>

            {editandoCategorias && (
              <div className="mt-2 space-y-1.5">
                {categorias.map((c) => (
                  <div key={c.categoria_id} className="flex items-end gap-2">
                    {renombrandoId === c.categoria_id ? (
                      <>
                        <FormField label="Nuevo nombre" className="flex-1">
                          <Input
                            value={renombrandoNombre}
                            onChange={(e) => setRenombrandoNombre(e.target.value)}
                            maxLength={40}
                            autoFocus
                          />
                        </FormField>
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => guardarRenombrado(c)}
                          aria-label="Guardar nombre"
                          className="mb-0.5 shrink-0"
                        >
                          <Check className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setRenombrandoId(null)}
                          aria-label="Cancelar"
                          className="mb-0.5 shrink-0"
                        >
                          <X className="size-3.5" aria-hidden />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 truncate text-sm text-fg">
                          {c.nombre}
                        </span>
                        <span className="shrink-0 text-[10px] text-fg-muted">
                          {c.usos} uso{c.usos === 1 ? '' : 's'}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setRenombrandoId(c.categoria_id)
                            setRenombrandoNombre(c.nombre)
                          }}
                          aria-label={`Renombrar ${c.nombre}`}
                          className="size-8 shrink-0 text-fg-muted hover:bg-brand-soft hover:text-brand"
                        >
                          <Pencil className="size-3.5" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmandoEliminar(c)}
                          aria-label={`Eliminar ${c.nombre}`}
                          className="size-8 shrink-0 text-fg-muted hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Button type="submit" loading={loading} disabled={!valido} className="w-full">
        {esEgreso
          ? esCredito
            ? 'Registrar Compra'
            : 'Registrar Gasto'
          : esCredito
            ? 'Registrar Pago'
            : 'Registrar Ingreso'}
      </Button>

      <ConfirmDialog
        open={confirmandoEliminar !== null}
        title="¿Eliminar categoría?"
        message={
          confirmandoEliminar
            ? `Se eliminará "${confirmandoEliminar.nombre}". ${confirmandoEliminar.usos > 0 ? `La usan ${confirmandoEliminar.usos} movimiento(s), que quedarán sin categoría. ` : ''}Los movimientos no se borran.`
            : ''
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onConfirm={confirmarEliminar}
        onCancel={() => setConfirmandoEliminar(null)}
      />
    </form>
  )
}
