'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, Check, DollarSign, Pencil, Trash2, X } from 'lucide-react'
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
import { impactoCompra } from '@/lib/simulador'
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

      {impacto && (
        <div className="bg-[var(--color-border)]/30 rounded-xl p-3 space-y-1.5">
          {impacto.tipo === 'liquido' ? (
            <>
              <p className="text-sm text-[var(--color-text-muted)]">
                Disponible hoy{' '}
                <strong className="text-[var(--color-text)]">
                  {formatearDinero(impacto.disponibleAntes)}
                </strong>{' '}
                → después{' '}
                <strong className="text-[var(--color-text)]">
                  {formatearDinero(impacto.disponibleDespues)}
                </strong>
              </p>
              {impacto.alertas.map((alerta) => (
                <p
                  key={`${alerta.cuentaNombre}-${alerta.descripcion}`}
                  className="flex items-start gap-1.5 text-xs text-[var(--color-warning)]"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    La cuenta {alerta.cuentaNombre} no alcanzaría para{' '}
                    <strong>{alerta.descripcion}</strong>: faltarían{' '}
                    <strong>{formatearDinero(alerta.faltante)}</strong>.
                  </span>
                </p>
              ))}
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-muted)]">
                Deuda de la tarjeta:{' '}
                <strong className="text-[var(--color-danger)]">
                  {formatearDinero(impacto.deudaAntes)}
                </strong>{' '}
                →{' '}
                <strong className="text-[var(--color-danger)]">
                  {formatearDinero(impacto.deudaDespues)}
                </strong>
                {impacto.vencimientoCiclo && (
                  <>
                    {' '}
                    · este ciclo vence el{' '}
                    <strong className="text-[var(--color-text)]">
                      {formatearFecha(impacto.vencimientoCiclo)}
                    </strong>
                  </>
                )}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                El dinero líquido no cambia hoy: la tarjeta se pagará después.
              </p>
              {impacto.vencimientoCiclo && impacto.montoCompromiso != null && (
                impacto.dentroDelHorizonte && impacto.disponibleDespues != null ? (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Disponible con ese ciclo:{' '}
                    <strong className="text-[var(--color-text)]">
                      {formatearDinero(impacto.disponibleAntes)}
                    </strong>{' '}
                    →{' '}
                    <strong className="text-[var(--color-text)]">
                      {formatearDinero(impacto.disponibleDespues)}
                    </strong>
                  </p>
                ) : (
                  <p className="text-xs text-amber-300">
                    Este pago (vence el {formatearFecha(impacto.vencimientoCiclo)}) queda
                    después de tu horizonte: no baja el Disponible Real hoy; lo verás
                    como presión futura.
                  </p>
                )
              )}
            </>
          )}
        </div>
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
              <button
                type="button"
                key={sugerida}
                onClick={() => {
                  setCategoriaId('__nueva')
                  setNuevaCategoria(sugerida)
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-border)]/40 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
              >
                {sugerida}
              </button>
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
            <button
              type="button"
              onClick={crearNueva}
              aria-label="Crear categoría"
              className="mb-0.5 p-3 rounded-panel bg-brand text-on-brand hover:bg-brand-hover transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80"
            >
              <Check className="size-4" />
            </button>
          </div>
        )}

        {categorias.length > 0 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setEditandoCategorias((v) => !v)}
              className="text-xs font-medium text-[var(--color-primary)] hover:opacity-80 transition-opacity inline-flex items-center gap-1"
            >
              {editandoCategorias ? (
                <>
                  <X className="w-3 h-3" /> Cerrar administración
                </>
              ) : (
                <>
                  <Pencil className="w-3 h-3" /> Administrar categorías
                </>
              )}
            </button>

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
                        <button
                          type="button"
                          onClick={() => guardarRenombrado(c)}
                          aria-label="Guardar nombre"
                          className="mb-0.5 p-2 rounded-panel bg-brand text-on-brand hover:bg-brand-hover transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/80"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenombrandoId(null)}
                          aria-label="Cancelar"
                          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-[var(--color-text)] flex-1 truncate">
                          {c.nombre}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] shrink-0">
                          {c.usos} uso{c.usos === 1 ? '' : 's'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRenombrandoId(c.categoria_id)
                            setRenombrandoNombre(c.nombre)
                          }}
                          aria-label={`Renombrar ${c.nombre}`}
                          className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors shrink-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmandoEliminar(c)}
                          aria-label={`Eliminar ${c.nombre}`}
                          className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
