export interface FechaCalendario {
  anio: number
  mes: number
  dia: number
}

function pad(valor: number): string {
  return String(valor).padStart(2, '0')
}

export function aDiaNumero(fecha: string): number {
  const partes = descomponer(fecha)
  if (!partes) return 0
  return partes.anio * 10000 + partes.mes * 100 + partes.dia
}

export function descomponer(fecha: string): FechaCalendario | null {
  const cruda = fecha.trim().slice(0, 10)
  const [anio, mes, dia] = cruda.split('-').map((p) => Number.parseInt(p, 10))
  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia) ||
    mes < 1 ||
    mes > 12 ||
    dia < 1 ||
    dia > 31
  ) {
    return null
  }
  return { anio, mes, dia }
}

export function desdeFecha(anio: number, mes: number, dia: number): string {
  return `${pad(anio)}-${pad(mes)}-${pad(dia)}`
}

export function desdeDateLocal(d: Date): string {
  return desdeFecha(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function hoyLocal(): string {
  return desdeDateLocal(new Date())
}

export function sumarDias(fecha: string, dias: number): string {
  const partes = descomponer(fecha)
  if (!partes) return fecha
  const base = Date.UTC(partes.anio, partes.mes - 1, partes.dia)
  const resultado = new Date(base + dias * 86400000)
  return `${resultado.getUTCFullYear()}-${pad(resultado.getUTCMonth() + 1)}-${pad(
    resultado.getUTCDate()
  )}`
}

export function esAtrasado(fechaVencimiento: string, hoy: string): boolean {
  return aDiaNumero(fechaVencimiento) < aDiaNumero(hoy)
}

export function ordenarPorFecha<T>(
  items: T[],
  obtenerFecha: (item: T) => string
): T[] {
  const conClave = items.map((item) => ({ item, clave: aDiaNumero(obtenerFecha(item)) }))
  for (let i = 1; i < conClave.length; i++) {
    const actual = conClave[i]
    let j = i - 1
    while (j >= 0 && conClave[j].clave > actual.clave) {
      conClave[j + 1] = conClave[j]
      j--
    }
    conClave[j + 1] = actual
  }
  return conClave.map((c) => c.item)
}

export function esAnterior(fecha: string, referencia: string): boolean {
  return aDiaNumero(fecha) < aDiaNumero(referencia)
}

export function esAnteriorOIgual(fecha: string, referencia: string): boolean {
  return aDiaNumero(fecha) <= aDiaNumero(referencia)
}

export function diaValido(dia: number): boolean {
  return Number.isInteger(dia) && dia >= 1 && dia <= 31
}

export function fynzDiasEnMes(anio: number, mes: number): number {
  return new Date(Date.UTC(anio, mes - 1 + 1, 0)).getUTCDate()
}

export function fechaClamp(anio: number, mes: number, dia: number): FechaCalendario {
  const ultimoDia = fynzDiasEnMes(anio, mes)
  return { anio, mes, dia: Math.min(dia, ultimoDia) }
}

export function siguienteDiaCobro(dia: number, desde: string): string {
  if (!diaValido(dia)) return desde
  const base = descomponer(desde)
  if (!base) return desde

  const actual = fechaClamp(base.anio, base.mes, dia)
  if (aDiaNumero(desdeFecha(actual.anio, actual.mes, actual.dia)) >= aDiaNumero(desde)) {
    return desdeFecha(actual.anio, actual.mes, actual.dia)
  }

  const proximoMes = base.mes === 12 ? { anio: base.anio + 1, mes: 1 } : { anio: base.anio, mes: base.mes + 1 }
  const proximo = fechaClamp(proximoMes.anio, proximoMes.mes, dia)
  return desdeFecha(proximo.anio, proximo.mes, proximo.dia)
}

export function fechaPagoTarjeta(
  diaCorte: number,
  diaPago: number,
  hoy: string
): string {
  if (!diaValido(diaCorte) || !diaValido(diaPago)) return hoy
  const base = descomponer(hoy)
  if (!base) return hoy

  let corte = fechaClamp(base.anio, base.mes, diaCorte)
  if (aDiaNumero(desdeFecha(corte.anio, corte.mes, corte.dia)) < aDiaNumero(hoy)) {
    const mesSiguiente = base.mes === 12 ? { anio: base.anio + 1, mes: 1 } : { anio: base.anio, mes: base.mes + 1 }
    corte = fechaClamp(mesSiguiente.anio, mesSiguiente.mes, diaCorte)
  }

  const desfase = diaPago > diaCorte ? 0 : 1
  const fechaPago = { anio: corte.anio, mes: corte.mes + desfase }
  const mesPago = fechaPago.mes === 13 ? { anio: fechaPago.anio + 1, mes: 1 } : { anio: fechaPago.anio, mes: fechaPago.mes }
  const resultado = fechaClamp(mesPago.anio, mesPago.mes, diaPago)
  return desdeFecha(resultado.anio, resultado.mes, resultado.dia)
}

const MESES_CORTOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

function limpiarFecha(fecha: string): string {
  return fecha.trim().slice(0, 10)
}

export function formatearFecha(fecha: string): string {
  const partes = descomponer(limpiarFecha(fecha))
  if (!partes) return fecha
  return `${partes.dia} ${MESES_CORTOS[partes.mes - 1]}`
}

export function diasEntre(a: string, b: string): number {
  const pa = descomponer(a.trim().slice(0, 10))
  const pb = descomponer(b.trim().slice(0, 10))
  if (!pa || !pb) return 0
  const fechaA = Date.UTC(pa.anio, pa.mes - 1, pa.dia)
  const fechaB = Date.UTC(pb.anio, pb.mes - 1, pb.dia)
  return Math.round((fechaB - fechaA) / 86400000)
}

export function claveMes(fecha: string): string | null {
  const partes = descomponer(limpiarFecha(fecha))
  if (!partes) return null
  return `${partes.anio}-${pad(partes.mes)}`
}
