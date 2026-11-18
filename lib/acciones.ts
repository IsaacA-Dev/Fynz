import type { AlertaDomiciliado as Alerta } from './logica-financiera'
import type { Horizonte } from './horizonte'
import type { ConfiguracionLayout } from './layout'
import type { FlujoMensual, ConfigTablero } from './tablero'

export type { Horizonte, TipoHorizonte } from './horizonte'
export type { BloqueLayout, ConfiguracionLayout, TipoBloque } from './layout'

export type Metodo = 'debito' | 'credito' | 'efectivo'
export type TipoMovimiento = 'ingreso' | 'egreso'
export type Vista = 'movil' | 'escritorio'

export const METODO_LABELS: Record<Metodo, string> = {
  debito: 'Débito',
  credito: 'Crédito',
  efectivo: 'Efectivo',
}

export interface Cuenta {
  cuenta_id: number
  nombre: string
  metodo: Metodo
  balance_inicial: number
  saldo: number
  dia_corte: number | null
  dia_pago: number | null
  limite: number | null
}

export interface ProximoPago {
  proximo_pago_id: number
  descripcion: string
  monto: number
  fecha_vencimiento: string
  pagado: boolean
  domiciliado: boolean
  cuenta_id: number | null
  cuenta_nombre: string | null
  recurrente: boolean
  dia_cobro: number | null
  es_tarjeta: boolean
  minimo?: number | null
}

export interface Transaccion {
  transaccion_id: number
  cuenta_id: number
  tipo: TipoMovimiento
  monto: number
  fecha: string
  descripcion: string | null
  operacion?: string | null
  categoria_id?: number | null
  pago_id?: number | null
  relacionada_id?: number | null
}

export type { Alerta }

export interface DatosDashboard {
  cuentas: Cuenta[]
  pagos: ProximoPago[]
  movimientos: (Transaccion & { cuenta_nombre: string })[]
  alertas: Alerta[]
  vista: Vista
  dineroLiquido: number
  totalPagos: number
  disponibleReal: number
  horizonte: Horizonte
  presionFutura: ProximoPago[]
  proximoIngreso: string | null
  actualizado: string | null
  desactualizado: boolean
  tablero: ConfigTablero
  layout: ConfiguracionLayout
  categorias: Record<string, string>
  movimientosAnalitica: Array<{
    tipo: TipoMovimiento
    monto: number
    fecha: string
    categoria_id: number | null
  }>
  flujoMensual: FlujoMensual[]
}

export type MovimientoLista = Transaccion & { cuenta_nombre: string }

export interface ConfiguracionUsuario {
  vista: Vista
  tablero: ConfigTablero
}
