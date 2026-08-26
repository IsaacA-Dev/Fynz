// Reglas compartidas del sistema de movimiento (Fase 0).
// Duración rápida: 150–220 ms. Duración normal: 300–450 ms. Animación destacada: 500–700 ms.
// Easing principal: out(3). Animar solo opacity, transform y valores numéricos.

export const duracionRapida = 200
export const duracionNormal = 350
export const duracionDestacada = 600

export type DuracionToken = 'rapida' | 'normal' | 'destacada'

export const duraciones: Record<DuracionToken, number> = {
  rapida: duracionRapida,
  normal: duracionNormal,
  destacada: duracionDestacada,
}

export const easingPrincipal = 'out(3)'

export function resolverDuracion(duracion: DuracionToken | number): number {
  return typeof duracion === 'number' ? duracion : duraciones[duracion]
}
