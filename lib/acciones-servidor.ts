'use server'

import { headers } from 'next/headers'
import { createServerSupabase } from './supabase/server'
import { aCentavos } from './dinero'
import { diasEntre, esAtrasado, hoyLocal } from './fechas'
import {
  compromisosDeseados,
  ciclosDeTarjeta,
  type DatosGuardadosCiclo,
} from './ciclos-tarjeta'
import type { FiltrosHistorial } from './historial'
import { calcularDisponible, calcularHorizonte } from './horizonte'
import {
  calcularSaldos,
  detectarAlertas,
} from './logica-financiera'
import { esFrecuencia, esRecurrente, fechaInicialPago, type Frecuencia } from './recurrencia'
import { agregarFlujoMensual, sanearWidgetsActivos } from './tablero'
import type {
  Cuenta,
  DatosDashboard,
  Metodo,
  ProximoPago,
  TipoMovimiento,
  Transaccion,
} from './acciones'

export type Respuesta = { ok: true } | { ok: false; error: string }

type Cliente = Awaited<ReturnType<typeof createServerSupabase>>

import { MENSAJES_SQL, traducirError } from './errores'
import { errorDesdeRpc, logError } from './logs'

async function clienteAutenticado(): Promise<Cliente | null> {
  const cliente = await createServerSupabase()
  const {
    data: { user },
  } = await cliente.auth.getUser()
  if (!user) return null
  return cliente
}

async function intentar(
  nombre: string,
  operacion: () => Promise<void>
): Promise<Respuesta> {
  const inicio = Date.now()
  try {
    await operacion()
    return { ok: true }
  } catch (e) {
    logError({ accion: nombre }, e, Date.now() - inicio)
    return { ok: false, error: traducirError(e) }
  }
}

function nuevoIdem(): string {
  return crypto.randomUUID()
}

async function registrarAuditoria(
  cliente: Cliente,
  usuarioId: string,
  accion: string,
  entidad: string,
  entidadId?: number
): Promise<void> {
  try {
    const { error } = await cliente.from('auditoria').insert({
      usuario_id: usuarioId,
      accion,
      entidad,
      entidad_id: entidadId ?? null,
    })
    if (error) logError({ accion: 'auditoria', contexto: 'registrar' }, errorDesdeRpc(error))
  } catch {
    // La auditoría nunca debe impedir la operación principal.
  }
}

function mesHace(fecha: string, meses: number): string {
  const [anio, mes] = fecha.split('-').map((p) => Number.parseInt(p, 10))
  const indice = anio * 12 + (mes - 1) - meses
  const anioInicio = Math.floor(indice / 12)
  const mesInicio = (indice % 12) + 1
  return `${anioInicio}-${String(mesInicio).padStart(2, '0')}-01`
}

function aEntero(values: unknown): number {
  return aCentavos(values)
}

// ---------------------------------------------------------------------------
// Lecturas (servidor)
// ---------------------------------------------------------------------------

async function buscarCuentasConSaldo(
  usuarioId: string,
  cliente: Cliente
): Promise<Cuenta[]> {
  const { data: cuentas, error } = await cliente
    .from('cuenta')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('archivada', false)
    .order('cuenta_id')

  if (error) {
    logError({ accion: 'buscarCuentasConSaldo' }, errorDesdeRpc(error))
    throw new Error('No se pudieron obtener las cuentas')
  }

  if (!cuentas?.length) return []

  const { data: movimientos, error: errorMovs } = await cliente
    .from('transaccion')
    .select('cuenta_id, tipo, monto')
    .eq('usuario_id', usuarioId)

  if (errorMovs) {
    logError({ accion: 'buscarCuentasConSaldo', contexto: 'movimientos' }, errorDesdeRpc(errorMovs))
    throw new Error('No se pudieron obtener los movimientos')
  }

  const saldos = calcularSaldos(cuentas, movimientos ?? [])

  return cuentas.map((c) => ({
    cuenta_id: c.cuenta_id,
    nombre: c.nombre,
    metodo: c.metodo,
    balance_inicial: aEntero(c.balance_inicial),
    saldo: saldos.get(c.cuenta_id) ?? aEntero(c.balance_inicial),
    dia_corte: c.dia_corte != null ? aEntero(c.dia_corte) : null,
    dia_pago: c.dia_pago != null ? aEntero(c.dia_pago) : null,
    limite: c.limite != null ? aEntero(c.limite) : null,
  }))
}

async function buscarPagosProximos(
  usuarioId: string,
  cliente: Cliente
): Promise<ProximoPago[]> {
  const { data, error } = await cliente
    .from('proximo_pago')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('archivada', false)
    .eq('pagado', false)
    .order('fecha_vencimiento')

  if (error) {
    logError({ accion: 'buscarPagosProximos' }, errorDesdeRpc(error))
    throw new Error('No se pudieron obtener los próximos pagos')
  }

  return (data ?? []).map((p) => ({
    proximo_pago_id: p.proximo_pago_id,
    descripcion: p.descripcion,
    monto: aEntero(p.monto),
    fecha_vencimiento: p.fecha_vencimiento,
    pagado: p.pagado === true,
    domiciliado: p.domiciliado === true,
    cuenta_id: p.cuenta_id ?? null,
    cuenta_nombre: null,
    recurrente: p.recurrente === true,
    dia_cobro: p.dia_cobro != null ? aEntero(p.dia_cobro) : null,
    frecuencia: esFrecuencia(p.frecuencia)
      ? p.frecuencia
      : p.recurrente === true
        ? 'mensual'
        : 'unico',
    es_tarjeta: p.es_tarjeta === true,
    minimo: p.minimo != null ? aEntero(p.minimo) : null,
  }))
}

async function buscarMovimientosRecientes(
  usuarioId: string,
  cliente: Cliente,
  limit = 5
): Promise<Transaccion[]> {
  const { data, error } = await cliente
    .from('transaccion')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })
    .order('transaccion_id', { ascending: false })
    .limit(limit)

  if (error) {
    logError({ accion: 'buscarMovimientosRecientes' }, errorDesdeRpc(error))
    throw new Error('No se pudieron obtener los movimientos')
  }

  return (data ?? []).map((t) => ({
    transaccion_id: t.transaccion_id,
    cuenta_id: t.cuenta_id,
    tipo: t.tipo,
    monto: aEntero(t.monto),
    fecha: t.fecha,
    descripcion: t.descripcion,
    operacion: t.operacion ?? null,
    categoria_id: t.categoria_id ?? null,
    pago_id: t.pago_id ?? null,
    relacionada_id: t.relacionada_id ?? null,
  }))
}

async function sincronizarCompromisosTarjeta(
  usuarioId: string,
  tarjetaId: number,
  cliente: Cliente
): Promise<void> {
  const { data: tarjeta } = await cliente
    .from('cuenta')
    .select('nombre, dia_corte, dia_pago, balance_inicial, creada')
    .eq('cuenta_id', tarjetaId)
    .eq('usuario_id', usuarioId)
    .maybeSingle()

  if (!tarjeta || tarjeta.dia_corte == null || tarjeta.dia_pago == null) return

  const [movimientos, ciclosPrevios] = await Promise.all([
    cliente
      .from('transaccion')
      .select('tipo, monto, fecha')
      .eq('usuario_id', usuarioId)
      .eq('cuenta_id', tarjetaId),
    cliente
      .from('ciclo_tarjeta')
      .select('fecha_corte, objetivo_manual, minimo')
      .eq('usuario_id', usuarioId)
      .eq('cuenta_id', tarjetaId),
  ])

  const guardados = new Map<string, DatosGuardadosCiclo>()
  for (const fila of ciclosPrevios.data ?? []) {
    guardados.set(fila.fecha_corte, {
      objetivoManual: fila.objetivo_manual != null ? aEntero(fila.objetivo_manual) : null,
      minimo: aEntero(fila.minimo),
    })
  }

  const hoy = hoyLocal()
  const ciclos = ciclosDeTarjeta(
    {
      diaCorte: aEntero(tarjeta.dia_corte),
      diaPago: aEntero(tarjeta.dia_pago),
      balanceInicial: aEntero(tarjeta.balance_inicial),
      fechaInicio: (tarjeta.creada ?? hoy).slice(0, 10),
      nombre: tarjeta.nombre,
    },
    (movimientos.data ?? []).map((m) => ({
      tipo: m.tipo,
      monto: aEntero(m.monto),
      fecha: m.fecha,
    })),
    hoy,
    guardados
  )

  const compromisos = compromisosDeseados(ciclos, tarjeta.nombre, hoy).map((c) => {
    const ciclo = ciclos.find((x) => x.fechaCorte === c.fechaCorte)
    return {
      ...c,
      fechaCorte: c.fechaCorte,
      minimo: ciclo?.minimo ?? 0,
    }
  })

  const payload = ciclos.map((c) => ({
    fechaCorte: c.fechaCorte,
    fechaPago: c.fechaPago,
    compras: c.compras,
    pagos: c.pagos,
    objetivo: c.objetivo,
    objetivoManual: c.objetivoManual,
    minimo: c.minimo,
    estado: c.estado,
  }))

  // PostgREST ya serializa los arrays a jsonb. Enviar JSON.stringify() aquí
  // produce un escalar de tipo string y jsonb_array_elements falla con 22023.
  const { error } = await cliente.rpc('fynz_sincronizar_compromisos_tarjeta', {
    p_usuario: usuarioId,
    p_cuenta_id: tarjetaId,
    p_ciclos: payload,
    p_hoy: hoy,
    p_compromisos: compromisos,
  })

  if (error) logError({ accion: 'sincronizarCompromisosTarjeta', ids: [tarjetaId] }, errorDesdeRpc(error))
}

async function buscarFlujoMensual(
  usuarioId: string,
  cliente: Cliente,
  numeroMeses = 6
) {
  const desde = hoyLocal()
  const inicio = mesHace(desde, numeroMeses - 1)
  const { data, error } = await cliente
    .from('transaccion')
    .select('tipo, monto, fecha')
    .eq('usuario_id', usuarioId)
    .gte('fecha', inicio)

  if (error) {
    logError({ accion: 'buscarFlujoMensual' }, errorDesdeRpc(error))
    throw new Error('No se pudieron obtener los movimientos del periodo')
  }

  return agregarFlujoMensual(data ?? [], numeroMeses, desde)
}

export interface PagoVinculado {
  proximo_pago_id: number
  descripcion: string
  fecha_vencimiento: string
  pagado: boolean
  tarjeta_nombre: string | null
}

export interface ParejaVinculada {
  transaccion_id: number
  cuenta_nombre: string
  monto: number
  fecha: string
}

export interface MovimientoHistorial extends Transaccion {
  cuenta_nombre: string
  cuenta_metodo: string | null
  categoria_nombre: string | null
  pago: PagoVinculado | null
  pareja: ParejaVinculada | null
}

const PAGINA_HISTORIAL = 25

async function enriquecerMovimientos(
  usuarioId: string,
  cliente: Cliente,
  filas: Transaccion[]
): Promise<MovimientoHistorial[]> {
  if (filas.length === 0) return []

  const { data: cuentas } = await cliente
    .from('cuenta')
    .select('cuenta_id, nombre, metodo')
    .eq('usuario_id', usuarioId)
  const cuentaPorId = new Map(
    (cuentas ?? []).map((c) => [c.cuenta_id, { nombre: c.nombre, metodo: c.metodo }])
  )

  const idsCategorias = [...new Set(filas.map((f) => f.categoria_id).filter((x): x is number => x != null))]
  const categorias = idsCategorias.length
    ? await cliente
        .from('categoria')
        .select('categoria_id, nombre')
        .in('categoria_id', idsCategorias)
    : null

  const idsPagos = [...new Set(filas.map((f) => f.pago_id).filter((x): x is number => x != null))]
  const pagos = idsPagos.length
    ? await cliente
        .from('proximo_pago')
        .select('proximo_pago_id, descripcion, fecha_vencimiento, pagado, cuenta_id')
        .in('proximo_pago_id', idsPagos)
    : null

  const idsPareja = [...new Set(filas.map((f) => f.relacionada_id).filter((x): x is number => x != null))]
  const parejas = idsPareja.length
    ? await cliente
        .from('transaccion')
        .select('transaccion_id, cuenta_id, monto, fecha')
        .in('transaccion_id', idsPareja)
    : null

  const pagoPorId = new Map((pagos?.data ?? []).map((p) => [p.proximo_pago_id, p]))
  const parejaPorId = new Map((parejas?.data ?? []).map((p) => [p.transaccion_id, p]))
  const categoriaPorId = new Map(
    (categorias?.data ?? []).map((c) => [c.categoria_id, c.nombre as string])
  )

  return filas.map((fila) => {
    const pago = fila.pago_id != null ? pagoPorId.get(fila.pago_id) ?? null : null
    const pareja =
      fila.relacionada_id != null ? parejaPorId.get(fila.relacionada_id) ?? null : null
    return {
      ...fila,
      cuenta_nombre: cuentaPorId.get(fila.cuenta_id)?.nombre ?? 'Cuenta',
      cuenta_metodo: cuentaPorId.get(fila.cuenta_id)?.metodo ?? null,
      categoria_nombre:
        fila.categoria_id != null ? categoriaPorId.get(fila.categoria_id) ?? null : null,
      pago: pago
        ? {
            proximo_pago_id: pago.proximo_pago_id,
            descripcion: pago.descripcion,
            fecha_vencimiento: pago.fecha_vencimiento,
            pagado: pago.pagado === true,
            tarjeta_nombre:
              pago.cuenta_id != null
                ? cuentaPorId.get(pago.cuenta_id)?.nombre ?? null
                : null,
          }
        : null,
      pareja: pareja
        ? {
            transaccion_id: pareja.transaccion_id,
            cuenta_nombre: cuentaPorId.get(pareja.cuenta_id)?.nombre ?? 'Cuenta',
            monto: aEntero(pareja.monto),
            fecha: pareja.fecha,
          }
        : null,
    }
  })
}

export async function buscarMovimientos(
  filtros: FiltrosHistorial,
  offset: number
): Promise<{ movimientos: MovimientoHistorial[]; total: number } | null> {
  const cliente = await clienteAutenticado()
  if (!cliente) return null
  const {
    data: { user },
  } = await cliente.auth.getUser()
  if (!user) return null

  try {
  let consulta = cliente
    .from('transaccion')
    .select('*', { count: 'exact' })
    .eq('usuario_id', user.id)
    .order('fecha', { ascending: false })
    .order('transaccion_id', { ascending: false })
    .range(offset, offset + PAGINA_HISTORIAL - 1)

  if (filtros.desde) consulta = consulta.gte('fecha', filtros.desde.slice(0, 10))
  if (filtros.hasta) consulta = consulta.lte('fecha', filtros.hasta.slice(0, 10))
  if (filtros.cuentaId != null) consulta = consulta.eq('cuenta_id', filtros.cuentaId)
  if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo)
  if (filtros.operacion) consulta = consulta.eq('operacion', filtros.operacion)
  if (filtros.categoriaId != null) consulta = consulta.eq('categoria_id', filtros.categoriaId)
  if (filtros.texto.trim() !== '') {
    consulta = consulta.ilike('descripcion', `%${filtros.texto.trim()}%`)
  }

  if (filtros.estado === 'atrasado') {
    const hoy = hoyLocal()
    const { data: atrasados } = await cliente
      .from('proximo_pago')
      .select('proximo_pago_id')
      .eq('usuario_id', user.id)
      .eq('pagado', false)
      .lt('fecha_vencimiento', todayKey(hoy))

    const ids = (atrasados ?? []).map((p) => p.proximo_pago_id)
    if (ids.length === 0) return { movimientos: [], total: 0 }
    consulta = consulta.in('pago_id', ids)
  }

  const { data, error, count } = await consulta
  if (error) {
    logError({ accion: 'buscarMovimientos' }, errorDesdeRpc(error))
    throw new Error('No se pudieron obtener los movimientos')
  }

  return {
    movimientos: await enriquecerMovimientos(user.id, cliente, (data ?? []) as Transaccion[]),
    total: count ?? 0,
  }
  } catch (e) {
    logError({ accion: 'buscarMovimientos' }, e)
    throw e
  }
}

function todayKey(hoy: string): string {
  return hoy.slice(0, 10)
}

export async function buscarDetalleMovimiento(
  movimientoId: number
): Promise<MovimientoHistorial | null> {
  const cliente = await clienteAutenticado()
  if (!cliente) return null
  const {
    data: { user },
  } = await cliente.auth.getUser()
  if (!user) return null

  const { data, error } = await cliente
    .from('transaccion')
    .select('*')
    .eq('transaccion_id', movimientoId)
    .eq('usuario_id', user.id)
    .maybeSingle()
  if (error) {
    logError({ accion: 'buscarDetalleMovimiento', ids: [movimientoId] }, errorDesdeRpc(error))
    return null
  }

  if (!data) return null

  const enriquecido = await enriquecerMovimientos(user.id, cliente, [data as Transaccion])
  return enriquecido[0] ?? null
}

export async function listarCuentasHistorial(): Promise<
  Array<{ cuenta_id: number; nombre: string; metodo: string }>
> {
  const cliente = await clienteAutenticado()
  if (!cliente) return []
  const {
    data: { user },
  } = await cliente.auth.getUser()
  if (!user) return []

  const { data, error } = await cliente
    .from('cuenta')
    .select('cuenta_id, nombre, metodo')
    .eq('usuario_id', user.id)
    .eq('archivada', false)
    .order('nombre')
  if (error) {
    logError({ accion: 'listarCuentasHistorial' }, errorDesdeRpc(error))
    return []
  }

  return (data ?? []).map((c) => ({
    cuenta_id: c.cuenta_id,
    nombre: c.nombre,
    metodo: c.metodo,
  }))
}

export interface CategoriaConUsos {
  categoria_id: number
  nombre: string
  usos: number
}

export type ResultadoCategoria =
  | { ok: true; categoriaId?: number }
  | { ok: false; error: string }

export async function listarCategorias(): Promise<CategoriaConUsos[]> {
  const cliente = await clienteAutenticado()
  if (!cliente) return []
  const {
    data: { user },
  } = await cliente.auth.getUser()
  if (!user) return []

  const { data: categorias, error: errorCategorias } = await cliente
    .from('categoria')
    .select('categoria_id, nombre')
    .eq('usuario_id', user.id)
    .order('nombre')
  if (errorCategorias) {
    logError({ accion: 'listarCategorias', contexto: 'categorias' }, errorDesdeRpc(errorCategorias))
  }

  const { data: usos, error: errorUsos } = await cliente
    .from('transaccion')
    .select('categoria_id')
    .eq('usuario_id', user.id)
    .not('categoria_id', 'is', null)
  if (errorUsos) {
    logError({ accion: 'listarCategorias', contexto: 'usos' }, errorDesdeRpc(errorUsos))
  }

  const conteo = new Map<number, number>()
  for (const fila of usos ?? []) {
    const id = fila.categoria_id
    if (id != null) conteo.set(id, (conteo.get(id) ?? 0) + 1)
  }

  return (categorias ?? []).map((c) => ({
    categoria_id: c.categoria_id,
    nombre: c.nombre,
    usos: conteo.get(c.categoria_id) ?? 0,
  }))
}

export async function crearCategoria(nombre: string): Promise<ResultadoCategoria> {
  const cliente = await clienteAutenticado()
  if (!cliente) return { ok: false, error: 'no_autorizado' as string }
  const {
    data: { user },
  } = await cliente.auth.getUser()
  if (!user) return { ok: false, error: 'no_autorizado' as string }

  const { data, error } = await cliente
    .from('categoria')
    .insert({ usuario_id: user.id, nombre })
    .select('categoria_id')
    .maybeSingle()

  if (error) {
    logError({ accion: 'crearCategoria' }, errorDesdeRpc(error))
    return { ok: false, error: traducirError(error) }
  }
  return { ok: true, categoriaId: data?.categoria_id }
}

export async function renombrarCategoria(
  categoriaId: number,
  nombre: string
): Promise<Respuesta> {
  return intentar('renombrarCategoria', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { error } = await cliente
      .from('categoria')
      .update({ nombre })
      .eq('categoria_id', categoriaId)
      .eq('usuario_id', user.id)

    if (error) throw errorDesdeRpc(error)
  })
}

export async function eliminarCategoria(categoriaId: number): Promise<Respuesta> {
  return intentar('eliminarCategoria', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { error } = await cliente
      .from('categoria')
      .delete()
      .eq('categoria_id', categoriaId)
      .eq('usuario_id', user.id)

    if (error) throw errorDesdeRpc(error)
  })
}

export async function listarCategoriasHistorial(): Promise<
  Array<{ categoria_id: number; nombre: string }>
> {
  const cliente = await clienteAutenticado()
  if (!cliente) return []
  const {
    data: { user },
  } = await cliente.auth.getUser()
  if (!user) return []

  const { data, error } = await cliente
    .from('categoria')
    .select('categoria_id, nombre')
    .eq('usuario_id', user.id)
    .order('nombre')
  if (error) {
    logError({ accion: 'listarCategoriasHistorial' }, errorDesdeRpc(error))
    return []
  }

  return (data ?? []).map((c) => ({
    categoria_id: c.categoria_id,
    nombre: c.nombre,
  }))
}

export async function obtenerDatosDashboard(): Promise<DatosDashboard | null> {
  const cliente = await clienteAutenticado()
  if (!cliente) return null

  const {
    data: { user },
  } = await cliente.auth.getUser()
  if (!user) return null

  const usuarioId = user.id

  try {
  const [
    cuentas,
    pagos,
    movimientos,
    respuestaConfig,
    flujoMensual,
    respuestaAnalitica,
    respuestaNombres,
  ] = await Promise.all([
    buscarCuentasConSaldo(usuarioId, cliente),
    buscarPagosProximos(usuarioId, cliente),
    buscarMovimientosRecientes(usuarioId, cliente),
    cliente
      .from('configuracion')
      .select('vista, widgets, proximo_ingreso, horizonte_preferido, horizonte_fecha, actualizado')
      .eq('usuario_id', usuarioId)
      .maybeSingle(),
    buscarFlujoMensual(usuarioId, cliente),
    Promise.all([
      cliente
        .from('transaccion')
        .select('tipo, monto, fecha, categoria_id')
        .eq('usuario_id', usuarioId)
        .gte('fecha', mesHace(hoyLocal(), 5))
        .order('fecha', { ascending: false })
        .limit(2000),
      cliente.from('categoria').select('categoria_id, nombre').eq('usuario_id', usuarioId),
    ]),
    // Incluye archivadas: el historial reciente debe conservar el nombre real.
    cliente.from('cuenta').select('cuenta_id, nombre').eq('usuario_id', usuarioId),
  ])

  const configuracion = respuestaConfig.data as {
    vista?: string | null
    widgets?: unknown
    proximo_ingreso?: string | null
    horizonte_preferido?: number | null
    horizonte_fecha?: string | null
    actualizado?: string | null
  } | null

  const pagosVisibles = pagos.filter((p) => !(p.es_tarjeta && p.monto <= 0))

  const nombrePorCuenta = new Map(
    (respuestaNombres.data ?? []).map((c: { cuenta_id: number; nombre: string }) => [
      c.cuenta_id,
      c.nombre,
    ])
  )

  const pagosConNombre = pagosVisibles.map((p) => ({
    ...p,
    cuenta_nombre:
      p.cuenta_id != null
        ? (nombrePorCuenta.get(p.cuenta_id) ?? 'Cuenta')
        : null,
  }))

  const hoy = hoyLocal()

  const horizonte = calcularHorizonte(
    {
      proximoIngreso: configuracion?.proximo_ingreso ?? null,
      preferido: configuracion?.horizonte_preferido ?? null,
      preferidoFecha: configuracion?.horizonte_fecha ?? null,
    },
    hoy
  )

  const resultado = calcularDisponible(cuentas, pagosConNombre, horizonte, hoy)

  return {
    cuentas,
    pagos: pagosConNombre,
    movimientos: movimientos.map((t) => ({
      ...t,
      cuenta_nombre: nombrePorCuenta.get(t.cuenta_id) ?? 'Cuenta',
    })),
    alertas: detectarAlertas(cuentas, pagosConNombre),
    vista: configuracion?.vista === 'escritorio' ? 'escritorio' : 'movil',
    widgetsActivos: sanearWidgetsActivos(configuracion?.widgets),
    categorias: Object.fromEntries(
      (respuestaAnalitica[1].data ?? []).map((c: { categoria_id: number; nombre: string }) => [
        String(c.categoria_id),
        c.nombre,
      ])
    ),
    movimientosAnalitica: (respuestaAnalitica[0].data ?? []).map(
      (m: { tipo: string; monto: number; fecha: string; categoria_id: number | null }) => ({
        tipo: m.tipo as TipoMovimiento,
        monto: aEntero(m.monto),
        fecha: m.fecha,
        categoria_id: m.categoria_id ?? null,
      })
    ),
    flujoMensual,
    dineroLiquido: resultado.disponible + resultado.totalIncluido,
    totalPagos: resultado.totalIncluido,
    disponibleReal: resultado.disponible,
    horizonte,
    presionFutura: resultado.presionFutura,
    proximoIngreso: configuracion?.proximo_ingreso ?? null,
    actualizado: configuracion?.actualizado ?? null,
    desactualizado:
      configuracion?.actualizado != null &&
      diasEntre(configuracion.actualizado.slice(0, 10), hoy) > 7,
  }
  } catch (e) {
    logError({ accion: 'obtenerDatosDashboard' }, e)
    throw e
  }
}

// ---------------------------------------------------------------------------
// Escrituras (servidor, vía RPC atómicos)
// ---------------------------------------------------------------------------

export async function registrarMovimiento(datos: {
  cuentaId: number
  tipo: TipoMovimiento
  monto: number
  descripcion?: string
  categoriaId?: number | null
}): Promise<Respuesta> {
  return intentar('registrarMovimiento', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const monto = aCentavos(datos.monto)
    if (monto <= 0) throw new Error('monto_invalido')

    // Una sola ida: el insert resuelve operación y categoría dentro de la RPC.
    const [resultadoRpc, consultaCuenta] = await Promise.all([
      cliente.rpc('fynz_insertar_movimiento', {
        p_usuario: user.id,
        p_cuenta_id: datos.cuentaId,
        p_tipo: datos.tipo,
        p_monto: monto,
        p_descripcion: datos.descripcion?.trim() || null,
        p_fecha: hoyLocal(),
        p_operacion: null,
        p_idempotencia: nuevoIdem(),
        p_categoria_id: datos.categoriaId ?? null,
      }),
      cliente
        .from('cuenta')
        .select('metodo')
        .eq('cuenta_id', datos.cuentaId)
        .eq('usuario_id', user.id)
        .maybeSingle(),
    ])

    if (resultadoRpc.error) throw new Error(resultadoRpc.error.message)

    if (consultaCuenta.data?.metodo === 'credito') {
      try {
        await sincronizarCompromisosTarjeta(user.id, datos.cuentaId, cliente)
      } catch {
        // Los compromisos de la tarjeta se re-sincronizan en la próxima operación.
      }
    }
  })
}

export async function transferir(datos: {
  cuentaOrigen: number
  cuentaDestino: number
  monto: number
  origenNombre: string
  destinoNombre: string
}): Promise<Respuesta> {
  return intentar('transferir', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const monto = aCentavos(datos.monto)
    if (monto <= 0) throw new Error('monto_invalido')

    const { error } = await cliente.rpc('fynz_transferir', {
      p_usuario: user.id,
      p_cuenta_origen: datos.cuentaOrigen,
      p_cuenta_destino: datos.cuentaDestino,
      p_monto: monto,
      p_fecha: hoyLocal(),
      p_idem_origen: nuevoIdem(),
      p_idem_destino: nuevoIdem(),
      p_nombre_origen: datos.origenNombre,
      p_nombre_destino: datos.destinoNombre,
    })
    if (error) throw errorDesdeRpc(error)

    await registrarAuditoria(cliente, user.id, 'transferir', 'cuenta', datos.cuentaOrigen)
  })
}

export async function crearCuenta(datos: {
  nombre: string
  metodo: Metodo
  balanceInicial: number
  diaCorte?: number | null
  diaPago?: number | null
  limite?: number | null
}): Promise<Respuesta> {
  return intentar('crearCuenta', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { data: cuentaId, error } = await cliente.rpc(
      'fynz_crear_cuenta',
      {
        p_usuario: user.id,
        p_nombre: datos.nombre,
        p_metodo: datos.metodo,
        p_balance_inicial: aCentavos(datos.balanceInicial),
        p_dia_corte: datos.metodo === 'credito' ? (datos.diaCorte ?? null) : null,
        p_dia_pago: datos.metodo === 'credito' ? (datos.diaPago ?? null) : null,
        p_limite: datos.metodo === 'credito' ? (datos.limite ?? null) : null,
      }
    )
    if (error) throw errorDesdeRpc(error)

    if (datos.metodo === 'credito' && typeof cuentaId === 'number') {
      try {
        await sincronizarCompromisosTarjeta(user.id, cuentaId, cliente)
      } catch {
        // Los compromisos de la tarjeta se re-sincronizan en la próxima operación.
      }
    }
  })
}

export async function actualizarCuenta(
  cuentaId: number,
  datos: {
    nombre: string
    metodo: Metodo
    saldoObjetivo: number
    diaCorte?: number | null
    diaPago?: number | null
    limite?: number | null
  }
): Promise<Respuesta> {
  return intentar('actualizarCuenta', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { error } = await cliente.rpc('fynz_actualizar_cuenta', {
      p_usuario: user.id,
      p_cuenta_id: cuentaId,
      p_nombre: datos.nombre,
      p_metodo: datos.metodo,
      p_saldo_objetivo: aCentavos(datos.saldoObjetivo),
      p_dia_corte: datos.metodo === 'credito' ? (datos.diaCorte ?? null) : null,
      p_dia_pago: datos.metodo === 'credito' ? (datos.diaPago ?? null) : null,
      p_limite: datos.metodo === 'credito' ? (datos.limite ?? null) : null,
      p_fecha_hoy: hoyLocal(),
      p_idem_ajuste: nuevoIdem(),
    })
    if (error) throw errorDesdeRpc(error)

    if (datos.metodo === 'credito') {
      try {
        await sincronizarCompromisosTarjeta(user.id, cuentaId, cliente)
      } catch {
        // Los compromisos de la tarjeta se re-sincronizan en la próxima operación.
      }
    }
  })
}

export async function eliminarCuenta(cuentaId: number): Promise<Respuesta> {
  return intentar('eliminarCuenta', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { error } = await cliente.rpc('fynz_eliminar_cuenta', {
      p_usuario: user.id,
      p_cuenta_id: cuentaId,
    })
    if (error) throw errorDesdeRpc(error)

    await registrarAuditoria(cliente, user.id, 'eliminar_cuenta', 'cuenta', cuentaId)
  })
}

export async function crearProximoPago(datos: {
  descripcion: string
  monto: number
  fechaVencimiento?: string | null
  domiciliado: boolean
  cuentaId?: number | null
  frecuencia: Frecuencia
  diaCobro?: number | null
}): Promise<Respuesta> {
  return intentar('crearProximoPago', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    if (!esFrecuencia(datos.frecuencia)) throw new Error('frecuencia_invalida')
    const recurrente = esRecurrente(datos.frecuencia)
    const monto = aCentavos(datos.monto)
    if (monto <= 0) throw new Error('monto_invalido')

    const fecha = fechaInicialPago({
      frecuencia: datos.frecuencia,
      fechaVencimiento: datos.fechaVencimiento,
      diaCobro: datos.diaCobro ?? null,
      hoy: hoyLocal(),
    })

    if (!fecha || fecha.length < 10) throw new Error('fecha_invalida')

    const { error } = await cliente.rpc('fynz_insertar_pago', {
      p_usuario: user.id,
      p_descripcion: datos.descripcion,
      p_monto: monto,
      p_fecha_vencimiento: fecha.slice(0, 10),
      p_domiciliado: datos.domiciliado,
      p_cuenta_id: datos.domiciliado ? (datos.cuentaId ?? null) : null,
      p_recurrente: recurrente,
      p_dia_cobro:
        datos.frecuencia === 'mensual' ? (datos.diaCobro ?? null) : null,
      p_es_tarjeta: false,
      p_idempotencia: nuevoIdem(),
      p_frecuencia: datos.frecuencia,
    })
    if (error) throw errorDesdeRpc(error)
  })
}

export async function actualizarProximoPago(
  pagoId: number,
  datos: {
    descripcion: string
    monto: number
    fechaVencimiento?: string | null
    domiciliado: boolean
    cuentaId?: number | null
    frecuencia: Frecuencia
    diaCobro?: number | null
    reprogramarFecha?: string | null
  }
): Promise<Respuesta> {
  return intentar('actualizarProximoPago', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    if (!esFrecuencia(datos.frecuencia)) throw new Error('frecuencia_invalida')
    const recurrente = esRecurrente(datos.frecuencia)
    const monto = aCentavos(datos.monto)
    if (monto <= 0) throw new Error('monto_invalido')

    const fecha = fechaInicialPago({
      frecuencia: datos.frecuencia,
      fechaVencimiento: datos.fechaVencimiento,
      diaCobro: datos.diaCobro ?? null,
      hoy: hoyLocal(),
      reprogramarFecha: datos.reprogramarFecha,
    })

    if (!fecha || fecha.length < 10) throw new Error('fecha_invalida')

    const { error } = await cliente.rpc('fynz_actualizar_pago', {
      p_usuario: user.id,
      p_pago_id: pagoId,
      p_descripcion: datos.descripcion,
      p_monto: monto,
      p_fecha_vencimiento: fecha,
      p_domiciliado: datos.domiciliado,
      p_cuenta_id: datos.domiciliado ? (datos.cuentaId ?? null) : null,
      p_recurrente: recurrente,
      p_dia_cobro:
        datos.frecuencia === 'mensual' ? (datos.diaCobro ?? null) : null,
      p_frecuencia: datos.frecuencia,
    })
    if (error) throw errorDesdeRpc(error)
  })
}

export async function eliminarProximoPago(
  pagoId: number
): Promise<Respuesta> {
  return intentar('eliminarProximoPago', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { error } = await cliente.rpc('fynz_eliminar_pago', {
      p_usuario: user.id,
      p_pago_id: pagoId,
    })
    if (error) throw errorDesdeRpc(error)

    await registrarAuditoria(cliente, user.id, 'eliminar_pago', 'proximo_pago', pagoId)
  })
}

export async function liquidarPago(
  pagoId: number,
  datos: { cuentaId: number; monto: number }
): Promise<Respuesta> {
  return intentar('liquidarPago', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const monto = aCentavos(datos.monto)
    if (monto <= 0) throw new Error('monto_invalido')

    const { data: pago } = await cliente
      .from('proximo_pago')
      .select('es_tarjeta, cuenta_id')
      .eq('proximo_pago_id', pagoId)
      .eq('usuario_id', user.id)
      .maybeSingle()
    if (!pago) throw new Error('pago_no_encontrado')

    const { error } = await cliente.rpc('fynz_liquidar_pago', {
      p_usuario: user.id,
      p_pago_id: pagoId,
      p_cuenta_id: datos.cuentaId,
      p_monto: monto,
      p_fecha: hoyLocal(),
      p_idem_egreso: nuevoIdem(),
      p_idem_tarjeta: nuevoIdem(),
    })
    if (error) throw errorDesdeRpc(error)

    await registrarAuditoria(cliente, user.id, 'liquidar_pago', 'proximo_pago', pagoId)

    if (pago.es_tarjeta === true && pago.cuenta_id != null) {
      try {
        await sincronizarCompromisosTarjeta(user.id, pago.cuenta_id, cliente)
      } catch {
        // Los compromisos se re-sincronizan con la siguiente operación.
      }
    }
  })
}

export interface DatosPuestaAlDia {
  ajustes: Array<{ cuentaId: number; saldoObjetivo: number }>
  pagos: Array<{ pagoId: number; cuentaOrigen: number }>
}

export type RespuestaPuestaAlDia =
  | {
      ok: true
      resumen: { cuentasAjustadas: number; pagosLiquidados: number }
    }
  | { ok: false; error: string }

interface CuentaPuestaAlDiaServidor {
  cuenta_id: number
  nombre: string
  metodo: Metodo
  dia_corte: number | null
  dia_pago: number | null
  limite: number | null
}

interface PagoPuestaAlDiaServidor {
  proximo_pago_id: number
  descripcion: string
  monto: number
  fecha_vencimiento: string
  pagado: boolean
  archivada: boolean
  es_tarjeta: boolean
  cuenta_id: number | null
}

/**
 * Puesta al día: liquida los pagos vencidos seleccionados y luego ajusta las
 * cuentas al saldo o deuda real de hoy. Los saldos se leen de la base de datos,
 * nunca del cliente. El orden es intencional: primero los pagos, después los
 * ajustes, para que el saldo final sea exactamente el que escribió la persona.
 */
export async function ponerAlDia(
  datos: DatosPuestaAlDia
): Promise<RespuestaPuestaAlDia> {
  const inicio = Date.now()

  try {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    if (!Array.isArray(datos.ajustes) || !Array.isArray(datos.pagos)) {
      throw new Error('datos_invalidos')
    }
    if (datos.ajustes.length > 100 || datos.pagos.length > 100) {
      throw new Error('datos_invalidos')
    }

    const ajustesPorCuenta = new Map<number, number>()
    for (const ajuste of datos.ajustes) {
      const cuentaId = Number(ajuste.cuentaId)
      const saldoObjetivo = Number(ajuste.saldoObjetivo)
      if (
        !Number.isInteger(cuentaId) ||
        cuentaId <= 0 ||
        !Number.isInteger(saldoObjetivo) ||
        saldoObjetivo < 0
      ) {
        throw new Error('datos_invalidos')
      }
      ajustesPorCuenta.set(cuentaId, saldoObjetivo)
    }

    const pagosPorSeleccion = new Map<number, number>()
    for (const pago of datos.pagos) {
      const pagoId = Number(pago.pagoId)
      const cuentaOrigen = Number(pago.cuentaOrigen)
      if (
        !Number.isInteger(pagoId) ||
        pagoId <= 0 ||
        !Number.isInteger(cuentaOrigen) ||
        cuentaOrigen <= 0
      ) {
        throw new Error('datos_invalidos')
      }
      pagosPorSeleccion.set(pagoId, cuentaOrigen)
    }

    const listaAjustes = [...ajustesPorCuenta].map(
      ([cuentaId, saldoObjetivo]) => ({ cuentaId, saldoObjetivo })
    )
    const listaPagos = [...pagosPorSeleccion].map(
      ([pagoId, cuentaOrigen]) => ({ pagoId, cuentaOrigen })
    )

    if (listaAjustes.length === 0 && listaPagos.length === 0) {
      throw new Error('sin_cambios')
    }

    const idsCuentas = [
      ...new Set([
        ...listaAjustes.map((ajuste) => ajuste.cuentaId),
        ...listaPagos.map((pago) => pago.cuentaOrigen),
      ]),
    ]

    const { data: cuentasData, error: errorCuentas } = await cliente
      .from('cuenta')
      .select('cuenta_id, nombre, metodo, dia_corte, dia_pago, limite')
      .eq('usuario_id', user.id)
      .eq('archivada', false)
      .in('cuenta_id', idsCuentas)
    if (errorCuentas) throw errorDesdeRpc(errorCuentas)

    const cuentaPorId = new Map<number, CuentaPuestaAlDiaServidor>()
    for (const cuenta of (cuentasData ?? []) as CuentaPuestaAlDiaServidor[]) {
      cuentaPorId.set(cuenta.cuenta_id, {
        cuenta_id: Number(cuenta.cuenta_id),
        nombre: cuenta.nombre,
        metodo: cuenta.metodo,
        dia_corte: cuenta.dia_corte != null ? aEntero(cuenta.dia_corte) : null,
        dia_pago: cuenta.dia_pago != null ? aEntero(cuenta.dia_pago) : null,
        limite: cuenta.limite != null ? aEntero(cuenta.limite) : null,
      })
    }

    for (const ajuste of listaAjustes) {
      if (!cuentaPorId.has(ajuste.cuentaId)) {
        throw new Error('cuenta_no_encontrada')
      }
    }

    const pagoPorId = new Map<number, PagoPuestaAlDiaServidor>()
    if (listaPagos.length > 0) {
      const { data: pagosData, error: errorPagos } = await cliente
        .from('proximo_pago')
        .select(
          'proximo_pago_id, descripcion, monto, fecha_vencimiento, pagado, archivada, es_tarjeta, cuenta_id'
        )
        .eq('usuario_id', user.id)
        .in(
          'proximo_pago_id',
          listaPagos.map((pago) => pago.pagoId)
        )
      if (errorPagos) throw errorDesdeRpc(errorPagos)

      for (const pago of (pagosData ?? []) as PagoPuestaAlDiaServidor[]) {
        pagoPorId.set(Number(pago.proximo_pago_id), {
          ...pago,
          monto: aEntero(pago.monto),
          cuenta_id: pago.cuenta_id != null ? Number(pago.cuenta_id) : null,
        })
      }
    }

    const hoy = hoyLocal()
    const pagosEjecutar: Array<{
      pagoId: number
      cuentaOrigen: number
      monto: number
    }> = []

    for (const seleccion of listaPagos) {
      const pago = pagoPorId.get(seleccion.pagoId)
      if (!pago || pago.archivada) throw new Error('pago_no_encontrado')
      if (pago.pagado) continue
      if (!esAtrasado(pago.fecha_vencimiento, hoy)) {
        throw new Error('pago_no_vencido')
      }

      const origen = cuentaPorId.get(seleccion.cuentaOrigen)
      if (!origen) throw new Error('cuenta_no_encontrada')
      if (origen.metodo === 'credito') throw new Error('cuenta_no_liquida')
      if (pago.monto <= 0) throw new Error('monto_invalido')

      pagosEjecutar.push({
        pagoId: seleccion.pagoId,
        cuentaOrigen: seleccion.cuentaOrigen,
        monto: pago.monto,
      })
    }

    // 1. Liquidar pagos vencidos (ya validados contra la base de datos).
    let pagosLiquidados = 0
    for (const pago of pagosEjecutar) {
      const resultado = await liquidarPago(pago.pagoId, {
        cuentaId: pago.cuentaOrigen,
        monto: pago.monto,
      })
      if (!resultado.ok) {
        if (resultado.error === MENSAJES_SQL.pago_ya_liquidado) continue
        return { ok: false, error: resultado.error }
      }
      pagosLiquidados += 1
    }

    // 2. Ajustar cada cuenta al saldo o deuda real de hoy.
    let cuentasAjustadas = 0
    for (const ajuste of listaAjustes) {
      const cuenta = cuentaPorId.get(ajuste.cuentaId)
      if (!cuenta) throw new Error('cuenta_no_encontrada')

      const resultado = await actualizarCuenta(ajuste.cuentaId, {
        nombre: cuenta.nombre,
        metodo: cuenta.metodo,
        saldoObjetivo: ajuste.saldoObjetivo,
        diaCorte: cuenta.dia_corte,
        diaPago: cuenta.dia_pago,
        limite: cuenta.limite,
      })
      if (!resultado.ok) return { ok: false, error: resultado.error }
      cuentasAjustadas += 1
    }

    // 3. Marcar la configuración como actualizada hoy.
    const { error: errorConfig } = await cliente.rpc(
      'fynz_guardar_configuracion',
      {
        p_usuario: user.id,
        p_widgets: null,
        p_vista: null,
        p_proximo_ingreso: null,
        p_horizonte_preferido: null,
      }
    )
    if (errorConfig) {
      logError(
        { accion: 'ponerAlDia', contexto: 'configuracion' },
        errorDesdeRpc(errorConfig)
      )
    }

    // 4. Re-sincronizar los ciclos de las tarjetas afectadas.
    const tarjetas = new Set<number>()
    for (const ajuste of listaAjustes) {
      if (cuentaPorId.get(ajuste.cuentaId)?.metodo === 'credito') {
        tarjetas.add(ajuste.cuentaId)
      }
    }
    for (const pago of pagosEjecutar) {
      const fila = pagoPorId.get(pago.pagoId)
      if (fila?.es_tarjeta && fila.cuenta_id != null) {
        tarjetas.add(fila.cuenta_id)
      }
    }
    for (const tarjetaId of tarjetas) {
      try {
        await sincronizarCompromisosTarjeta(user.id, tarjetaId, cliente)
      } catch {
        // La puesta al día ya quedó aplicada; se re-sincroniza en la próxima operación.
      }
    }

    await registrarAuditoria(cliente, user.id, 'poner_al_dia', 'cuenta')

    return {
      ok: true,
      resumen: { cuentasAjustadas, pagosLiquidados },
    }
  } catch (e) {
    logError({ accion: 'ponerAlDia' }, e, Date.now() - inicio)
    return { ok: false, error: traducirError(e) }
  }
}

export async function guardarWidgetsActivos(
  activos: string[]
): Promise<Respuesta> {
  return intentar('guardarWidgetsActivos', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const widgets = sanearWidgetsActivos({ activos })

    const { error } = await cliente.rpc('fynz_guardar_configuracion', {
      p_usuario: user.id,
      p_widgets: { activos: widgets },
      p_vista: null,
      p_proximo_ingreso: null,
      p_horizonte_preferido: null,
    })
    if (error) throw errorDesdeRpc(error)
  })
}

export async function guardarHorizonte(datos: {
  preferido: number | null
  fecha: string | null
}): Promise<Respuesta> {
  return intentar('guardarHorizonte', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { error } = await cliente.rpc('fynz_guardar_horizonte', {
      p_usuario: user.id,
      p_horizonte_preferido: datos.preferido,
      p_horizonte_fecha: datos.fecha?.slice(0, 10) ?? null,
    })
    if (error) throw errorDesdeRpc(error)
  })
}

export async function guardarProximoIngreso(
  fecha: string | null
): Promise<Respuesta> {
  return intentar('guardarProximoIngreso', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { error } = await cliente.rpc('fynz_guardar_proximo_ingreso', {
      p_usuario: user.id,
      p_proximo_ingreso: fecha?.slice(0, 10) ?? null,
    })
    if (error) throw errorDesdeRpc(error)
  })
}

export async function solicitarRecuperacion(email: string): Promise<Respuesta> {
  return intentar('solicitarRecuperacion', async () => {
    const listaCabeceras = await headers()
    const origin = listaCabeceras.get('origin') ?? 'http://localhost:3000'
    const cliente = await createServerSupabase()
    const { error } = await cliente.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/recuperar`,
    })
    if (error) throw errorDesdeRpc(error)
  })
}

export async function guardarMontoManualTarjeta(
  pagoId: number,
  datos: { objetivoManual: number | null; minimo: number | null }
): Promise<Respuesta> {
  return intentar('guardarMontoManualTarjeta', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { data: pago } = await cliente
      .from('proximo_pago')
      .select('es_tarjeta, cuenta_id, ciclo_id, fecha_vencimiento')
      .eq('proximo_pago_id', pagoId)
      .eq('usuario_id', user.id)
      .maybeSingle()
    if (!pago || pago.es_tarjeta !== true || pago.cuenta_id == null) {
      throw new Error('pago_no_encontrado')
    }

    let cicloId: number | null = pago.ciclo_id ?? null
    if (cicloId == null) {
      const { data: ciclo } = await cliente
        .from('ciclo_tarjeta')
        .select('ciclo_id')
        .eq('usuario_id', user.id)
        .eq('cuenta_id', pago.cuenta_id)
        .eq('fecha_pago', pago.fecha_vencimiento)
        .maybeSingle()
      cicloId = ciclo?.ciclo_id ?? null
    }
    if (cicloId == null) throw new Error('pago_no_encontrado')

    const objetivoManual = datos.objetivoManual != null ? aCentavos(datos.objetivoManual) : null
    if (objetivoManual != null && objetivoManual < 0) throw new Error('monto_invalido')
    const minimo = datos.minimo != null ? aCentavos(datos.minimo) : 0
    if (minimo < 0) throw new Error('monto_invalido')

    const { error } = await cliente
      .from('ciclo_tarjeta')
      .update({ objetivo_manual: objetivoManual, minimo })
      .eq('ciclo_id', cicloId)
      .eq('usuario_id', user.id)
    if (error) throw errorDesdeRpc(error)

    try {
      await sincronizarCompromisosTarjeta(user.id, pago.cuenta_id, cliente)
    } catch {
      // Se re-sincroniza con la siguiente operación.
    }
  })
}

export async function adelantarPeriodo(pagoId: number): Promise<Respuesta> {
  return intentar('adelantarPeriodo', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { error } = await cliente.rpc('fynz_adelantar_periodo', {
      p_usuario: user.id,
      p_pago_id: pagoId,
      p_hoy: hoyLocal(),
    })
    if (error) throw errorDesdeRpc(error)

    await registrarAuditoria(cliente, user.id, 'adelantar_periodo', 'proximo_pago', pagoId)
  })
}

export async function cambiarContrasena(nuevaPassword: string): Promise<Respuesta> {
  return intentar('cambiarContrasena', async () => {
    const cliente = await clienteAutenticado()
    if (!cliente) throw new Error('no_autorizado')
    if (nuevaPassword.length < 8) throw new Error('contrasena_corta')
    const {
      data: { user },
    } = await cliente.auth.getUser()
    if (!user) throw new Error('no_autorizado')

    const { error } = await cliente.auth.updateUser({ password: nuevaPassword })
    if (error) throw errorDesdeRpc(error)

    await registrarAuditoria(cliente, user.id, 'cambio_contrasena', 'usuario')
  })
}
