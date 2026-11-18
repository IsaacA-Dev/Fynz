export interface RegistroLog {
  accion: string
  ids?: Array<number | null | undefined>
  contexto?: string
}

function mensajeDeError(error: unknown): { mensaje: string; code: string } {
  if (error instanceof Error) {
    const code =
      (error as Error & { code?: string }).code ??
      (error as Error & { codeDetail?: string }).codeDetail ??
      'n/a'
    return { mensaje: error.message.slice(0, 300), code: String(code) }
  }
  if (typeof error === 'string') {
    return { mensaje: error.slice(0, 300), code: 'n/a' }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const objeto = error as { message?: unknown; code?: unknown }
    return {
      mensaje: String(objeto.message ?? '').slice(0, 300),
      code: String(objeto.code ?? 'n/a'),
    }
  }
  return { mensaje: String(error ?? 'desconocido').slice(0, 300), code: 'n/a' }
}

export function logError(
  registro: RegistroLog,
  error: unknown,
  duracionMs?: number
): void {
  const { mensaje, code } = mensajeDeError(error)
  const ids = (registro.ids ?? []).filter((id): id is number => id != null)
  const stack =
    error instanceof Error
      ? (error.stack?.split('\n').slice(1, 4).join(' | ') ?? '')
      : ''

  console.error(
    `[fynz] accion=${registro.accion}` +
      `${ids.length > 0 ? ` ids=${ids.join(',')}` : ''}` +
      `${registro.contexto ? ` ctx=${registro.contexto}` : ''}` +
      ` code=${code} err=${mensaje}` +
      `${duracionMs != null ? ` ms=${duracionMs}` : ''}` +
      `${stack ? ` stack=${stack}` : ''}`
  )
}

export function errorDesdeRpc(error: {
  message: string
  code?: string
  details?: string | null
  hint?: string | null
}): Error {
  const e = new Error(error.message)
  ;(e as Error & { code?: string }).code = error.code ?? undefined
  return e
}
