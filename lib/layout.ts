import { FILTROS_DEFECTO, sanearFiltros, type FiltrosTablero } from './tablero'

export type TipoBloque = 'hero' | 'estadisticas' | 'acciones' | 'cuentas' | 'pagos' | 'historial' | 'widget'

export type AnchoBloque = 1 | 2 | 3 | 4
export type CantFilas = 1 | 2

export interface BloqueLayout {
  id: string
  tipo: TipoBloque
  widget?: string
  filtros: FiltrosTablero
  ancho: AnchoBloque
  filas: CantFilas
}

export interface ConfiguracionLayout {
  version: number
  bloques: BloqueLayout[]
}

export const LAYOUT_VERSION = 3

const TIPOS_VALIDOS = new Set<TipoBloque>([
  'hero',
  'estadisticas',
  'acciones',
  'cuentas',
  'pagos',
  'historial',
  'widget',
])

let contadorBloques = 0

function nuevoId(prefix: string): string {
  contadorBloques += 1
  return `${prefix}-${Date.now()}-${contadorBloques}`
}

function bloque(
  tipo: TipoBloque,
  ancho: AnchoBloque,
  filas: CantFilas,
  extra: Partial<BloqueLayout> = {}
): BloqueLayout {
  return {
    id: nuevoId(tipo),
    tipo,
    filtros: { ...FILTROS_DEFECTO },
    ancho,
    filas,
    ...extra,
  }
}

export function layoutDefecto(): ConfiguracionLayout {
  return {
    version: LAYOUT_VERSION,
    bloques: [
      bloque('hero', 4, 2),
      bloque('estadisticas', 2, 1),
      bloque('acciones', 2, 1),
      bloque('cuentas', 2, 1),
      bloque('pagos', 2, 1),
      bloque('historial', 2, 1),
    ],
  }
}

function sanearAnchoValor(valor: unknown): AnchoBloque {
  const numero = Math.trunc(Number(valor))
  if (numero === 1 || numero === 2 || numero === 3 || numero === 4) return numero as AnchoBloque
  return 2
}

function sanearFilasValor(valor: unknown): CantFilas {
  if (valor == null || valor === '') return 1
  const numero = Math.trunc(Number(valor))
  if (numero === 1) return 1
  return 2
}

// La v2 usaba grid de 2 columnas (1 = media, 2/3 = completa).
// En la v3 (4 columnas) se convierte a: 1 → 2 (media), 2/3 → 4 (completa).
function convertirAnchoLegacy(valor: unknown): AnchoBloque {
  const numero = Number(valor)
  if (numero === 1) return 2
  if (numero === 2 || numero === 3) return 4
  return 2
}

function sanearBloqueValido(
  crudo: Record<string, unknown>,
  legado: boolean
): BloqueLayout | null {
  const tipo = typeof crudo.tipo === 'string' ? (crudo.tipo as TipoBloque) : null
  if (tipo == null || !TIPOS_VALIDOS.has(tipo)) return null

  const base = {
    id: typeof crudo.id === 'string' && crudo.id.trim() !== '' ? crudo.id : null,
    tipo,
    filtros: sanearFiltros(crudo.filtros),
    ancho: legado ? convertirAnchoLegacy(crudo.ancho) : sanearAnchoValor(crudo.ancho),
    filas: sanearFilasValor(crudo.filas),
  }

  if (tipo === 'widget') {
    const widget = typeof crudo.widget === 'string' ? crudo.widget : ''
    if (widget === '') return null
    return { ...base, id: base.id ?? nuevoId('widget'), widget, filtros: base.filtros, ancho: base.ancho, filas: base.filas }
  }

  return { ...base, id: base.id ?? nuevoId(tipo), filtros: base.filtros, ancho: base.ancho, filas: base.filas }
}

export function sanearLayout(valor: unknown): ConfiguracionLayout {
  let candidatos: Record<string, unknown>[] = []
  let legado = false

  if (valor && typeof valor === 'object') {
    const crudo = valor as Record<string, unknown>
    legado = Number(crudo.version ?? 0) !== LAYOUT_VERSION
    if (Array.isArray(crudo.bloques)) {
      candidatos = crudo.bloques as Record<string, unknown>[]
    } else if (Array.isArray(crudo.widgets)) {
      // Migración del shape anterior { widgets: [...] } de la zona de widgets.
      legado = true
      const base = layoutDefecto()
      candidatos = [
        ...base.bloques.map((b) => ({ ...b })),
        ...(crudo.widgets as Record<string, unknown>[]).map((w) => ({
          id: typeof w.key === 'string' ? w.key : undefined,
          tipo: 'widget',
          widget: typeof w.tipo === 'string' ? w.tipo : undefined,
          filtros: typeof w.filtros === 'object' ? w.filtros : undefined,
          ancho: 2,
        })),
      ]
    }
  }

  if (candidatos.length === 0) return layoutDefecto()

  const usadas = new Set<string>()
  const bloques: BloqueLayout[] = []
  let heroGuardado: BloqueLayout | null = null

  for (const candidato of candidatos) {
    if (!candidato || typeof candidato !== 'object') continue
    const saneado = sanearBloqueValido(candidato, legado)
    if (!saneado) continue

    if (saneado.tipo === 'hero') {
      if (heroGuardado) continue
      heroGuardado = saneado
    }

    let id = saneado.id
    if (usadas.has(id)) {
      let sufijo = bloques.length
      while (usadas.has(`${saneado.tipo}-${sufijo}`)) sufijo += 1
      id = `${saneado.tipo}-${sufijo}`
    }
    usadas.add(id)

    bloques.push({ ...saneado, id })
  }

  if (!heroGuardado) {
    const hero = bloque('hero', 4, 2)
    bloques.unshift(hero)
  } else {
    const indice = bloques.findIndex((b) => b.tipo === 'hero')
    if (indice > 0) {
      const [hero] = bloques.splice(indice, 1)
      bloques.unshift(hero)
    }
  }

  return { version: LAYOUT_VERSION, bloques }
}

export function bloquesVisibles(
  layout: ConfiguracionLayout,
  vista: 'movil' | 'escritorio'
): BloqueLayout[] {
  if (vista === 'escritorio') return layout.bloques
  return layout.bloques.filter((b) => b.tipo !== 'pagos' && b.tipo !== 'historial')
}

export function crearBloqueWidget(tipo: string, filtros: Partial<FiltrosTablero> = {}): BloqueLayout {
  return {
    id: nuevoId('widget'),
    tipo: 'widget',
    widget: tipo,
    filtros: { ...FILTROS_DEFECTO, ...filtros },
    ancho: 2,
    filas: 2,
  }
}

export function crearBloque(tipo: TipoBloque): BloqueLayout | null {
  if (!TIPOS_VALIDOS.has(tipo) || tipo === 'hero') return null
  return bloque(tipo, 2, 1)
}

export function nombreBloque(tipo: TipoBloque): string {
  switch (tipo) {
    case 'hero':
      return 'Disponible Real'
    case 'estadisticas':
      return 'Resumen'
    case 'acciones':
      return 'Acciones rápidas'
    case 'cuentas':
      return 'Cuentas'
    case 'pagos':
      return 'Próximos pagos'
    case 'historial':
      return 'Historial reciente'
    case 'widget':
      return 'Widget'
  }
}

export interface SpecBloquePreset {
  tipo: TipoBloque
  ancho: AnchoBloque
  filas: CantFilas
}

export interface PresetLayout {
  id: string
  nombre: string
  descripcion: string
  bloques: SpecBloquePreset[]
  widgets: { ancho: AnchoBloque; filas: CantFilas; despuesDe: TipoBloque }
}

export const PRESETS_LAYOUT: PresetLayout[] = [
  {
    id: 'clasico',
    nombre: 'Clásico',
    descripcion: 'El Disponible Real protagonista arriba y las secciones en pares.',
    bloques: [
      { tipo: 'hero', ancho: 4, filas: 2 },
      { tipo: 'estadisticas', ancho: 2, filas: 1 },
      { tipo: 'acciones', ancho: 2, filas: 1 },
      { tipo: 'cuentas', ancho: 2, filas: 1 },
      { tipo: 'pagos', ancho: 2, filas: 1 },
      { tipo: 'historial', ancho: 2, filas: 1 },
    ],
    widgets: { ancho: 2, filas: 2, despuesDe: 'pagos' },
  },
  {
    id: 'columna',
    nombre: 'Columna',
    descripcion: 'El Disponible Real a la izquierda y tus listas a la derecha.',
    bloques: [
      { tipo: 'hero', ancho: 2, filas: 2 },
      { tipo: 'cuentas', ancho: 2, filas: 1 },
      { tipo: 'pagos', ancho: 2, filas: 1 },
      { tipo: 'estadisticas', ancho: 2, filas: 1 },
      { tipo: 'acciones', ancho: 2, filas: 1 },
      { tipo: 'historial', ancho: 4, filas: 1 },
    ],
    widgets: { ancho: 2, filas: 2, despuesDe: 'acciones' },
  },
  {
    id: 'compacto',
    nombre: 'Compacto',
    descripcion: 'Todo en menos filas para ver más de un vistazo.',
    bloques: [
      { tipo: 'hero', ancho: 4, filas: 1 },
      { tipo: 'estadisticas', ancho: 2, filas: 1 },
      { tipo: 'acciones', ancho: 2, filas: 1 },
      { tipo: 'cuentas', ancho: 2, filas: 1 },
      { tipo: 'pagos', ancho: 2, filas: 1 },
      { tipo: 'historial', ancho: 4, filas: 1 },
    ],
    widgets: { ancho: 2, filas: 1, despuesDe: 'pagos' },
  },
  {
    id: 'analitico',
    nombre: 'Analítico',
    descripcion: 'Prioridad a las gráficas y widgets sobre las listas.',
    bloques: [
      { tipo: 'hero', ancho: 2, filas: 2 },
      { tipo: 'estadisticas', ancho: 2, filas: 1 },
      { tipo: 'acciones', ancho: 2, filas: 1 },
      { tipo: 'cuentas', ancho: 2, filas: 1 },
      { tipo: 'pagos', ancho: 2, filas: 1 },
      { tipo: 'historial', ancho: 4, filas: 1 },
    ],
    widgets: { ancho: 2, filas: 2, despuesDe: 'acciones' },
  },
]

export function obtenerPreset(presetId: string): PresetLayout | null {
  return PRESETS_LAYOUT.find((p) => p.id === presetId) ?? null
}

// Reordena y redimensiona el layout según un preset sin perder instancias:
// conserva ids, filtros, widgets y bloques duplicados del usuario.
export function aplicarPreset(
  layout: ConfiguracionLayout,
  presetId: string
): ConfiguracionLayout {
  const preset = obtenerPreset(presetId)
  if (!preset) return layout

  const porTipo = new Map<TipoBloque, BloqueLayout[]>()
  for (const bloque of layout.bloques) {
    const lista = porTipo.get(bloque.tipo) ?? []
    lista.push(bloque)
    porTipo.set(bloque.tipo, lista)
  }

  const widgets = porTipo.get('widget') ?? []
  porTipo.delete('widget')

  const resultado: BloqueLayout[] = []

  const insertarWidgets = () => {
    while (widgets.length > 0) {
      const widget = widgets.shift()!
      resultado.push({ ...widget, ancho: preset.widgets.ancho, filas: preset.widgets.filas })
    }
  }

  for (const spec of preset.bloques) {
    const bloques = porTipo.get(spec.tipo)
    porTipo.delete(spec.tipo)
    if (bloques && bloques.length > 0) {
      resultado.push({ ...bloques[0], ancho: spec.ancho, filas: spec.filas })
      for (const extra of bloques.slice(1)) resultado.push(extra)
    }
    if (spec.tipo === preset.widgets.despuesDe) insertarWidgets()
  }

  insertarWidgets()
  for (const restantes of porTipo.values()) resultado.push(...restantes)

  return { ...layout, bloques: resultado }
}

export function coincideConPreset(
  layout: ConfiguracionLayout,
  presetId: string
): boolean {
  if (!obtenerPreset(presetId)) return false
  const aplicado = aplicarPreset(layout, presetId)
  if (layout.bloques.length !== aplicado.bloques.length) return false
  return layout.bloques.every((bloque, indice) => {
    const otro = aplicado.bloques[indice]
    return (
      bloque.id === otro.id && bloque.ancho === otro.ancho && bloque.filas === otro.filas
    )
  })
}
