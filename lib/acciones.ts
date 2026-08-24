import { supabase } from './supabase'

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
}

export interface Transaccion {
  transaccion_id: number
  cuenta_id: number
  tipo: TipoMovimiento
  monto: number
  fecha: string
  descripcion: string | null
}

export interface AlertaDomiciliado {
  pagoId: number
  descripcion: string
  monto: number
  fechaVencimiento: string
  cuentaNombre: string
  faltante: number
}

export interface DatosDashboard {
  userId: string
  cuentas: Cuenta[]
  pagos: ProximoPago[]
  movimientos: (Transaccion & { cuenta_nombre: string })[]
  alertas: AlertaDomiciliado[]
  vista: Vista
  dineroLiquido: number
  totalPagos: number
  disponibleReal: number
}

export type MovimientoLista = Transaccion & { cuenta_nombre: string }

function aNumero(valor: unknown): number {
  return Number(valor ?? 0)
}

function diaValido(dia: number): boolean {
  return Number.isInteger(dia) && dia >= 1 && dia <= 31
}

function conClamp(anio: number, mes: number, dia: number): Date {
  const maxDia = new Date(anio, mes + 1, 0).getDate()
  return new Date(anio, mes, Math.min(dia, maxDia))
}

export function siguienteDiaCobro(dia: number, desde: Date): string {
  if (!diaValido(dia)) return desde.toISOString()

  const inicio = new Date(
    desde.getFullYear(),
    desde.getMonth(),
    desde.getDate()
  )

  const mesActual = conClamp(inicio.getFullYear(), inicio.getMonth(), dia)
  if (mesActual.getTime() >= inicio.getTime()) return mesActual.toISOString()

  const mesSiguiente = conClamp(inicio.getFullYear(), inicio.getMonth() + 1, dia)
  return mesSiguiente.toISOString()
}

export async function buscarCuentasConSaldo(userId: string): Promise<Cuenta[]> {
  const { data: cuentas, error } = await supabase
    .from('cuenta')
    .select('*')
    .eq('usuario_id', userId)

  if (error) throw new Error('No se pudieron obtener las cuentas')

  if (!cuentas?.length) return []

  const { data: movimientos, error: errorMovs } = await supabase
    .from('transaccion')
    .select('cuenta_id, tipo, monto')
    .eq('usuario_id', userId)

  if (errorMovs) throw new Error('No se pudieron obtener los movimientos')

  const saldos = new Map<number, number>()
  for (const t of movimientos ?? []) {
    const delta = t.tipo === 'ingreso' ? aNumero(t.monto) : -aNumero(t.monto)
    saldos.set(t.cuenta_id, (saldos.get(t.cuenta_id) ?? 0) + delta)
  }

  return cuentas.map((c) => ({
    cuenta_id: c.cuenta_id,
    nombre: c.nombre,
    metodo: c.metodo,
    balance_inicial: aNumero(c.balance_inicial),
    saldo: aNumero(c.balance_inicial) + (saldos.get(c.cuenta_id) ?? 0),
  }))
}

export async function buscarPagosProximos(
  userId: string,
  soloPendientes = false
): Promise<ProximoPago[]> {
  let query = supabase
    .from('proximo_pago')
    .select('*')
    .eq('usuario_id', userId)
    .order('fecha_vencimiento', { ascending: true })

  if (soloPendientes) {
    query = query.eq('pagado', false)
  }

  const { data, error } = await query
  if (error) throw new Error('No se pudieron obtener los próximos pagos')

  return (data ?? []).map((p) => ({
    proximo_pago_id: p.proximo_pago_id,
    descripcion: p.descripcion,
    monto: aNumero(p.monto),
    fecha_vencimiento: p.fecha_vencimiento,
    pagado: p.pagado,
    domiciliado: p.domiciliado === true,
    cuenta_id: p.cuenta_id ?? null,
    cuenta_nombre: null,
    recurrente: p.recurrente === true,
    dia_cobro: p.dia_cobro != null ? aNumero(p.dia_cobro) : null,
  }))
}

export async function buscarMovimientosRecientes(
  userId: string,
  limit = 5
): Promise<Transaccion[]> {
  const { data, error } = await supabase
    .from('transaccion')
    .select('*')
    .eq('usuario_id', userId)
    .order('fecha', { ascending: false })
    .limit(limit)

  if (error) throw new Error('No se pudieron obtener los movimientos')

  return (data ?? []).map((t) => ({
    transaccion_id: t.transaccion_id,
    cuenta_id: t.cuenta_id,
    tipo: t.tipo,
    monto: aNumero(t.monto),
    fecha: t.fecha,
    descripcion: t.descripcion,
  }))
}

function detectarAlertas(cuentas: Cuenta[], pagos: ProximoPago[]): AlertaDomiciliado[] {
  const pendientes = pagos.filter(
    (p) => p.domiciliado && !p.pagado && p.cuenta_id != null
  )

  const porCuenta = new Map<number, ProximoPago[]>()
  for (const p of pendientes) {
    const lista = porCuenta.get(p.cuenta_id!) ?? []
    lista.push(p)
    porCuenta.set(p.cuenta_id!, lista)
  }

  const alertas: AlertaDomiciliado[] = []
  for (const [cuentaId, lista] of porCuenta) {
    const cuenta = cuentas.find((c) => c.cuenta_id === cuentaId)
    if (!cuenta) continue

    lista.sort(
      (a, b) =>
        new Date(a.fecha_vencimiento).getTime() -
        new Date(b.fecha_vencimiento).getTime()
    )

    let acumulado = 0
    for (const p of lista) {
      acumulado += p.monto
      if (acumulado > cuenta.saldo) {
        alertas.push({
          pagoId: p.proximo_pago_id,
          descripcion: p.descripcion,
          monto: p.monto,
          fechaVencimiento: p.fecha_vencimiento,
          cuentaNombre: cuenta.nombre,
          faltante: Math.round((acumulado - cuenta.saldo) * 100) / 100,
        })
      }
    }
  }

  alertas.sort(
    (a, b) =>
      new Date(a.fechaVencimiento).getTime() -
      new Date(b.fechaVencimiento).getTime()
  )

  return alertas
}

export interface ConfiguracionUsuario {
  vista: Vista
}

export async function obtenerConfiguracion(userId: string): Promise<ConfiguracionUsuario> {
  const { data, error } = await supabase
    .from('configuracion')
    .select('vista')
    .eq('usuario_id', userId)
    .maybeSingle()

  if (error) throw new Error('No se pudo obtener tu configuración')

  return { vista: data?.vista === 'escritorio' ? 'escritorio' : 'movil' }
}

export async function guardarConfiguracion(
  userId: string,
  config: ConfiguracionUsuario
): Promise<void> {
  const { error } = await supabase
    .from('configuracion')
    .upsert({ usuario_id: userId, vista: config.vista })

  if (error) throw new Error('No se pudo guardar la preferencia')
}

export async function obtenerDatosDashboard(userId: string): Promise<DatosDashboard> {
  const [cuentas, pagos, movimientos, configuracion] = await Promise.all([
    buscarCuentasConSaldo(userId),
    buscarPagosProximos(userId, true),
    buscarMovimientosRecientes(userId),
    obtenerConfiguracion(userId),
  ])

  const cuentaPorId = new Map(cuentas.map((c) => [c.cuenta_id, c]))

  const pagosConNombre = pagos.map((p) => ({
    ...p,
    cuenta_nombre: p.cuenta_id != null ? (cuentaPorId.get(p.cuenta_id)?.nombre ?? 'Cuenta') : null,
  }))

  const dineroLiquido = cuentas
    .filter((c) => c.metodo !== 'credito')
    .reduce((sum, c) => sum + c.saldo, 0)

  const totalPagos = pagos.reduce((sum, p) => sum + p.monto, 0)

  return {
    userId,
    cuentas,
    pagos: pagosConNombre,
    movimientos: movimientos.map((t) => ({
      ...t,
      cuenta_nombre: cuentaPorId.get(t.cuenta_id)?.nombre ?? 'Cuenta',
    })),
    alertas: detectarAlertas(cuentas, pagosConNombre),
    vista: configuracion.vista,
    dineroLiquido,
    totalPagos,
    disponibleReal: dineroLiquido - totalPagos,
  }
}

export async function registrarMovimiento(
  userId: string,
  datos: { cuentaId: number; tipo: TipoMovimiento; monto: number; descripcion?: string }
): Promise<void> {
  const { error } = await supabase.from('transaccion').insert({
    usuario_id: userId,
    cuenta_id: datos.cuentaId,
    tipo: datos.tipo,
    monto: datos.monto,
    descripcion: datos.descripcion ?? null,
  })

  if (error) throw new Error('No se pudo registrar el movimiento')
}

export async function crearCuenta(
  userId: string,
  datos: { nombre: string; metodo: Metodo; balanceInicial: number }
): Promise<void> {
  const { error } = await supabase.from('cuenta').insert({
    usuario_id: userId,
    nombre: datos.nombre,
    metodo: datos.metodo,
    balance_inicial: datos.balanceInicial,
  })

  if (error) throw new Error('No se pudo crear la cuenta')
}

export async function actualizarCuenta(
  userId: string,
  cuentaId: number,
  datos: { nombre: string; metodo: Metodo; balanceInicial: number }
): Promise<void> {
  const { error } = await supabase
    .from('cuenta')
    .update({
      nombre: datos.nombre,
      metodo: datos.metodo,
      balance_inicial: datos.balanceInicial,
    })
    .eq('cuenta_id', cuentaId)
    .eq('usuario_id', userId)

  if (error) throw new Error('No se pudo actualizar la cuenta')
}

export async function eliminarCuenta(userId: string, cuentaId: number): Promise<void> {
  const { error } = await supabase
    .from('cuenta')
    .delete()
    .eq('cuenta_id', cuentaId)
    .eq('usuario_id', userId)

  if (error) throw new Error('No se pudo eliminar la cuenta')
}

export async function transferir(
  userId: string,
  datos: { cuentaOrigen: number; cuentaDestino: number; monto: number; origenNombre: string; destinoNombre: string }
): Promise<void> {
  const { error } = await supabase.from('transaccion').insert([
    {
      usuario_id: userId,
      cuenta_id: datos.cuentaOrigen,
      tipo: 'egreso',
      monto: datos.monto,
      descripcion: `Transferencia a ${datos.destinoNombre}`,
    },
    {
      usuario_id: userId,
      cuenta_id: datos.cuentaDestino,
      tipo: 'ingreso',
      monto: datos.monto,
      descripcion: `Transferencia desde ${datos.origenNombre}`,
    },
  ])

  if (error) throw new Error('No se pudo completar la transferencia')
}

export async function liquidarPago(
  userId: string,
  pagoId: number,
  datos: {
    cuentaId: number
    monto: number
    descripcion: string
    recurrente?: boolean
    diaCobro?: number | null
    domiciliado?: boolean
  }
): Promise<void> {
  const { data: insertado, error } = await supabase
    .from('transaccion')
    .insert({
      usuario_id: userId,
      cuenta_id: datos.cuentaId,
      tipo: 'egreso',
      monto: datos.monto,
      descripcion: `Pago: ${datos.descripcion}`,
    })
    .select('transaccion_id')

  if (error) throw new Error('No se pudo registrar el pago')

  const { data: pagoActual, error: errorPago } = await supabase
    .from('proximo_pago')
    .update({ pagado: true })
    .eq('proximo_pago_id', pagoId)
    .select('fecha_vencimiento, domiciliado, recurrente, dia_cobro')
    .single()

  if (errorPago || !pagoActual) {
    await supabase
      .from('transaccion')
      .delete()
      .eq('transaccion_id', insertado?.[0]?.transaccion_id)
    throw new Error('No se pudo marcar el pago como liquidado')
  }

  const recurrente = pagoActual.recurrente === true
  const diaCobro = pagoActual.dia_cobro != null ? aNumero(pagoActual.dia_cobro) : null

  if (!recurrente || diaCobro == null) return

  const base = new Date(pagoActual.fecha_vencimiento)
  base.setDate(base.getDate() + 1)

  const { error: errorInstancia } = await supabase.from('proximo_pago').insert({
    usuario_id: userId,
    descripcion: datos.descripcion,
    monto: datos.monto,
    fecha_vencimiento: siguienteDiaCobro(diaCobro, base),
    domiciliado: datos.domiciliado === true,
    cuenta_id: datos.domiciliado ? datos.cuentaId : null,
    recurrente: true,
    dia_cobro: diaCobro,
  })

  if (errorInstancia) throw new Error('No se pudo generar la siguiente instancia del pago')
}

interface DatosProximoPago {
  descripcion: string
  monto: number
  fechaVencimiento: string
  domiciliado: boolean
  cuentaId?: number | null
  recurrente?: boolean
  diaCobro?: number | null
}

export async function crearProximoPago(
  userId: string,
  datos: DatosProximoPago
): Promise<void> {
  const recurrente = datos.recurrente === true
  const { error } = await supabase.from('proximo_pago').insert({
    usuario_id: userId,
    descripcion: datos.descripcion,
    monto: datos.monto,
    fecha_vencimiento: recurrente ? siguienteDiaCobro(datos.diaCobro ?? 0, new Date()) : datos.fechaVencimiento,
    domiciliado: datos.domiciliado,
    cuenta_id: datos.domiciliado ? datos.cuentaId ?? null : null,
    recurrente,
    dia_cobro: recurrente ? (datos.diaCobro ?? null) : null,
  })

  if (error) throw new Error('No se pudo crear el pago')
}

export async function actualizarProximoPago(
  userId: string,
  pagoId: number,
  datos: DatosProximoPago
): Promise<void> {
  const recurrente = datos.recurrente === true
  const { error } = await supabase
    .from('proximo_pago')
    .update({
      descripcion: datos.descripcion,
      monto: datos.monto,
      fecha_vencimiento: recurrente ? siguienteDiaCobro(datos.diaCobro ?? 0, new Date()) : datos.fechaVencimiento,
      domiciliado: datos.domiciliado,
      cuenta_id: datos.domiciliado ? datos.cuentaId ?? null : null,
      recurrente,
      dia_cobro: recurrente ? (datos.diaCobro ?? null) : null,
    })
    .eq('proximo_pago_id', pagoId)
    .eq('usuario_id', userId)

  if (error) throw new Error('No se pudo actualizar el pago')
}

export async function eliminarProximoPago(
  userId: string,
  pagoId: number
): Promise<void> {
  const { error } = await supabase
    .from('proximo_pago')
    .delete()
    .eq('proximo_pago_id', pagoId)
    .eq('usuario_id', userId)

  if (error) throw new Error('No se pudo eliminar el pago')
}
