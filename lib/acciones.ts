import { supabase } from './supabase'
import {
  calcularSaldos,
  decisionPagoTarjeta,
  detectarAlertas,
  fechaPagoTarjeta,
  redondearDinero,
  restanteTarjeta,
  siguienteDiaCobro,
  tipoAjusteSaldo,
  type AlertaDomiciliado,
  type DecisionPagoTarjeta,
} from './logica-financiera'

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
}

export interface Transaccion {
  transaccion_id: number
  cuenta_id: number
  tipo: TipoMovimiento
  monto: number
  fecha: string
  descripcion: string | null
}

export type { AlertaDomiciliado }

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

  const saldos = calcularSaldos(cuentas, movimientos ?? [])

  return cuentas.map((c) => ({
    cuenta_id: c.cuenta_id,
    nombre: c.nombre,
    metodo: c.metodo,
    balance_inicial: aNumero(c.balance_inicial),
    saldo: redondearDinero(saldos.get(c.cuenta_id) ?? aNumero(c.balance_inicial)),
    dia_corte: c.dia_corte != null ? aNumero(c.dia_corte) : null,
    dia_pago: c.dia_pago != null ? aNumero(c.dia_pago) : null,
    limite: c.limite != null ? aNumero(c.limite) : null,
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
    es_tarjeta: p.es_tarjeta === true,
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

  const pagosVisibles = pagos.filter((p) => !(p.es_tarjeta && p.monto <= 0))

  const cuentaPorId = new Map(cuentas.map((c) => [c.cuenta_id, c]))

  const pagosConNombre = pagosVisibles.map((p) => ({
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

interface TarjetaCuenta {
  cuenta_id: number
  nombre: string
  balance_inicial: number
  dia_corte: number | null
  dia_pago: number | null
}

function tarjetaConCiclo(cuenta: TarjetaCuenta): boolean {
  return cuenta.dia_corte != null && cuenta.dia_pago != null
}

async function deudaTarjeta(userId: string, tarjeta: TarjetaCuenta): Promise<number> {
  const { data: movimientos, error } = await supabase
    .from('transaccion')
    .select('tipo, monto')
    .eq('usuario_id', userId)
    .eq('cuenta_id', tarjeta.cuenta_id)

  if (error) throw new Error('No se pudieron obtener los movimientos de la tarjeta')

  const saldos = calcularSaldos(
    [
      {
        cuenta_id: tarjeta.cuenta_id,
        metodo: 'credito',
        balance_inicial: aNumero(tarjeta.balance_inicial),
      },
    ],
    (movimientos ?? []).map((t) => ({
      ...t,
      cuenta_id: tarjeta.cuenta_id,
    }))
  )

  return redondearDinero(saldos.get(tarjeta.cuenta_id) ?? aNumero(tarjeta.balance_inicial))
}

async function pagoTarjetaPendiente(
  userId: string,
  tarjetaId: number
): Promise<{ proximo_pago_id: number } | null> {
  const { data } = await supabase
    .from('proximo_pago')
    .select('proximo_pago_id')
    .eq('usuario_id', userId)
    .eq('cuenta_id', tarjetaId)
    .eq('es_tarjeta', true)
    .eq('pagado', false)
    .maybeSingle()

  return data
}

async function sincronizarPagoTarjeta(userId: string, tarjetaId: number): Promise<void> {
  const { data: cuenta } = await supabase
    .from('cuenta')
    .select('cuenta_id, nombre, metodo, balance_inicial, dia_corte, dia_pago')
    .eq('cuenta_id', tarjetaId)
    .eq('usuario_id', userId)
    .maybeSingle()

  if (!cuenta || cuenta.metodo !== 'credito') return
  const tarjeta = cuenta as TarjetaCuenta
  if (!tarjetaConCiclo(tarjeta)) return

  const deuda = await deudaTarjeta(userId, tarjeta)
  const pendiente = await pagoTarjetaPendiente(userId, tarjeta.cuenta_id)
  const decision: DecisionPagoTarjeta = decisionPagoTarjeta(pendiente)

  const valores = {
    usuario_id: userId,
    descripcion: `Pago de la tarjeta ${tarjeta.nombre}`,
    monto: deuda,
    fecha_vencimiento: fechaPagoTarjeta(
      tarjeta.dia_corte!,
      tarjeta.dia_pago!,
      new Date()
    ),
    pagado: false,
    domiciliado: false,
    cuenta_id: tarjeta.cuenta_id,
    recurrente: true,
    dia_cobro: tarjeta.dia_pago,
    es_tarjeta: true,
  }

  const { error } =
    decision.accion === 'actualizar'
      ? await supabase
          .from('proximo_pago')
          .update(valores)
          .eq('proximo_pago_id', decision.pagoId)
      : await supabase.from('proximo_pago').insert(valores)

  if (error) throw new Error('No se pudo sincronizar el pago de la tarjeta')
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

  await sincronizarPagoTarjeta(userId, datos.cuentaId)
}

export async function crearCuenta(
  userId: string,
  datos: {
    nombre: string
    metodo: Metodo
    balanceInicial: number
    diaCorte?: number | null
    diaPago?: number | null
    limite?: number | null
  }
): Promise<void> {
  const { data: insertada, error } = await supabase
    .from('cuenta')
    .insert({
      usuario_id: userId,
      nombre: datos.nombre,
      metodo: datos.metodo,
      balance_inicial: datos.balanceInicial,
      dia_corte: datos.metodo === 'credito' ? (datos.diaCorte ?? null) : null,
      dia_pago: datos.metodo === 'credito' ? (datos.diaPago ?? null) : null,
      limite: datos.metodo === 'credito' ? (datos.limite ?? null) : null,
    })
    .select('cuenta_id')
    .single()

  if (error) throw new Error('No se pudo crear la cuenta')

  if (datos.metodo === 'credito') {
    await sincronizarPagoTarjeta(userId, insertada.cuenta_id)
  }
}

export async function actualizarCuenta(
  userId: string,
  cuentaId: number,
  datos: {
    nombre: string
    metodo: Metodo
    saldoObjetivo: number
    diaCorte?: number | null
    diaPago?: number | null
    limite?: number | null
  },
  saldoAnterior: number
): Promise<void> {
  const { error } = await supabase
    .from('cuenta')
    .update({
      nombre: datos.nombre,
      metodo: datos.metodo,
      dia_corte: datos.metodo === 'credito' ? (datos.diaCorte ?? null) : null,
      dia_pago: datos.metodo === 'credito' ? (datos.diaPago ?? null) : null,
      limite: datos.metodo === 'credito' ? (datos.limite ?? null) : null,
    })
    .eq('cuenta_id', cuentaId)
    .eq('usuario_id', userId)

  if (error) throw new Error('No se pudo actualizar la cuenta')

  const delta = redondearDinero(datos.saldoObjetivo - aNumero(saldoAnterior))
  if (delta !== 0) {
    const { error: errorAjuste } = await supabase.from('transaccion').insert({
      usuario_id: userId,
      cuenta_id: cuentaId,
      tipo: tipoAjusteSaldo(delta, datos.metodo),
      monto: Math.abs(delta),
      descripcion: 'Ajuste de saldo',
    })

    if (errorAjuste) {
      throw new Error('No se pudo registrar el ajuste de saldo en tu historial')
    }
  }

  if (datos.metodo === 'credito') {
    await sincronizarPagoTarjeta(userId, cuentaId)
  }
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
    .eq('pagado', false)
    .select('fecha_vencimiento, domiciliado, recurrente, dia_cobro, es_tarjeta, cuenta_id, monto')
    .maybeSingle()

  if (errorPago) {
    await supabase
      .from('transaccion')
      .delete()
      .eq('transaccion_id', insertado?.[0]?.transaccion_id)
    throw new Error('No se pudo marcar el pago como liquidado')
  }

  if (!pagoActual) {
    await supabase
      .from('transaccion')
      .delete()
      .eq('transaccion_id', insertado?.[0]?.transaccion_id)
    throw new Error('Este pago ya fue liquidado')
  }

  const esTarjeta = pagoActual.es_tarjeta === true
  const tarjetaId = esTarjeta ? pagoActual.cuenta_id : null

  if (esTarjeta && tarjetaId != null) {
    const { error: errorTarjeta } = await supabase.from('transaccion').insert({
      usuario_id: userId,
      cuenta_id: tarjetaId,
      tipo: 'ingreso',
      monto: datos.monto,
      descripcion: `Pago a la tarjeta: ${datos.descripcion}`,
    })

    if (errorTarjeta) {
      await supabase
        .from('transaccion')
        .delete()
        .eq('transaccion_id', insertado?.[0]?.transaccion_id)
      throw new Error('No se pudo registrar el pago de la tarjeta')
    }
  }

  const recurrente = pagoActual.recurrente === true
  const diaCobro = pagoActual.dia_cobro != null ? aNumero(pagoActual.dia_cobro) : null

  if (!recurrente || diaCobro == null) return

  const base = new Date(pagoActual.fecha_vencimiento)
  base.setDate(base.getDate() + 1)
  const fechaSiguiente = siguienteDiaCobro(diaCobro, base)

  if (esTarjeta && tarjetaId != null) {
    const restante = restanteTarjeta(aNumero(pagoActual.monto), aNumero(datos.monto))
    const pendiente = await pagoTarjetaPendiente(userId, tarjetaId)
    const decision = decisionPagoTarjeta(pendiente)
    const valores = {
      usuario_id: userId,
      descripcion: datos.descripcion,
      monto: restante,
      fecha_vencimiento: fechaSiguiente,
      pagado: false,
      domiciliado: false,
      cuenta_id: tarjetaId,
      recurrente: true,
      dia_cobro: diaCobro,
      es_tarjeta: true,
    }

    const { error: errorTarjetaSiguiente } =
      decision.accion === 'actualizar'
        ? await supabase
            .from('proximo_pago')
            .update(valores)
            .eq('proximo_pago_id', decision.pagoId)
        : await supabase.from('proximo_pago').insert(valores)

    if (errorTarjetaSiguiente) {
      throw new Error('No se pudo generar el siguiente pago de la tarjeta')
    }
    return
  }

  const { error: errorInstancia } = await supabase.from('proximo_pago').insert({
    usuario_id: userId,
    descripcion: datos.descripcion,
    monto: datos.monto,
    fecha_vencimiento: fechaSiguiente,
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
  reprogramarFecha?: string | null
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
  const fechaVencimiento = recurrente
    ? datos.reprogramarFecha
      ? datos.reprogramarFecha
      : siguienteDiaCobro(datos.diaCobro ?? 0, new Date())
    : datos.fechaVencimiento

  const { error } = await supabase
    .from('proximo_pago')
    .update({
      descripcion: datos.descripcion,
      monto: datos.monto,
      fecha_vencimiento: fechaVencimiento,
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
