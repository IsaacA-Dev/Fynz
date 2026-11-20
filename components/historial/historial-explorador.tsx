'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Link2, RotateCcw, Search } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { MovimientoRow } from '@/components/dashboard/rows/movimiento-row'
import { MovimientoDetalle } from '@/components/historial/movimiento-detalle'
import { FynzLogo } from '@/components/ui/fynz-logo'
import { LogoutButton } from '@/components/dashboard/logout-button'
import { ThemeSwitcher } from '@/components/theme/theme-switcher'
import {
  buscarDetalleMovimiento,
  buscarMovimientos,
  listarCategoriasHistorial,
  listarCuentasHistorial,
  type MovimientoHistorial,
} from '@/lib/acciones-servidor'
import {
  FILTROS_HISTORIAL_VACIOS,
  OPERACIONES,
  type FiltrosHistorial,
} from '@/lib/historial'
import { hoyLocal } from '@/lib/fechas'

export function HistorialExplorador() {
  const [filtros, setFiltros] = useState<FiltrosHistorial>(
    FILTROS_HISTORIAL_VACIOS
  )
  const [filtrosAplicados, setFiltrosAplicados] =
    useState<FiltrosHistorial>(FILTROS_HISTORIAL_VACIOS)
  const [movimientos, setMovimientos] = useState<MovimientoHistorial[]>([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [cuentas, setCuentas] = useState<
    Array<{ cuenta_id: number; nombre: string; metodo: string }>
  >([])
  const [categorias, setCategorias] = useState<
    Array<{ categoria_id: number; nombre: string }>
  >([])
  const [detalle, setDetalle] = useState<MovimientoHistorial | null>(null)
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [hoy] = useState(() => hoyLocal())

  const cargar = useCallback(
    async (aplicados: FiltrosHistorial, offset: number, anexar: boolean) => {
      try {
        const resultado = await buscarMovimientos(aplicados, offset)
        if (!resultado) return
        setMovimientos((previos) =>
          anexar ? [...previos, ...resultado.movimientos] : resultado.movimientos
        )
        setTotal(resultado.total)
      } finally {
        setCargando(false)
        setCargandoMas(false)
      }
    },
    []
  )

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

  const limpiar = () => {
    setFiltros(FILTROS_HISTORIAL_VACIOS)
    setFiltrosAplicados(FILTROS_HISTORIAL_VACIOS)
    setCargando(true)
    cargar(FILTROS_HISTORIAL_VACIOS, 0, false)
  }

  const abrirDetalle = async (id: number) => {
    setDetalle(null)
    setDetalleAbierto(true)
    setCargandoDetalle(true)
    try {
      const detalleMovimiento = await buscarDetalleMovimiento(id)
      setDetalle(detalleMovimiento)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const cerrarDetalle = () => {
    setDetalleAbierto(false)
    setDetalle(null)
    setCargandoDetalle(false)
  }

  return (
    <main className="min-h-dvh bg-surface-muted">
      <div className="mx-auto max-w-4xl px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-6">
        <header className="flex select-none items-center justify-between gap-2">
          <Link href="/" aria-label="Ir a Inicio" className="inline-flex">
            <FynzLogo height={26} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LogoutButton />
          </div>
        </header>

        <div className="sticky top-[env(safe-area-inset-top)] z-30 -mx-4 mt-4 select-none border-b border-line/60 bg-surface/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6">
          <Button asChild variant="secondary" size="sm">
            <Link href="/">
              <ArrowLeft className="size-4" aria-hidden />
              Volver a Inicio
            </Link>
          </Button>
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">
            Historial de movimientos
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Consulta, filtra y revisa el detalle de cada operación.
          </p>
        </div>

        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between gap-2 p-5 pb-3">
            <h2 className="text-base font-semibold text-fg">Filtros</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={limpiar}
              className="text-fg-muted hover:text-fg"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Limpiar
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Desde">
                <Input
                  type="date"
                  value={filtros.desde ?? ''}
                  onChange={(e) =>
                    setFiltros((f) => ({
                      ...f,
                      desde: e.target.value || null,
                    }))
                  }
                />
              </FormField>
              <FormField label="Hasta">
                <Input
                  type="date"
                  value={filtros.hasta ?? ''}
                  onChange={(e) =>
                    setFiltros((f) => ({
                      ...f,
                      hasta: e.target.value || null,
                    }))
                  }
                />
              </FormField>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-fg-muted">Tipo</span>
                <ChipFiltro
                  grupo="Tipo"
                  activo={filtros.tipo == null}
                  onClick={() => setFiltros((f) => ({ ...f, tipo: null }))}
                >
                  Todos
                </ChipFiltro>
                <ChipFiltro
                  grupo="Tipo"
                  activo={filtros.tipo === 'ingreso'}
                  onClick={() =>
                    setFiltros((f) => ({ ...f, tipo: 'ingreso' }))
                  }
                >
                  Ingresos
                </ChipFiltro>
                <ChipFiltro
                  grupo="Tipo"
                  activo={filtros.tipo === 'egreso'}
                  onClick={() =>
                    setFiltros((f) => ({ ...f, tipo: 'egreso' }))
                  }
                >
                  Egresos
                </ChipFiltro>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-fg-muted">
                  Estado
                </span>
                <ChipFiltro
                  grupo="Estado"
                  activo={filtros.estado == null}
                  onClick={() => setFiltros((f) => ({ ...f, estado: null }))}
                >
                  Todos
                </ChipFiltro>
                <ChipFiltro
                  grupo="Estado"
                  activo={filtros.estado === 'atrasado'}
                  onClick={() =>
                    setFiltros((f) => ({ ...f, estado: 'atrasado' }))
                  }
                >
                  Atrasados
                </ChipFiltro>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Cuenta">
                <Select
                  value={
                    filtros.cuentaId != null ? String(filtros.cuentaId) : ''
                  }
                  onChange={(e) =>
                    setFiltros((f) => ({
                      ...f,
                      cuentaId:
                        e.target.value === '' ? null : Number(e.target.value),
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
              </FormField>

              <FormField label="Operación">
                <Select
                  value={filtros.operacion ?? ''}
                  onChange={(e) =>
                    setFiltros((f) => ({
                      ...f,
                      operacion: e.target.value || null,
                    }))
                  }
                >
                  {OPERACIONES.map((op) => (
                    <option key={op.valor} value={op.valor}>
                      {op.etiqueta}
                    </option>
                  ))}
                </Select>
              </FormField>

              {categorias.length > 0 && (
                <FormField label="Categoría">
                  <Select
                    value={
                      filtros.categoriaId != null
                        ? String(filtros.categoriaId)
                        : ''
                    }
                    onChange={(e) =>
                      setFiltros((f) => ({
                        ...f,
                        categoriaId:
                          e.target.value === ''
                            ? null
                            : Number(e.target.value),
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
                </FormField>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <FormField label="Buscar" className="flex-1">
                <Input
                  placeholder="Descripción..."
                  value={filtros.texto}
                  onChange={(e) =>
                    setFiltros((f) => ({ ...f, texto: e.target.value }))
                  }
                  leadingIcon={<Search className="size-4" />}
                />
              </FormField>
              <Button
                type="button"
                onClick={aplicar}
                className="w-full sm:w-auto"
              >
                Aplicar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="mb-2 mt-4 text-sm text-fg-muted">
          {total} movimiento{total === 1 ? '' : 's'} encontrado
          {total === 1 ? '' : 's'}
        </p>

        {cargando ? (
          <div className="flex justify-center py-12">
            <Spinner label="Cargando movimientos" />
          </div>
        ) : movimientos.length === 0 ? (
          <Alert variant="info" title="Sin movimientos para estos filtros">
            <p>Prueba con otro rango de fechas o limpia los filtros.</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={limpiar}
              className="mt-3"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Limpiar filtros
            </Button>
          </Alert>
        ) : (
          <Card className="divide-y divide-line">
            {movimientos.map((m) => (
              <MovimientoRow
                key={m.transaccion_id}
                movimiento={m}
                categoria={m.categoria_nombre}
                onVer={() => abrirDetalle(m.transaccion_id)}
              />
            ))}
          </Card>
        )}

        {movimientos.length < total && (
          <div className="flex justify-center py-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={cargandoMas}
              onClick={() =>
                cargar(filtrosAplicados, movimientos.length, true)
              }
            >
              {cargandoMas ? (
                <Spinner label="Cargando más movimientos" size="sm" />
              ) : (
                <Link2 className="size-4" aria-hidden />
              )}
              Cargar más ({total - movimientos.length} restantes)
            </Button>
          </div>
        )}

        <Sheet
          open={detalleAbierto}
          title="Detalle del movimiento"
          onClose={cerrarDetalle}
        >
          {cargandoDetalle ? (
            <div className="flex justify-center py-12">
              <Spinner label="Cargando detalle del movimiento" />
            </div>
          ) : detalle ? (
            <MovimientoDetalle movimiento={detalle} hoy={hoy} />
          ) : (
            <Alert
              variant="warning"
              title="No pudimos cargar el detalle"
            >
              Vuelve a intentarlo desde la lista de movimientos.
            </Alert>
          )}
        </Sheet>
      </div>
    </main>
  )
}

function ChipFiltro({
  activo,
  grupo,
  onClick,
  children,
}: {
  activo: boolean
  grupo: string
  onClick: () => void
  children: ReactNode
}) {
  const etiqueta = typeof children === 'string' ? children : ''
  return (
    <Chip
      role="button"
      tabIndex={0}
      aria-pressed={activo}
      aria-label={`${grupo}: ${etiqueta}`}
      interactive
      variant={activo ? 'brand' : 'neutral'}
      onClick={onClick}
      onKeyDown={(evento) => {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault()
          onClick()
        }
      }}
    >
      {children}
    </Chip>
  )
}
