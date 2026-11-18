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
import { formatearDinero, formatearFecha } from '@/lib/utils/format'
import type { Cuenta, DatosDashboard, ProximoPago, Vista } from '@/lib/acciones'

const LIMITE = 4

// El hero en 1 fila no alcanza cuando el horizonte/información extra crece.
// En esos casos ocupa 2 filas efectivas sin modificar el valor guardado.
function filasEfectivas(bloque: BloqueLayout, datos: DatosDashboard): CantFilas {
  if (bloque.tipo !== 'hero' || bloque.filas !== 1) return bloque.filas
  const horizonteFiltrado =
    datos.horizonte.preferido != null || datos.horizonte.preferidoFecha != null
  if (
    horizonteFiltrado ||
    datos.proximoIngreso ||
    datos.alertas.length > 0 ||
    datos.presionFutura.length > 0
  ) {
    return 2
  }
  return 1
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
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-text)]">Tu panel</p>
        <button
          type="button"
          onClick={() => setEditando((v) => !v)}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full transition-colors ${
            editando
              ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
              : 'bg-[var(--color-surface)] border border-[var(--color-border-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
          }`}
        >
          {editando ? (
            <>
              <Pencil className="w-3.5 h-3.5" />
              Listo
            </>
          ) : (
            <>
              <Settings2 className="w-3.5 h-3.5" />
              Editar panel
            </>
          )}
        </button>
      </div>

      {editando && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-[var(--color-text-muted)]">
            Arrastra para reordenar (o usa el asa con las flechas del teclado). Tu
            configuración se guarda al soltar.
          </p>
          <div className="flex items-center gap-1.5">
            {escritorio && (
              <button
                type="button"
                onClick={() => setDialogoDiseno(true)}
                className="inline-flex items-center gap-1.5 bg-[var(--color-surface)] border border-[var(--color-border-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] text-xs font-medium px-3 py-2 rounded-full transition-colors"
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                Diseño
              </button>
            )}
            <button
              type="button"
              onClick={() => setDialogo(true)}
              className="inline-flex items-center gap-1.5 bg-[var(--color-primary)] text-white text-xs font-medium px-3 py-2 rounded-full hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir
            </button>
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
            <ContenidoBloque bloque={bloque} props={props} verMas={{ verMasCuentas, setVerMasCuentas, verMasPagos, setVerMasPagos }} />
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
  return (
    <section
      data-clave={bloque.id}
      className={`@container relative flex flex-col rounded-2xl border ${
        arrastrando
          ? 'z-40 border-[var(--color-primary)] shadow-2xl ring-1 ring-[var(--color-primary)]'
          : 'border-transparent'
      }`}
      style={{
        gridColumn: escritorio ? `span ${Math.min(bloque.ancho, columnas)}` : undefined,
        gridRow: escritorio ? `span ${Math.min(filasEfectivas, 2)}` : undefined,
      }}
    >
      {editando && (
        <div className="flex items-center gap-1.5 px-1 pb-1.5">
          <button
            type="button"
            onPointerDown={onIniciar}
            onKeyDown={onTeclado}
            aria-label={`Mover ${nombreBloque(bloque.tipo)}`}
            aria-pressed={arrastrando}
            style={{ touchAction: 'none' }}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-border-soft)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] transition-colors cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-[var(--color-text)] flex-1">
            {bloque.tipo === 'widget'
              ? (REGISTRO_WIDGETS[bloque.widget ?? '']?.nombre ?? 'Widget')
              : nombreBloque(bloque.tipo)}
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
            </div>
          )}
          {onFiltros && (
            <button
              type="button"
              onClick={onFiltros}
              aria-label="Configurar filtros"
              className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
          {onQuitar && (
            <button
              type="button"
              onClick={onQuitar}
              aria-label="Quitar bloque"
              className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      {children}
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
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] p-4 shadow-sm flex-1 min-h-[240px] flex flex-col">
          <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2.5 @lg:text-sm">
            {definicion.nombre}
          </h4>
          <div className="flex-1 flex flex-col justify-center">
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

  return (
    <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] p-4 shadow-sm space-y-4 flex-1 flex flex-col">
      <div className="bg-linear-to-br from-[var(--color-banner-start)] to-[var(--color-banner-end)] rounded-2xl p-6 text-white shadow-xl shadow-blue-600/20 flex-1">
        <p className="text-white/85 text-sm font-medium mb-1 @4xl:text-base">Disponible Real</p>
        <h2 className="font-bold tracking-tight break-words text-3xl @lg:text-4xl @4xl:text-5xl">
          <NumeroAnimado valor={datos.disponibleReal} duracion="normal" />
        </h2>
        <p className="text-white/70 text-xs font-medium mt-1.5 @4xl:text-sm">
          Disponible {datos.horizonte.etiqueta}
        </p>
        <p className="text-white/55 text-[11px] font-medium mt-1">
          Datos del {datos.actualizado ? formatearFecha(datos.actualizado) : '—'}
          {datos.desactualizado && <span className="text-amber-200"> · verifica tus saldos</span>}
        </p>
      </div>

      <div>{horizonteControl}</div>

      {datos.alertas.length > 0 && (
        <div className="bg-[var(--color-warning-soft)] border border-[var(--color-warning)]/25 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-[var(--color-warning)]">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-sm font-semibold">
              No alcanza el saldo para tus pagos domiciliados
            </h3>
          </div>
          {datos.alertas.map((a) => (
            <p key={a.pagoId} className="text-xs text-[var(--color-warning)] leading-relaxed">
              <strong>{a.descripcion}</strong> (domiciliado, vence{' '}
              {formatearFecha(a.fechaVencimiento)}): faltan{' '}
              <strong>{formatearDinero(a.faltante)}</strong> para cubrirlo en {a.cuentaNombre}.
            </p>
          ))}
        </div>
      )}

      {datos.presionFutura.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Presión futura</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              después del {formatearFecha(datos.horizonte.fechaLimite)}
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            No se descuentan del Disponible Real, pero tenlos presentes.
          </p>
          {datos.presionFutura.slice(0, 5).map((pago) => (
            <div key={pago.proximo_pago_id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-[var(--color-text-muted)] truncate">
                {pago.descripcion} · {formatearFecha(pago.fecha_vencimiento)}
              </span>
              <span className="text-[var(--color-text)] font-medium shrink-0">
                {formatearDinero(pago.monto)}
              </span>
            </div>
          ))}
          {datos.presionFutura.length > 5 && (
            <p className="text-xs text-[var(--color-text-muted)]">
              +{datos.presionFutura.length - 5} pagos más
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function EstadisticasBloque({ props }: { props: PanelLayoutProps }) {
  const { datos } = props
  return (
    <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] p-4 shadow-sm flex-1 flex flex-col">
      <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2.5 @lg:text-sm">Resumen</h4>
      <div className="grid grid-cols-2 gap-4 flex-1 place-content-center">
        <div>
          <p className="text-[var(--color-text-muted)] text-xs font-medium mb-1 @lg:text-sm">Dinero Líquido</p>
          <p className="text-xl font-semibold text-[var(--color-text)] @lg:text-2xl @4xl:text-3xl">
            {formatearDinero(datos.dineroLiquido)}
          </p>
        </div>
        <div>
          <p className="text-[var(--color-text-muted)] text-xs font-medium mb-1 @lg:text-sm">Pagos del horizonte</p>
          <p className="text-xl font-semibold text-[var(--color-danger)] @lg:text-2xl @4xl:text-3xl">
            -{formatearDinero(datos.totalPagos)}
          </p>
        </div>
      </div>
    </section>
  )
}

function AccionesBloque({ props }: { props: PanelLayoutProps }) {
  const { onNuevoGasto, onNuevoIngreso, onTransferir } = props
  return (
    <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] p-4 shadow-sm flex-1 flex flex-col">
      <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2.5 @lg:text-sm">Acciones rápidas</h4>
      <div className="grid grid-cols-3 gap-3 flex-1">
        <button
          onClick={onNuevoGasto}
          className="bg-[var(--color-surface)] rounded-2xl p-4 @lg:p-5 shadow-sm border border-[var(--color-border-soft)] flex flex-col items-center gap-2 hover:bg-[var(--color-background)] transition-colors"
        >
          <span className="text-[var(--color-text-muted)]">
            <ArrowUpRight className="w-5 h-5 @lg:w-6 @lg:h-6" />
          </span>
          <span className="text-xs font-medium text-[var(--color-text)] @lg:text-sm">Gasto</span>
        </button>
        <button
          onClick={onNuevoIngreso}
          className="bg-[var(--color-surface)] rounded-2xl p-4 @lg:p-5 shadow-sm border border-[var(--color-border-soft)] flex flex-col items-center gap-2 hover:bg-[var(--color-background)] transition-colors"
        >
          <span className="text-[var(--color-success)]">
            <ArrowDownLeft className="w-5 h-5 @lg:w-6 @lg:h-6" />
          </span>
          <span className="text-xs font-medium text-[var(--color-text)] @lg:text-sm">Ingreso</span>
        </button>
        <button
          onClick={onTransferir}
          className="bg-[var(--color-surface)] rounded-2xl p-4 @lg:p-5 shadow-sm border border-[var(--color-border-soft)] flex flex-col items-center gap-2 hover:bg-[var(--color-background)] transition-colors"
        >
          <span className="text-[var(--color-primary)]">
            <ArrowLeftRight className="w-5 h-5 @lg:w-6 @lg:h-6" />
          </span>
          <span className="text-xs font-medium text-[var(--color-text)] @lg:text-sm">Transferir</span>
        </button>
      </div>
    </section>
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
    <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] p-4 shadow-sm space-y-3 flex-1 flex flex-col">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[var(--color-text)] @lg:text-sm">Cuentas</h4>
        <button
          onClick={onNuevaCuenta}
          aria-label="Nueva cuenta"
          className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {datos.cuentas.length === 0 ? (
        <div className="py-4 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            Aún no tienes cuentas. Agrega la primera para empezar.
          </p>
          <button
            onClick={onNuevaCuenta}
            className="bg-[var(--color-primary)] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            + Nueva Cuenta
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border-soft)] flex-1">
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
        <button
          onClick={() => verMas.setVerMasCuentas((v) => !v)}
          className="w-full text-xs font-medium text-[var(--color-primary)] py-1 hover:opacity-80 transition-opacity mt-auto"
        >
          {verMas.verMasCuentas ? 'Ver menos' : `Ver más (${datos.cuentas.length - LIMITE})`}
        </button>
      )}
    </section>
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
    <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] p-4 shadow-sm space-y-3 flex-1 flex flex-col">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[var(--color-text)] @lg:text-sm">Próximos pagos</h4>
        <button
          onClick={onNuevoPago}
          aria-label="Nuevo pago"
          className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center hover:bg-[var(--color-primary-hover)] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {datos.pagos.length === 0 ? (
        <div className="py-4 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            No hay pagos pendientes por el momento.
          </p>
          <button
            onClick={onNuevoPago}
            className="bg-[var(--color-primary)] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            + Nuevo Pago
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-border-soft)] flex-1">
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
        <button
          onClick={() => verMas.setVerMasPagos((v) => !v)}
          className="w-full text-xs font-medium text-[var(--color-primary)] py-1 hover:opacity-80 transition-opacity mt-auto"
        >
          {verMas.verMasPagos ? 'Ver menos' : `Ver más (${datos.pagos.length - LIMITE})`}
        </button>
      )}
    </section>
  )
}

function HistorialBloque({ props }: { props: PanelLayoutProps }) {
  const { datos } = props
  return (
    <section className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border-soft)] p-4 shadow-sm space-y-3 flex-1 flex flex-col">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[var(--color-text)] @lg:text-sm">Historial reciente</h4>
        <Link
          href="/historial"
          className="text-xs font-medium text-[var(--color-primary)] hover:opacity-80 transition-opacity"
        >
          Ver todo
        </Link>
      </div>

      {datos.movimientos.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-muted)] flex-1 flex items-center justify-center">
          Tus movimientos aparecerán aquí.
        </p>
      ) : (
        <div className="divide-y divide-[var(--color-border-soft)] -mx-5 px-5 flex-1">
          {datos.movimientos.slice(0, LIMITE).map((t) => (
            <MovimientoRow key={t.transaccion_id} movimiento={t} />
          ))}
        </div>
      )}
    </section>
  )
}
