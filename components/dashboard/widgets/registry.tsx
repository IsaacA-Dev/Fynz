'use client'

import { BarChart3, CalendarClock, PieChart, TrendingDown, Wallet, type LucideIcon } from 'lucide-react'
import type { DatosDashboard } from '@/lib/acciones'
import type { FiltrosTablero } from '@/lib/tablero'
import { WidgetSaldoPorCuenta } from './widget-saldo'
import { WidgetFlujoMensual } from './widget-flujo'
import { WidgetCargaPagos } from './widget-carga'
import { WidgetGastosCategoria } from './widget-gastos-categoria'
import { WidgetDistribucionSaldos } from './widget-distribucion-saldos'
import { WidgetPromedioDiario } from './widget-promedio-diario'

export interface WidgetProps {
  datos: DatosDashboard
  filtros: FiltrosTablero
}

export type FiltroWidget = keyof FiltrosTablero

export interface WidgetDef {
  id: string
  nombre: string
  descripcion: string
  Icon: LucideIcon
  filtrosDisponibles: FiltroWidget[]
  filtrosBase?: Partial<FiltrosTablero>
  Componente: (props: WidgetProps) => React.ReactNode
}

export const REGISTRO_WIDGETS: Record<string, WidgetDef> = {
  'saldo-por-cuenta': {
    id: 'saldo-por-cuenta',
    nombre: 'Saldo por cuenta',
    descripcion: 'Barras con el saldo de cada cuenta: líquido en azul y deuda de tarjeta en rojo.',
    Icon: Wallet,
    filtrosDisponibles: ['metodo'],
    Componente: WidgetSaldoPorCuenta,
  },
  'flujo-mensual': {
    id: 'flujo-mensual',
    nombre: 'Flujo del mes',
    descripcion: 'Ingresos contra gastos por mes en barras.',
    Icon: BarChart3,
    filtrosDisponibles: ['meses'],
    Componente: WidgetFlujoMensual,
  },
  'carga-pagos': {
    id: 'carga-pagos',
    nombre: 'Carga de pagos',
    descripcion: 'Línea acumulada de tus pagos pendientes en el tiempo.',
    Icon: CalendarClock,
    filtrosDisponibles: ['horizonte'],
    filtrosBase: { horizonte: 30 },
    Componente: WidgetCargaPagos,
  },
  'gastos-categoria': {
    id: 'gastos-categoria',
    nombre: 'Gastos por categoría',
    descripcion: 'Dónde se va el dinero: barras por categoría.',
    Icon: PieChart,
    filtrosDisponibles: ['meses'],
    filtrosBase: { meses: 3 },
    Componente: WidgetGastosCategoria,
  },
  'distribucion-saldos': {
    id: 'distribucion-saldos',
    nombre: 'Distribución de saldos',
    descripcion: 'Proporción de tu dinero líquido por cuenta (deuda aparte).',
    Icon: Wallet,
    filtrosDisponibles: ['metodo'],
    Componente: WidgetDistribucionSaldos,
  },
  'promedio-diario': {
    id: 'promedio-diario',
    nombre: 'Promedio diario de gasto',
    descripcion: 'Cuánto gastas por día en promedio y días cubiertos.',
    Icon: TrendingDown,
    filtrosDisponibles: ['meses'],
    filtrosBase: { meses: 1 },
    Componente: WidgetPromedioDiario,
  },
}

export const CATALOGO_WIDGETS = Object.values(REGISTRO_WIDGETS)
