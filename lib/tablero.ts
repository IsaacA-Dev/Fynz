import type { Cuenta, ProximoPago, TipoMovimiento } from './acciones'
import { aCentavos } from './dinero'
import { claveMes, esAnteriorOIgual, hoyLocal, ordenarPorFecha, sumarDias } from './fechas'

export interface FiltrosTablero {
  horizonte: number | null
  metodo: 'todos' | 'liquido' | 'tarjetas'
  meses: 1 | 3 | 6
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

const idsValidos = new Set(WIDGETS.map((widget) => widget.id))

/**
 * Normaliza la selección de widgets activos. Acepta la forma nueva
 * { activos: [...] }, el shape legado { widgets: [{ tipo }] } y un array
 * directo de IDs. Devuelve una lista única y en el orden del catálogo.
 */
export function sanearWidgetsActivos(valor: unknown): string[] {
  const seleccionados = new Set<string>()

  if (Array.isArray(valor)) {
    for (const id of valor) {
      if (typeof id === 'string' && idsValidos.has(id)) seleccionados.add(id)
    }
  } else if (valor && typeof valor === 'object') {
    const crudo = valor as Record<string, unknown>

    if (Array.isArray(crudo.activos)) {
      for (const id of crudo.activos) {
        if (typeof id === 'string' && idsValidos.has(id)) seleccionados.add(id)
      }
    } else if (Array.isArray(crudo.widgets)) {
      for (const item of crudo.widgets) {
        if (!item || typeof item !== 'object') continue
        const tipo = (item as Record<string, unknown>).tipo
        if (typeof tipo === 'string' && idsValidos.has(tipo)) {
          seleccionados.add(tipo)
        }
      }
    }
  }

  return WIDGETS.map((widget) => widget.id).filter((id) =>
    seleccionados.has(id)
  )
}

/** Columnas de la franja de widgets según cuántos estén activos. */
export function columnasWidgets(cantidad: number): 1 | 2 | 3 {
  if (cantidad <= 1) return 1
  if (cantidad === 2) return 2
  if (cantidad === 3) return 3
  if (cantidad === 4) return 2
  return 3
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
