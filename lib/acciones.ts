import { supabase } from './supabase'

export async function calcularDisponibleReal(userId: string) {
  const [{ data: cuentas, error: eCuentas }, { data: pagos, error: ePagos }] =
    await Promise.all([
      supabase
        .from('cuenta')
        .select('balance_inicial')
        .eq('usuario_id', userId)
        .in('metodo', ['efectivo', 'debito']),
      supabase
        .from('proximo_pago')
        .select('monto')
        .eq('usuario_id', userId)
        .eq('pagado', false)
    ])

  if (eCuentas || ePagos) throw new Error('Error al consultar datos')

  const dineroLiquido = cuentas?.reduce((sum, c) => sum + Number(c.balance_inicial), 0) ?? 0
  const pagosProximos = pagos?.reduce((sum, p) => sum + Number(p.monto), 0) ?? 0

  return {
    dineroLiquido,
    pagosProximos,
    disponibleReal: dineroLiquido - pagosProximos
  }
}
