export const CATEGORIAS_SUGERIDAS = [
  'Comida',
  'Servicios',
  'Renta',
  'Transporte',
  'Salud',
  'Entretenimiento',
  'Otros',
]

export function normalizarNombreCategoria(nombre: string): string | null {
  const limpio = nombre.trim().replace(/\s+/g, ' ')
  if (limpio === '' || limpio.length > 40) return null
  return limpio
}
