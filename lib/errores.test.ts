import { describe, expect, test } from 'bun:test'
import { traducirError } from './errores'

describe('traducirError', () => {
  test('mapea códigos conocidos de las RPC', () => {
    expect(traducirError(new Error('pago_ya_liquidado'))).toBe('Este pago ya fue liquidado.')
    expect(traducirError(new Error('cuenta_no_liquida'))).toBe(
      'Debes pagar desde una cuenta de efectivo o débito.'
    )
    expect(traducirError('transferencia_no_crediticia')).toBe(
      'Las tarjetas de crédito no participan en transferencias.'
    )
    expect(traducirError(new Error('no_autorizado'))).toContain('sesión')
  })

  test('mensajes de adelanto de periodo', () => {
    expect(traducirError(new Error('ya_existe_siguiente_periodo'))).toBe(
      'Ya existe el siguiente periodo de este pago.'
    )
    expect(traducirError(new Error('pago_no_adelantable'))).toContain('mensuales')
  })

  test('violación de duplicado → mensaje de categoría', () => {
    expect(
      traducirError(new Error('duplicate key value violates unique constraint'))
    ).toBe('Ya tienes una categoría con ese nombre.')
  })

  test('desconocidos → mensaje genérico', () => {
    expect(traducirError(new Error('algo_raro'))).toBe(
      'No se pudo completar la operación. Intenta de nuevo.'
    )
    expect(traducirError(null)).toBe('No se pudo completar la operación. Intenta de nuevo.')
  })
})
