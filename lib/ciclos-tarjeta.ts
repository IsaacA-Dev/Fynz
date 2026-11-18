import type { TipoMovimiento } from './acciones'
import { aCentavos } from './dinero'
import {
  aDiaNumero,
  desdeFecha,
  descomponer,
  esAtrasado,
  fechaClamp,
  formatearFecha,
  ordenarPorFecha,
} from './fechas'

export interface TarjetaCiclos {
  diaCorte: number | null
  diaPago: number | null
  balanceInicial: number
  fechaInicio: string
  nombre: string
}

export interface MovimientoTarjeta {
  tipo: TipoMovimiento
  monto: number
  fecha: string
}

export interface DatosGuardadosCiclo {
  objetivoManual: number | null
  minimo: number
}

export interface CicloCalculado {
  fechaCorte: string
  fechaPago: string
  compras: number
  pagos: number
  objetivo: number
  objetivoReal: number
  objetivoManual: number | null
  minimo: number
  estado: 'abierto' | 'cerrado'
}

function generarCortes(
  diaCorte: number,
  fechaBase: string,
  hoy: string
): string[] {
  const base = descomponer(fechaBase)
  if (!base) return []

  const cortes: string[] = []
  let anio = base.anio
  let mes = base.mes

  for (;;) {
    const corte = fechaClamp(anio, mes, diaCorte)
    const texto = desdeFecha(corte.anio, corte.mes, corte.dia)
    cortes.push(texto)
    if (aDiaNumero(texto) > aDiaNumero(hoy)) break
    mes += 1
    if (mes === 13) {
      mes = 1
      anio += 1
    }
  }

  return cortes
}

function fechaPagoDeCorte(
  fechaCorte: string,
  diaCorte: number,
  diaPago: number
): string {
  const partes = descomponer(fechaCorte)
  if (!partes) return fechaCorte
  const offset = diaPago > diaCorte ? 0 : 1
  let mes = partes.mes + offset
  let anio = partes.anio
  if (mes === 13) {
    mes = 1
    anio += 1
  }
  const pago = fechaClamp(anio, mes, diaPago)
  return desdeFecha(pago.anio, pago.mes, pago.dia)
}

function corteParaCompra(cortes: string[], fecha: string): string | null {
  const dia = aDiaNumero(fecha)
  for (const corte of cortes) {
    if (aDiaNumero(corte) > dia) return corte
  }
  return cortes[cortes.length - 1] ?? null
}

export function ciclosDeTarjeta(
  tarjeta: TarjetaCiclos,
  movimientos: MovimientoTarjeta[],
  hoy: string,
  guardados?: Map<string, DatosGuardadosCiclo>
): CicloCalculado[] {
  if (tarjeta.diaCorte == null || tarjeta.diaPago == null) return []

  const cortes = generarCortes(tarjeta.diaCorte, tarjeta.fechaInicio, hoy)
  if (cortes.length === 0) return []

  const porCorte = new Map<string, { compras: number; pagos: number }>()
  for (const corte of cortes) {
    porCorte.set(corte, { compras: 0, pagos: 0 })
  }

  const balanceInicial = aCentavos(tarjeta.balanceInicial)
  if (balanceInicial > 0) {
    const corte = corteParaCompra(cortes, tarjeta.fechaInicio)
    if (corte) porCorte.get(corte)!.compras += balanceInicial
  }

  const compras = movimientos.filter((m) => m.tipo === 'egreso')
  for (const compra of compras) {
    const corte = corteParaCompra(cortes, compra.fecha.slice(0, 10))
    if (corte) porCorte.get(corte)!.compras += aCentavos(compra.monto)
  }

  // Los pagos se aplican primero al ciclo más viejo con deuda.
  const pagos = ordenarPorFecha(
    movimientos.filter((m) => m.tipo === 'ingreso'),
    (m) => m.fecha
  )

  const orden = cortes
  let indice = 0
  for (const pago of pagos) {
    let restante = aCentavos(pago.monto)
    while (restante > 0 && indice < orden.length) {
      if (porCorte.get(orden[indice])!.compras > 0) {
        const disponible =
          porCorte.get(orden[indice])!.compras - porCorte.get(orden[indice])!.pagos
        if (disponible <= 0) {
          indice += 1
          continue
        }
        const aplicado = Math.min(disponible, restante)
        porCorte.get(orden[indice])!.pagos += aplicado
        restante -= aplicado
        if (aplicado === disponible) indice += 1
      } else {
        indice += 1
      }
    }
    if (indice >= orden.length) break
  }

  return orden.map((corte) => {
    const { compras, pagos: pagosCiclo } = porCorte.get(corte)!
    const objetivoReal = Math.max(0, compras - pagosCiclo)
    const guardado = guardados?.get(corte)
    const objetivoManual = guardado?.objetivoManual ?? null
    return {
      fechaCorte: corte,
      fechaPago: fechaPagoDeCorte(corte, tarjeta.diaCorte ?? 1, tarjeta.diaPago ?? 1),
      compras,
      pagos: pagosCiclo,
      objetivo:
        objetivoManual != null ? Math.max(0, aCentavos(objetivoManual)) : objetivoReal,
      objetivoReal,
      objetivoManual,
      minimo: Math.max(0, aCentavos(guardado?.minimo ?? 0)),
      estado: esAtrasado(corte, hoy) ? 'cerrado' : 'abierto',
    }
  })
}

function diaDe(fecha: string): number {
  return descomponer(fecha)?.dia ?? 1
}

export function compromisosDeseados(
  ciclos: CicloCalculado[],
  nombreTarjeta: string,
  hoy: string
): Array<{
  descripcion: string
  monto: number
  fechaVencimiento: string
  diaCobro: number
  fechaCorte: string
}> {
  const resultados: Array<{
    descripcion: string
    monto: number
    fechaVencimiento: string
    diaCobro: number
    fechaCorte: string
  }> = []

  for (const ciclo of ciclos) {
    if (ciclo.objetivo <= 0) continue
    if (aDiaNumero(ciclo.fechaCorte) > aDiaNumero(hoy)) continue

    resultados.push({
      descripcion: `Pago estimado de la tarjeta ${nombreTarjeta} · Ciclo ${formatearFecha(ciclo.fechaCorte)}`,
      monto: ciclo.objetivo,
      fechaVencimiento: ciclo.fechaPago,
      diaCobro: diaDe(ciclo.fechaPago),
      fechaCorte: ciclo.fechaCorte,
    })
  }

  return resultados
}
