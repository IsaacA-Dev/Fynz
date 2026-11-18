import { describe, expect, spyOn, test } from 'bun:test'
import { errorDesdeRpc, logError } from './logs'

describe('logError', () => {
  test('registra accion, ids, code y mensaje', () => {
    const spy = spyOn(console, 'error')
    spy.mockImplementation(() => {})

    logError(
      { accion: 'crearCuenta', ids: [7, null] },
      Object.assign(new Error('saldo_invalido'), { code: 'P0001' }),
      502
    )

    expect(spy).toHaveBeenCalled()
    const salida = spy.mock.calls[0][0] as string
    expect(salida).toContain('[fynz]')
    expect(salida).toContain('accion=crearCuenta')
    expect(salida).toContain('ids=7')
    expect(salida).toContain('code=P0001')
    expect(salida).toContain('err=saldo_invalido')
    expect(salida).toContain('ms=502')

    spy.mockRestore()
  })

  test('nunca escribe montos ni notas (solo estructura técnica)', () => {
    const spy = spyOn(console, 'error')
    spy.mockImplementation(() => {})
    logError({ accion: 'registrarMovimiento' }, new Error('monto_invalido'))
    const salida = spy.mock.calls[0][0] as string
    expect(salida).not.toContain('$')
    expect(salida).not.toContain('descripcion=')
    spy.mockRestore()
  })
})

describe('errorDesdeRpc', () => {
  test('conserva el code de PostgREST', () => {
    const error = errorDesdeRpc({ message: 'cuenta_no_encontrada', code: 'P0002' })
    expect(error.message).toBe('cuenta_no_encontrada')
    expect((error as Error & { code?: string }).code).toBe('P0002')
  })
})
