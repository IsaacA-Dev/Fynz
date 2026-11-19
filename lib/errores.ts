export const MENSAJES_SQL: Record<string, string> = {
  no_autorizado: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  monto_invalido: 'El monto debe ser mayor a cero y válido.',
  tipo_invalido: 'El tipo de movimiento no es válido.',
  cuenta_no_encontrada: 'No encontramos esa cuenta. Puede que ya no exista.',
  cuenta_no_liquida: 'Debes pagar desde una cuenta de efectivo o débito.',
  cuentas_iguales: 'Elige dos cuentas diferentes.',
  cuenta_origen_no_encontrada: 'No encontramos la cuenta de origen.',
  cuenta_destino_no_encontrada: 'No encontramos la cuenta de destino.',
  transferencia_no_crediticia: 'Las tarjetas de crédito no participan en transferencias.',
  nombre_invalido: 'Escribe un nombre válido.',
  metodo_invalido: 'El método de la cuenta no es válido.',
  saldo_invalido: 'El saldo de la cuenta no es válido.',
  limite_invalido: 'El límite de la tarjeta no es válido.',
  ciclo_incompleto: 'Si defines el ciclo de la tarjeta necesitas corte y pago.',
  descripcion_invalida: 'Escribe una descripción válida.',
  fecha_invalida: 'Elige una fecha válida.',
  horizonte_invalido: 'Elige un horizonte válido.',
  categoria_no_encontrada: 'No encontramos esa categoría. Es posible que ya no exista.',
  pago_no_encontrado: 'No encontramos ese pago. Es posible que ya no exista.',
  pago_ya_liquidado: 'Este pago ya fue liquidado.',
  pago_no_adelantable: 'Solo se pueden adelantar pagos mensuales normales.',
  ya_existe_siguiente_periodo: 'Ya existe el siguiente periodo de este pago.',
  pago_no_vencido: 'Ese pago todavía no está vencido.',
  frecuencia_invalida: 'La frecuencia del pago no es válida.',
  dia_cobro_invalido: 'Elige un día de cobro entre 1 y 31.',
  sin_cambios: 'No hay cambios que guardar.',
  datos_invalidos: 'Los datos de la puesta al día no son válidos.',
  contrasena_corta: 'La contraseña debe tener al menos 8 caracteres.',
}

export function traducirError(e: unknown): string {
  const crudo =
    e instanceof Error
      ? e.message
      : typeof e === 'string'
        ? e
        : ''
  if (crudo.includes('duplicate')) {
    return 'Ya tienes una categoría con ese nombre.'
  }
  for (const [clave, mensaje] of Object.entries(MENSAJES_SQL)) {
    if (crudo.includes(clave)) return mensaje
  }
  return 'No se pudo completar la operación. Intenta de nuevo.'
}
