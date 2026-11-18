'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link2, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { MovimientoRow } from '@/components/dashboard/rows/movimiento-row'
import { MovimientoDetalle } from '@/components/historial/movimiento-detalle'
import {
  buscarDetalleMovimiento,
  buscarMovimientos,
  listarCategoriasHistorial,
  listarCuentasHistorial,
  type MovimientoHistorial,
} from '@/lib/acciones-servidor'
import { FILTROS_HISTORIAL_VACIOS, OPERACIONES, type FiltrosHistorial } from '@/lib/historial'
import { hoyLocal } from '@/lib/fechas'
import { FynzLogo } from '@/components/ui/fynz-logo'
import { LogoutButton } from '@/components/dashboard/logout-button'

export function HistorialExplorador() {
  const [filtros, setFiltros] = useState<FiltrosHistorial>(FILTROS_HISTORIAL_VACIOS)
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosHistorial>(FILTROS_HISTORIAL_VACIOS)
  const [movimientos, setMovimientos] = useState<MovimientoHistorial[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [cuentas, setCuentas] = useState<Array<{ cuenta_id: number; nombre: string; metodo: string }>>([])
  const [categorias, setCategorias] = useState<Array<{ categoria_id: number; nombre: string }>>([])
  const [detalle, setDetalle] = useState<MovimientoHistorial | null>(null)
  const [hoy] = useState(() => hoyLocal())

  const cargar = useCallback(async (aplicados: FiltrosHistorial, offset: number, anexar: boolean) => {
    try {
      const resultado = await buscarMovimientos(aplicados, offset)
      if (!resultado) return
      setMovimientos((previos) => (anexar ? [...previos, ...resultado.movimientos] : resultado.movimientos))
      setTotal(resultado.total)
    } finally {
      setCargando(false)
      setCargandoMas(false)
    }
  }, [])

  useEffect(() => {
    listarCuentasHistorial().then(setCuentas).catch(() => {})
    listarCategoriasHistorial().then(setCategorias).catch(() => {})
    cargar(FILTROS_HISTORIAL_VACIOS, 0, false)
  }, [cargar])

  const aplicar = () => {
    setFiltrosAplicados(filtros)
    setCargando(true)
    cargar(filtros, 0, false)
  }

  const abrirDetalle = async (id: number) => {
    const detalleMovimiento = await buscarDetalleMovimiento(id)
    if (detalleMovimiento) setDetalle(detalleMovimiento)
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <header className="flex justify-between items-center mb-6">
          <FynzLogo height={26} />
          <LogoutButton />
        </header>

        <h1 className="text-xl font-bold text-[var(--color-text)] mb-4">Historial de movimientos</h1>

        <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Desde"
              type="date"
              value={filtros.desde ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value || null }))}
            />
            <Input
              label="Hasta"
              type="date"
              value={filtros.hasta ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value || null }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Cuenta"
              value={filtros.cuentaId != null ? String(filtros.cuentaId) : ''}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  cuentaId: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            >
              <option value="">Todas</option>
              {cuentas.map((c) => (
                <option key={c.cuenta_id} value={c.cuenta_id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
            <Select
              label="Tipo"
              value={filtros.tipo ?? ''}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, tipo: e.target.value === '' ? null : e.target.value as 'ingreso' | 'egreso' }))
              }
            >
              <option value="">Todos</option>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Operación"
              value={filtros.operacion ?? ''}
              onChange={(e) => setFiltros((f) => ({ ...f, operacion: e.target.value || null }))}
            >
              {OPERACIONES.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.etiqueta}
                </option>
              ))}
            </Select>
            <Select
              label="Estado"
              value={filtros.estado ?? ''}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, estado: e.target.value === '' ? null : e.target.value as 'atrasado' }))
              }
            >
              <option value="">Todos</option>
              <option value="atrasado">Atrasados</option>
            </Select>
          </div>

          {categorias.length > 0 && (
            <Select
              label="Categoría"
              value={filtros.categoriaId != null ? String(filtros.categoriaId) : ''}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  categoriaId: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.categoria_id} value={c.categoria_id}>
                  {c.nombre}
                </option>
              ))}
            </Select>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                label="Buscar"
                placeholder="Descripción..."
                value={filtros.texto}
                onChange={(e) => setFiltros((f) => ({ ...f, texto: e.target.value }))}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button type="button" onClick={aplicar} className="self-end">
              Aplicar
            </Button>
          </div>
        </section>

        <p className="text-xs text-[var(--color-text-muted)] mt-3 mb-2">
          {total} movimiento{total === 1 ? '' : 's'} encontrado{total === 1 ? '' : 's'}
        </p>

        {cargando ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : movimientos.length === 0 ? (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] p-8 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              No hay movimientos que coincidan.
            </p>
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] divide-y divide-[var(--color-border-soft)]">
            {movimientos.map((m) => (
              <MovimientoRow key={m.transaccion_id} movimiento={m} onVer={() => abrirDetalle(m.transaccion_id)} />
            ))}
          </div>
        )}

        {movimientos.length < total && (
          <div className="flex justify-center py-4">
            <button
              type="button"
              disabled={cargandoMas}
              onClick={() => cargar(filtrosAplicados, movimientos.length, true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] border border-[var(--color-primary)]/30 rounded-full px-5 py-2.5 hover:bg-[var(--color-primary-soft)] disabled:opacity-60 transition-colors"
            >
              {cargandoMas ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2 className="w-4 h-4" />
              )}
              Cargar más ({total - movimientos.length} restantes)
            </button>
          </div>
        )}

        <Sheet open={detalle !== null} title="Detalle del movimiento" onClose={() => setDetalle(null)}>
          {detalle && <MovimientoDetalle movimiento={detalle} hoy={hoy} />}
        </Sheet>
      </div>
    </main>
  )
}
