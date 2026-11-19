'use client'

import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  GripVertical,
  LayoutTemplate,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react'
import { CuentaRow } from '@/components/dashboard/rows/cuenta-row'
import { PagoRow } from '@/components/dashboard/rows/pago-row'
import { MovimientoRow } from '@/components/dashboard/rows/movimiento-row'
import { NumeroAnimado } from '@/components/ui/motion/numero-animado'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { REGISTRO_WIDGETS } from '@/components/dashboard/widgets/registry'
import { DialogoCrear } from '@/components/dashboard/widgets/dialogo-crear'
import { DialogoDiseno } from '@/components/dashboard/dialogo-diseno'
import { DialogoFiltros } from '@/components/dashboard/widgets/dialogo-filtros'
import { useReordenar } from '@/components/hooks/use-reordenar'
import { useColumnasPanel } from '@/components/hooks/use-columnas-panel'
import { useToast } from '@/components/ui/toast'
import { guardarLayout } from '@/lib/acciones-servidor'
import {
  aplicarPreset,
  bloquesVisibles,
  crearBloque,
  crearBloqueWidget,
  nombreBloque,
  sanearLayout,
  type BloqueLayout,
  type CantFilas,
  type ConfiguracionLayout,
  type TipoBloque,
} from '@/lib/layout'
import { cn } from '@/lib/utils/cn'
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { Cuenta, DatosDashboard, ProximoPago, Vista } from '@/lib/acciones'

const LIMITE = 4

// El hero tiene altura automática: una fila salvo que existan alertas o
// presión futura, que son los únicos bloques que realmente necesitan espacio.
function filasEfectivas(bloque: BloqueLayout, datos: DatosDashboard): CantFilas {
  if (bloque.tipo !== 'hero') return bloque.filas
  return datos.alertas.length > 0 || datos.presionFutura.length > 0 ? 2 : 1
}

interface PanelLayoutProps {
  datos: DatosDashboard
  hoy: string
  modo: Vista
  horizonteControl: ReactNode
  onNuevoGasto: () => void
  onNuevoIngreso: () => void
  onTransferir: () => void
  onNuevaCuenta: () => void
  onEditarCuenta: (cuenta: Cuenta) => void
  onEliminarCuenta: (cuenta: Cuenta) => void
  onNuevoPago: () => void
  onEditarPago: (pago: ProximoPago) => void
  onEliminarPago: (pago: ProximoPago) => void
  onPagarPago: (pago: ProximoPago) => void
  onAdelantarPago: (pago: ProximoPago) => void
}

export function PanelLayout(props: PanelLayoutProps) {
  const { datos, modo } = props
  const escritorio = modo === 'escritorio'
  const columnas = useColumnasPanel()

  const [layout, setLayout] = useState<ConfiguracionLayout>(() =>
    sanearLayout(datos.layout)
  )
  const [editando, setEditando] = useState(false)
  const [dialogo, setDialogo] = useState(false)
  const [dialogoDiseno, setDialogoDiseno] = useState(false)
  const [widgetFiltros, setWidgetFiltros] = useState<BloqueLayout | null>(null)
  const [verMasCuentas, setVerMasCuentas] = useState(false)
  const [verMasPagos, setVerMasPagos] = useState(false)
  const [listaDrag, setListaDrag] = useState<BloqueLayout[] | null>(null)
  const { addToast } = useToast()

  const listaVisibles = listaDrag ?? bloquesVisibles(layout, modo)

  const persistir = (nuevo: ConfiguracionLayout) => {
    setLayout(nuevo)
    setListaDrag(null)
    guardarLayout(nuevo).then((resultado) => {
      if (!resultado.ok) addToast(resultado.error, 'error')
    })
  }

  const itemsDrag = useMemo(
    () => listaVisibles.map((b) => ({ ...b, key: b.id })),
    [listaVisibles]
  )

  const sinKey = (items: Array<BloqueLayout & { key: string }>): BloqueLayout[] =>
    items.map(({ key, ...b }) => {
      void key
      return b as BloqueLayout
    })

  const { listaRef, arrastrandoKey, iniciar, manejarTeclado } = useReordenar<
    BloqueLayout & { key: string }
  >({
    items: itemsDrag,
    columnas: escritorio ? columnas : 1,
    alReordenar: (items) => setListaDrag(sinKey(items)),
    alSoltar: (items) => {
      const limpios = sinKey(items)
      setListaDrag(null)
      const actuales = bloquesVisibles(layout, modo)
      const sinCambios =
        limpios.length === actuales.length &&
        limpios.every((bloque, indice) => bloque.id === actuales[indice].id)
      if (sinCambios) return
      const mapa = new Map(limpios.map((b) => [b.id, b]))
      const restantes = layout.bloques.filter((b) => !mapa.has(b.id))
      persistir({ ...layout, bloques: [...limpios, ...restantes] })
    },
  })

  const quitar = (bloque: BloqueLayout) => {
    persistir({ ...layout, bloques: layout.bloques.filter((b) => b.id !== bloque.id) })
  }

  const cambiarAncho = (bloque: BloqueLayout, ancho: 1 | 2 | 3 | 4) => {
    persistir({
      ...layout,
      bloques: layout.bloques.map((b) => (b.id === bloque.id ? { ...b, ancho } : b)),
    })
  }

  const cambiarFilas = (bloque: BloqueLayout, filas: 1 | 2) => {
    persistir({
      ...layout,
      bloques: layout.bloques.map((b) => (b.id === bloque.id ? { ...b, filas } : b)),
    })
  }

  const añadirWidget = (tipo: string) => {
    persistir({ ...layout, bloques: [...layout.bloques, crearBloqueWidget(tipo)] })
    setDialogo(false)
  }

  const añadirBloque = (tipo: TipoBloque) => {
    const bloque = crearBloque(tipo)
    if (!bloque) return
    persistir({ ...layout, bloques: [...layout.bloques, bloque] })
    setDialogo(false)
  }

  const aplicarDiseno = (presetId: string) => {
    persistir(aplicarPreset(layout, presetId))
    setDialogoDiseno(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-fg-muted">Tu panel</p>
        <Button
          type="button"
          variant={editando ? 'solid' : 'secondary'}
          size="sm"
          onClick={() => setEditando((v) => !v)}
          aria-pressed={editando}
        >
          {editando ? (
            <>
              <Pencil className="size-3.5" aria-hidden />
              Listo
            </>
          ) : (
            <>
              <Settings2 className="size-3.5" aria-hidden />
              Editar panel
            </>
          )}
        </Button>
      </div>

      {editando && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-xl text-xs leading-relaxed text-fg-muted">
            Arrastra para reordenar (o usa el asa con las flechas del teclado).
            Tu configuración se guarda al soltar.
          </p>
          <div className="flex items-center gap-2">
            {escritorio && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDialogoDiseno(true)}
              >
                <LayoutTemplate className="size-3.5" aria-hidden />
                Diseño
              </Button>
            )}
            <Button type="button" size="sm" onClick={() => setDialogo(true)}>
              <Plus className="size-3.5" aria-hidden />
              Añadir
            </Button>
          </div>
        </div>
      )}

      <div
        ref={listaRef}
        className={`grid gap-4 ${
          escritorio
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 md:auto-rows-[minmax(240px,auto)] md:grid-flow-dense'
            : 'grid-cols-1'
        }`}
      >
        {listaVisibles.map((bloque) => (
          <BloqueShell
            key={bloque.id}
            bloque={bloque}
            editando={editando}
            escritorio={escritorio}
            columnas={columnas}
            arrastrando={arrastrandoKey === bloque.id}
            onIniciar={(e) => iniciar(e, bloque.id)}
            onTeclado={(e) => manejarTeclado(e, bloque.id)}
            onQuitar={bloque.tipo === 'hero' ? undefined : () => quitar(bloque)}
            onFiltros={bloque.tipo === 'widget' ? () => setWidgetFiltros(bloque) : undefined}
            onCambiarAncho={(ancho) => cambiarAncho(bloque, ancho)}
            onCambiarFilas={(filas) => cambiarFilas(bloque, filas)}
            filasEfectivas={filasEfectivas(bloque, datos)}
          >
            <ContenidoBloque
              bloque={bloque}
              props={props}
              verMas={{
                verMasCuentas,
                setVerMasCuentas,
                verMasPagos,
                setVerMasPagos,
              }}
            />
          </BloqueShell>
        ))}
      </div>

      <DialogoCrear
        open={dialogo}
        datos={datos}
        onAñadir={añadirWidget}
        onAñadirBloque={añadirBloque}
        onCerrar={() => setDialogo(false)}
      />

      <DialogoDiseno
        open={dialogoDiseno}
        layout={layout}
        onAplicar={aplicarDiseno}
        onCerrar={() => setDialogoDiseno(false)}
      />

      <DialogoFiltros
        open={widgetFiltros !== null}
        tipo={widgetFiltros?.widget ?? ''}
        filtros={widgetFiltros?.filtros ?? { horizonte: null, metodo: 'todos', meses: 3 }}
        onGuardar={(filtros) => {
          if (widgetFiltros) {
            persistir({
              ...layout,
              bloques: layout.bloques.map((b) =>
                b.id === widgetFiltros.id ? { ...b, filtros } : b
              ),
            })
          }
        }}
        onCerrar={() => setWidgetFiltros(null)}
      />
    </div>
  )
}

function BloqueShell({
  bloque,
  editando,
  escritorio,
  columnas,
  arrastrando,
  filasEfectivas,
  onIniciar,
  onTeclado,
  onQuitar,
  onFiltros,
  onCambiarAncho,
  onCambiarFilas,
  children,
}: {
  bloque: BloqueLayout
  editando: boolean
  escritorio: boolean
  columnas: number
  arrastrando: boolean
  filasEfectivas: CantFilas
  onIniciar: (e: React.PointerEvent<HTMLButtonElement>) => void
  onTeclado: (e: React.KeyboardEvent<HTMLButtonElement>) => void
  onQuitar?: () => void
  onFiltros?: () => void
  onCambiarAncho: (ancho: 1 | 2 | 3 | 4) => void
  onCambiarFilas: (filas: 1 | 2) => void
  children: ReactNode
}) {
  const etiqueta =
    bloque.tipo === 'widget'
      ? (REGISTRO_WIDGETS[bloque.widget ?? '']?.nombre ?? 'Widget')
      : nombreBloque(bloque.tipo)

  return (
    <section
      data-clave={bloque.id}
      className={cn(
        '@container relative flex min-h-0 flex-col',
        arrastrando && 'z-40'
      )}
      style={{
        gridColumn: escritorio ? `span ${Math.min(bloque.ancho, columnas)}` : undefined,
        gridRow: escritorio ? `span ${Math.min(filasEfectivas, 2)}` : undefined,
      }}
    >
      <Card
        className={cn(
          'flex flex-1 flex-col overflow-hidden',
          editando && 'border-brand/30',
          arrastrando && 'ring-2 ring-brand shadow-lift'
        )}
      >
        {editando && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-surface-muted/60 px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onPointerDown={onIniciar}
              onKeyDown={onTeclado}
              aria-label={`Mover ${etiqueta}`}
              aria-pressed={arrastrando}
              style={{ touchAction: 'none' }}
              className="size-7 cursor-grab text-fg-muted active:cursor-grabbing"
            >
              <GripVertical className="size-4" aria-hidden />
            </Button>
            <span className="flex-1 truncate text-xs font-medium text-fg">
              {etiqueta}
            </span>
            {escritorio && (
              <div className="flex items-center gap-1">
                <Select
                  value={bloque.ancho}
                  onChange={(e) =>
                    onCambiarAncho(Number(e.target.value) as 1 | 2 | 3 | 4)
                  }
                  aria-label="Columnas del bloque"
                  className="h-7 w-auto rounded-full pl-2 pr-7 text-xs"
                >
                  <option value={1}>1 col</option>
                  <option value={2}>2 cols</option>
                  <option value={3}>3 cols</option>
                  <option value={4}>4 cols</option>
                </Select>
                {bloque.tipo !== 'hero' && (
                  <Select
                    value={bloque.filas}
                    onChange={(e) =>
                      onCambiarFilas(Number(e.target.value) as 1 | 2)
                    }
                    aria-label="Filas del bloque"
                    className="h-7 w-auto rounded-full pl-2 pr-7 text-xs"
                  >
                    <option value={1}>1 fila</option>
                    <option value={2}>2 filas</option>
                  </Select>
                )}
              </div>
            )}
            {onFiltros && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onFiltros}
                aria-label="Configurar filtros"
                className="size-7 text-fg-muted hover:bg-brand-soft hover:text-brand"
              >
                <Settings2 className="size-4" aria-hidden />
              </Button>
            )}
            {onQuitar && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onQuitar}
                aria-label="Quitar bloque"
                className="size-7 text-fg-muted hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        )}
        <div className="flex flex-1 flex-col p-4">{children}</div>
      </Card>
    </section>
  )
}

function ContenidoBloque({
  bloque,
  props,
  verMas,
}: {
  bloque: BloqueLayout
  props: PanelLayoutProps
  verMas: {
    verMasCuentas: boolean
    setVerMasCuentas: Dispatch<SetStateAction<boolean>>
    verMasPagos: boolean
    setVerMasPagos: Dispatch<SetStateAction<boolean>>
  }
}) {
  switch (bloque.tipo) {
    case 'hero':
      return <HeroBloque props={props} />
    case 'estadisticas':
      return <EstadisticasBloque props={props} />
    case 'acciones':
      return <AccionesBloque props={props} />
    case 'cuentas':
      return <CuentasBloque props={props} verMas={verMas} />
    case 'pagos':
      return <PagosBloque props={props} verMas={verMas} />
    case 'historial':
      return <HistorialBloque props={props} />
    case 'widget': {
      const definicion = REGISTRO_WIDGETS[bloque.widget ?? '']
      if (!definicion) return null
      const Contenido = definicion.Componente
      return (
        <div className="flex flex-1 flex-col">
          <h4 className="text-eyebrow uppercase text-fg-subtle">
            {definicion.nombre}
          </h4>
          <div className="flex flex-1 flex-col justify-center pt-3">
            <Contenido datos={props.datos} filtros={bloque.filtros} />
          </div>
        </div>
      )
    }
    default:
      return null
  }
}

function HeroBloque({ props }: { props: PanelLayoutProps }) {
  const { datos, horizonteControl } = props
  const sinActividad =
    datos.cuentas.length === 0 &&
    datos.movimientos.length === 0 &&
    datos.pagos.length === 0

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card
        variant="soft"
        className="rounded-panel bg-brand-softer p-5 @lg:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-eyebrow uppercase text-brand">Disponible Real</p>
            <p className="mt-1 break-words text-3xl font-semibold tracking-tight text-fg @lg:text-4xl @4xl:text-5xl">
              <NumeroAnimado valor={datos.disponibleReal} duracion="normal" />
            </p>
            <p className="mt-1.5 text-sm text-fg-muted">
              Disponible {datos.horizonte.etiqueta}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-right">
            <Badge variant="neutral" size="sm">
              {datos.actualizado
                ? `Datos del ${formatearFecha(datos.actualizado)}`
                : sinActividad
                  ? 'Empieza aquí'
                  : 'Sin verificar'}
            </Badge>
            {datos.desactualizado && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-warning">
                <AlertTriangle className="size-3.5" aria-hidden />
                Verifica tus saldos
              </span>
            )}
          </div>
        </div>
      </Card>

      <div>{horizonteControl}</div>

      {datos.alertas.length > 0 && (
        <Alert
          variant="warning"
          title="No alcanza el saldo para tus pagos domiciliados"
        >
          <div className="space-y-2">
            {datos.alertas.map((a) => (
              <p key={a.pagoId}>
                <strong>{a.descripcion}</strong> (domiciliado, vence{' '}
                {formatearFecha(a.fechaVencimiento)}): faltan{' '}
                <strong>{formatearDinero(a.faltante)}</strong> para cubrirlo en{' '}
                {a.cuentaNombre}.
              </p>
            ))}
          </div>
        </Alert>
      )}

      {datos.presionFutura.length > 0 && (
        <div className="rounded-panel bg-surface-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-eyebrow uppercase text-fg-subtle">
              Presión futura
            </h3>
            <p className="text-xs text-fg-muted">
              después del {formatearFecha(datos.horizonte.fechaLimite)}
            </p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-fg-muted">
            No se descuentan del Disponible Real, pero tenlos presentes.
          </p>
          <div className="mt-3 divide-y divide-line">
            {datos.presionFutura.slice(0, 5).map((pago) => (
              <div
                key={pago.proximo_pago_id}
                className="flex items-center justify-between gap-2 py-1.5 text-sm"
              >
                <span className="truncate text-fg-muted">
                  {pago.descripcion} · {formatearFecha(pago.fecha_vencimiento)}
                </span>
                <span className="shrink-0 font-medium text-fg">
                  {formatearDinero(pago.monto)}
                </span>
              </div>
            ))}
          </div>
          {datos.presionFutura.length > 5 && (
            <p className="mt-2 text-xs text-fg-muted">
              +{datos.presionFutura.length - 5} pagos más
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function EstadisticasBloque({ props }: { props: PanelLayoutProps }) {
  const { datos } = props
  return (
    <div className="flex flex-1 flex-col gap-3">
      <h4 className="text-eyebrow uppercase text-fg-subtle">Resumen</h4>
      <div className="grid flex-1 grid-cols-2 place-content-center gap-4">
        <div>
          <p className="mb-1 text-xs font-medium text-fg-muted @lg:text-sm">
            Dinero líquido
          </p>
          <p className="text-xl font-semibold text-fg @lg:text-2xl @4xl:text-3xl">
            {formatearDinero(datos.dineroLiquido)}
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-fg-muted @lg:text-sm">
            Pagos del horizonte
          </p>
          <p className="text-xl font-semibold text-fg @lg:text-2xl @4xl:text-3xl">
            -{formatearDinero(datos.totalPagos)}
          </p>
        </div>
      </div>
    </div>
  )
}

function AccionesBloque({ props }: { props: PanelLayoutProps }) {
  const { onNuevoGasto, onNuevoIngreso, onTransferir } = props
  return (
    <div className="flex flex-1 flex-col gap-3">
      <h4 className="text-eyebrow uppercase text-fg-subtle">
        Acciones rápidas
      </h4>
      <div className="grid flex-1 grid-cols-3 gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onNuevoGasto}
          aria-label="Registrar gasto"
          className="h-auto flex-col gap-2 py-4"
        >
          <ArrowUpRight className="size-5 text-fg-muted" aria-hidden />
          <span className="text-xs font-medium">Gasto</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onNuevoIngreso}
          aria-label="Registrar ingreso"
          className="h-auto flex-col gap-2 py-4"
        >
          <ArrowDownLeft className="size-5 text-success" aria-hidden />
          <span className="text-xs font-medium">Ingreso</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onTransferir}
          aria-label="Transferir entre cuentas"
          className="h-auto flex-col gap-2 py-4"
        >
          <ArrowLeftRight className="size-5 text-brand" aria-hidden />
          <span className="text-xs font-medium">Transferir</span>
        </Button>
      </div>
    </div>
  )
}

function CuentasBloque({
  props,
  verMas,
}: {
  props: PanelLayoutProps
  verMas: { verMasCuentas: boolean; setVerMasCuentas: Dispatch<SetStateAction<boolean>> }
}) {
  const { datos, onNuevaCuenta, onEditarCuenta, onEliminarCuenta } = props
  const mostradas = verMas.verMasCuentas
    ? datos.cuentas
    : datos.cuentas.slice(0, LIMITE)

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-eyebrow uppercase text-fg-subtle">Cuentas</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onNuevaCuenta}
          aria-label="Nueva cuenta"
          className="size-8 text-brand hover:bg-brand-soft"
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </div>

      {datos.cuentas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4 text-center">
          <p className="text-sm text-fg-muted">
            Aún no tienes cuentas. Agrega la primera para empezar.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={onNuevaCuenta}>
            <Plus className="size-3.5" aria-hidden />
            Nueva cuenta
          </Button>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-line">
          {mostradas.map((c) => (
            <CuentaRow
              key={c.cuenta_id}
              cuenta={c}
              onEditar={() => onEditarCuenta(c)}
              onEliminar={() => onEliminarCuenta(c)}
            />
          ))}
        </div>
      )}

      {datos.cuentas.length > LIMITE && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => verMas.setVerMasCuentas((v) => !v)}
          className="mt-auto w-full"
        >
          {verMas.verMasCuentas ? 'Ver menos' : `Ver más (${datos.cuentas.length - LIMITE})`}
        </Button>
      )}
    </div>
  )
}

function PagosBloque({
  props,
  verMas,
}: {
  props: PanelLayoutProps
  verMas: { verMasPagos: boolean; setVerMasPagos: Dispatch<SetStateAction<boolean>> }
}) {
  const {
    datos,
    hoy,
    modo,
    onNuevoPago,
    onEditarPago,
    onEliminarPago,
    onPagarPago,
    onAdelantarPago,
  } = props
  const mostrados = verMas.verMasPagos ? datos.pagos : datos.pagos.slice(0, LIMITE)

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-eyebrow uppercase text-fg-subtle">Próximos pagos</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onNuevoPago}
          aria-label="Nuevo pago"
          className="size-8 text-brand hover:bg-brand-soft"
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </div>

      {datos.pagos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4 text-center">
          <p className="text-sm text-fg-muted">
            No hay pagos pendientes por el momento.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={onNuevoPago}>
            <Plus className="size-3.5" aria-hidden />
            Nuevo pago
          </Button>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-line">
          {mostrados.map((p) => (
            <PagoRow
              key={p.proximo_pago_id}
              pago={p}
              hoy={hoy}
              modo={modo}
              onEditar={() => onEditarPago(p)}
              onEliminar={() => onEliminarPago(p)}
              onPagar={() => onPagarPago(p)}
              onAdelantar={
                p.recurrente && !p.es_tarjeta ? () => onAdelantarPago(p) : undefined
              }
            />
          ))}
        </div>
      )}

      {datos.pagos.length > LIMITE && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => verMas.setVerMasPagos((v) => !v)}
          className="mt-auto w-full"
        >
          {verMas.verMasPagos ? 'Ver menos' : `Ver más (${datos.pagos.length - LIMITE})`}
        </Button>
      )}
    </div>
  )
}

function HistorialBloque({ props }: { props: PanelLayoutProps }) {
  const { datos } = props
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-eyebrow uppercase text-fg-subtle">
          Historial reciente
        </h4>
        <Link
          href="/historial"
          className="text-xs font-medium text-brand transition-colors hover:text-brand-hover"
        >
          Ver todo
        </Link>
      </div>

      {datos.movimientos.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-4 text-center text-sm text-fg-muted">
          Tus movimientos aparecerán aquí.
        </p>
      ) : (
        <div className="flex-1 divide-y divide-line">
          {datos.movimientos.slice(0, LIMITE).map((t) => (
            <MovimientoRow key={t.transaccion_id} movimiento={t} />
          ))}
        </div>
      )}
    </div>
  )
}
