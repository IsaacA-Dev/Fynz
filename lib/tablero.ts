import type { Cuenta, ProximoPago, TipoMovimiento } from './acciones'
import { aCentavos } from './dinero'
import { claveMes, esAnteriorOIgual, hoyLocal, ordenarPorFecha, sumarDias } from './fechas'

export interface FiltrosTablero {
  horizonte: number | null
  metodo: 'todos' | 'liquido' | 'tarjetas'
  meses: 1 | 3 | 6
}

export interface WidgetInstancia {
  key: string
  tipo: string
  filtros: FiltrosTablero
}

export interface ConfigTablero {
  widgets: WidgetInstancia[]
}

export interface WidgetInfo {
  id: string
  nombre: string
}

export const WIDGETS: WidgetInfo[] = [
  { id: 'saldo-por-cuenta', nombre: 'Saldo por cuenta' },
  { id: 'flujo-mensual', nombre: 'Flujo del mes' },
  { id: 'carga-pagos', nombre: 'Carga de pagos' },
  { id: 'gastos-categoria', nombre: 'Gastos por categoría' },
  { id: 'distribucion-saldos', nombre: 'Distribución de saldos' },
  { id: 'promedio-diario', nombre: 'Promedio diario de gasto' },
]

export const FILTROS_DEFECTO: FiltrosTablero = {
  horizonte: null,
  metodo: 'todos',
  meses: 3,
}

export const TABLERO_DEFECTO: ConfigTablero = {
  widgets: [],
}

let contadorWidgets = 0

export function crearWidget(
  tipo: string,
  filtros: Partial<FiltrosTablero> = {}
): WidgetInstancia {
  contadorWidgets += 1
  return {
    key: `${tipo}-${Date.now()}-${contadorWidgets}`,
    tipo,
    filtros: { ...FILTROS_DEFECTO, ...filtros },
  }
}

export function sanearFiltros(f: unknown): FiltrosTablero {
  const crudo = (f ?? {}) as Partial<FiltrosTablero>
  return {
    horizonte:
      crudo.horizonte === 7 || crudo.horizonte === 15 || crudo.horizonte === 30
        ? crudo.horizonte
        : null,
    metodo:
      crudo.metodo === 'liquido' || crudo.metodo === 'tarjetas' || crudo.metodo === 'todos'
        ? crudo.metodo
        : 'todos',
    meses: crudo.meses === 1 || crudo.meses === 3 || crudo.meses === 6 ? crudo.meses : 3,
  }
}

const idsValidos = new Set(WIDGETS.map((w) => w.id))

export function sanearTablero(valor: unknown): ConfigTablero {
  const crudo = (valor ?? {}) as Record<string, unknown>

  let candidatos: { key: unknown; tipo: unknown; filtros: unknown }[] = []

  if (Array.isArray(crudo.widgets)) {
    candidatos = crudo.widgets as { key: unknown; tipo: unknown; filtros: unknown }[]
  } else if (Array.isArray(crudo.activos)) {
    // Migración del shape anterior: { activos, filtros }
    const filtros = sanearFiltros(crudo.filtros)
    const activos = crudo.activos.filter(
      (id): id is string => typeof id === 'string' && idsValidos.has(id)
    )
    candidatos = activos.map((tipo, indice) => ({
      key: `${tipo}-${indice}`,
      tipo,
      filtros,
    }))
  }

  const usadas = new Set<string>()
  const widgets: WidgetInstancia[] = []

  for (const candidato of candidatos) {
    if (!candidato || typeof candidato !== 'object') continue

    const tipo = typeof candidato.tipo === 'string' && idsValidos.has(candidato.tipo)
      ? candidato.tipo
      : null
    if (!tipo) continue

    let key = typeof candidato.key === 'string' && candidato.key.trim() !== ''
      ? candidato.key
      : `${tipo}-${widgets.length}`

    if (usadas.has(key)) {
      let sufijo = widgets.length
      while (usadas.has(`${tipo}-${sufijo}`)) sufijo += 1
      key = `${tipo}-${sufijo}`
    }
    usadas.add(key)

    widgets.push({
      key,
      tipo,
      filtros: sanearFiltros(candidato.filtros),
    })
  }

  return { widgets }
}

export function reordenarLista<T>(lista: T[], desde: number, hasta: number): T[] {
  if (
    desde === hasta ||
    desde < 0 ||
    hasta < 0 ||
    desde >= lista.length ||
    hasta >= lista.length
  ) {
    return lista
  }
  const copia = [...lista]
  const [movido] = copia.splice(desde, 1)
  copia.splice(hasta, 0, movido)
  return copia
}

export interface FlujoMensual {
  mes: string
  ingresos: number
  egresos: number
}

export function agregarFlujoMensual(
  movimientos: { tipo: TipoMovimiento; monto: number; fecha: string }[],
  numeroMeses = 6,
  desde = hoyLocal()
): FlujoMensual[] {
  const claveDesde = claveMes(desde) ?? claveMes(hoyLocal()) ?? ''
  const [anio, mes] = claveDesde.split('-').map((p) => Number.parseInt(p, 10))
  const mesActual = anio * 12 + (mes - 1)

  const claves = new Set<string>()
  for (let i = 0; i < numeroMeses; i++) {
    claves.add(claveDelIndice(mesActual - i))
  }

  const porMes = new Map<string, { ingresos: number; egresos: number }>()
  for (const clave of claves) {
    porMes.set(clave, { ingresos: 0, egresos: 0 })
  }

  for (const movimiento of movimientos) {
    const clave = claveMes(movimiento.fecha)
    if (!clave) continue
    const bucket = porMes.get(clave)
    if (!bucket) continue
    const monto = aCentavos(movimiento.monto)
    if (movimiento.tipo === 'ingreso') {
      bucket.ingresos += monto
    } else {
      bucket.egresos += monto
    }
  }

  return [...porMes.keys()]
    .sort()
    .map((mes) => {
      const valores = porMes.get(mes)!
      return { mes, ingresos: valores.ingresos, egresos: valores.egresos }
    })
}

function claveDelIndice(indice: number): string {
  const anio = Math.floor(indice / 12)
  const mes = (indice % 12) + 1
  return `${anio}-${String(mes).padStart(2, '0')}`
}

export function filtrarCuentasPorMetodo(
  cuentas: Cuenta[],
  metodo: FiltrosTablero['metodo']
): Cuenta[] {
  if (metodo === 'todos') return cuentas
  if (metodo === 'liquido') return cuentas.filter((c) => c.metodo !== 'credito')
  return cuentas.filter((c) => c.metodo === 'credito')
}

export function filtrarPagosPorHorizonte(
  pagos: ProximoPago[],
  horizonte: number | null,
  desde = hoyLocal()
): ProximoPago[] {
  if (horizonte == null) return pagos.filter((p) => !p.pagado)

  const limite = sumarDias(desde, horizonte)

  return pagos.filter(
    (p) => !p.pagado && esAnteriorOIgual(p.fecha_vencimiento, limite)
  )
}

export interface PuntoCarga {
  fecha: string
  acumulado: number
}

export function cargaAcumulada(pagos: ProximoPago[]): PuntoCarga[] {
  const ordenados = ordenarPorFecha(pagos, (p) => p.fecha_vencimiento)

  let acumulado = 0
  return ordenados.map((p) => {
    acumulado += aCentavos(p.monto)
    return { fecha: p.fecha_vencimiento, acumulado }
  })
}

export function pagoMayor(pagos: ProximoPago[]): ProximoPago | null {
  if (pagos.length === 0) return null
  return pagos.reduce((mayor, p) =>
    aCentavos(p.monto) > aCentavos(mayor.monto) ? p : mayor
  )
}
