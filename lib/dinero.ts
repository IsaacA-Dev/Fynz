export function parseCentavos(texto: string): number {
  if (typeof texto !== 'string') throw new Error('Monto inválido')
  const normalizado = texto.trim().replace(',', '.')
  if (normalizado === '' || normalizado === '-') throw new Error('Monto inválido')
  const valor = Number.parseFloat(normalizado)
  if (!Number.isFinite(valor)) throw new Error('Monto inválido')
  return Math.round(valor * 100)
}

export function aCentavos(valor: unknown): number {
  if (valor == null || valor === '') return 0
  let numero: number
  if (typeof valor === 'number') {
    numero = valor
  } else {
    numero = Number.parseFloat(String(valor).replace(',', '.'))
  }
  if (!Number.isFinite(numero)) throw new Error('Monto inválido')
  return Number.isInteger(numero) ? numero : Math.round(numero * 100)
}

export function formatearCentavos(centavos: number): string {
  const negativo = centavos < 0
  const abs = Math.abs(Math.trunc(centavos))
  const enteros = Math.floor(abs / 100)
  const fraccion = abs % 100
  const textoEnteros = enteros.toLocaleString('es-MX')
  return `${negativo ? '-' : ''}${textoEnteros}.${String(fraccion).padStart(2, '0')}`
}

export function centavosACadena(centavos: number): string {
  const abs = Math.abs(Math.trunc(centavos))
  const enteros = Math.floor(abs / 100)
  const fraccion = abs % 100
  return `${centavos < 0 ? '-' : ''}${enteros}.${String(fraccion).padStart(2, '0')}`
}
