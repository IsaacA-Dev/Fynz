import { describe, expect, test } from 'bun:test'
import {
  aplicarPreset,
  bloquesVisibles,
  coincideConPreset,
  crearBloque,
  crearBloqueWidget,
  layoutDefecto,
  obtenerPreset,
  PRESETS_LAYOUT,
  sanearLayout,
} from './layout'

describe('sanearLayout — por defecto y migración', () => {
  test('sin datos devuelve el layout por defecto con hero a fila completa', () => {
    const layout = sanearLayout(null)
    expect(layout.version).toBe(3)
    expect(layout.bloques[0].tipo).toBe('hero')
    expect(layout.bloques.map((b) => b.tipo)).toEqual([
      'hero',
      'estadisticas',
      'acciones',
      'cuentas',
      'pagos',
      'historial',
    ])
    for (const bloque of layout.bloques) {
      if (bloque.tipo === 'hero') {
        expect(bloque).toMatchObject({ ancho: 4, filas: 2 })
      } else {
        expect(bloque).toMatchObject({ ancho: 2, filas: 1 })
      }
    }
  })

  test('migra el shape anterior { widgets } a bloques', () => {
    const layout = sanearLayout({
      widgets: [
        { key: 'a-1', tipo: 'saldo-por-cuenta', filtros: { horizonte: 15, metodo: 'tarjetas', meses: 6 } },
        { key: 'b-1', tipo: 'carga-pagos', filtros: null },
      ],
    })

    const widgets = layout.bloques.filter((b) => b.tipo === 'widget')
    expect(widgets).toHaveLength(2)
    expect(widgets[0].widget).toBe('saldo-por-cuenta')
    expect(widgets[0].filtros).toEqual({ horizonte: 15, metodo: 'tarjetas', meses: 6 })
    expect(widgets[1].filtros).toEqual({ horizonte: null, metodo: 'todos', meses: 3 })
    expect(layout.bloques[0].tipo).toBe('hero')
  })
})

describe('sanearLayout — validaciones', () => {
  test('descarta tipos desconocidos y ancho inválido se normaliza a 2', () => {
    const layout = sanearLayout({
      bloques: [
        { id: 'x', tipo: 'no-existe' },
        { id: 'y', tipo: 'cuentas', filtros: { meses: 12 }, ancho: 9, filas: 9 },
      ],
    })

    const cuentas = layout.bloques.find((b) => b.id === 'y')
    expect(cuentas).toBeDefined()
    expect(cuentas?.filtros.meses).toBe(3)
    expect(cuentas?.ancho).toBe(2)
    expect(cuentas?.filas).toBe(2)
  })

  test('filas de layouts previos (3) se leen como máximo 2', () => {
    const layout = sanearLayout({
      version: 3,
      bloques: [{ id: 'w', tipo: 'widget', widget: 'carga-pagos', ancho: 2, filas: 3 }],
    })
    const widget = layout.bloques.find((b) => b.id === 'w')
    expect(widget?.filas).toBe(2)
  })

  test('regenera ids duplicados', () => {
    const layout = sanearLayout({
      bloques: [
        { id: 'mismo', tipo: 'cuentas' },
        { id: 'mismo', tipo: 'historial' },
      ],
    })
    const ids = layout.bloques.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('si falta el hero lo reinserta al inicio', () => {
    const layout = sanearLayout({
      bloques: [
        { id: 'a', tipo: 'cuentas' },
        { id: 'b', tipo: 'historial' },
      ],
    })
    expect(layout.bloques[0].tipo).toBe('hero')
    expect(layout.bloques.filter((b) => b.tipo === 'hero')).toHaveLength(1)
  })

  test('un hero duplicado se reduce a uno solo', () => {
    const layout = sanearLayout({
      bloques: [
        { id: 'h1', tipo: 'hero' },
        { id: 'h2', tipo: 'hero' },
        { id: 'x', tipo: 'cuentas' },
      ],
    })
    expect(layout.bloques.filter((b) => b.tipo === 'hero')).toHaveLength(1)
  })

  test('migra layouts v2 (grid de 2 columnas) a la cuadrícula 4 columnas', () => {
    const layout = sanearLayout({
      version: 2,
      bloques: [
        { id: 'h', tipo: 'hero', ancho: 2 },
        { id: 'a', tipo: 'cuentas', ancho: 1 },
        { id: 'b', tipo: 'pagos', ancho: 3 },
      ],
    })

    expect(layout.version).toBe(3)
    const bloques = Object.fromEntries(layout.bloques.map((b) => [b.id, b]))
    expect(bloques['h']?.ancho).toBe(4)
    expect(bloques['a']?.ancho).toBe(2)
    expect(bloques['b']?.ancho).toBe(4)
    expect(bloques['a']?.filas).toBe(1)
  })
})

describe('bloquesVisibles y fábricas', () => {
  test('en móvil se ocultan pagos e historial', () => {
    const layout = layoutDefecto()
    const visibles = bloquesVisibles(layout, 'movil')
    expect(visibles.map((b) => b.tipo)).not.toContain('pagos')
    expect(visibles.map((b) => b.tipo)).not.toContain('historial')
    expect(bloquesVisibles(layout, 'escritorio')).toHaveLength(layout.bloques.length)
  })

  test('crearBloque nunca crea un hero; los widgets llevan filtros base', () => {
    expect(crearBloque('hero')).toBeNull()
    const cuentas = crearBloque('cuentas')
    expect(cuentas?.tipo).toBe('cuentas')
    expect(cuentas).toMatchObject({ ancho: 2, filas: 1 })

    const widget = crearBloqueWidget('flujo-mensual', { meses: 6 })
    expect(widget).toMatchObject({ tipo: 'widget', widget: 'flujo-mensual', filtros: { meses: 6 } })
    expect(widget).toMatchObject({ ancho: 2, filas: 2 })
  })
})

describe('presets de layout', () => {
  test('hay cuatro presets con ids estables y dimensiones válidas', () => {
    expect(PRESETS_LAYOUT.map((p) => p.id)).toEqual([
      'clasico',
      'columna',
      'compacto',
      'analitico',
    ])
    for (const preset of PRESETS_LAYOUT) {
      expect(preset.nombre.trim().length).toBeGreaterThan(0)
      for (const spec of preset.bloques) {
        expect(spec.ancho).toBeGreaterThanOrEqual(1)
        expect(spec.ancho).toBeLessThanOrEqual(4)
        expect([1, 2]).toContain(spec.filas)
      }
      expect(preset.bloques.some((b) => b.tipo === 'hero')).toBe(true)
      expect(preset.bloques.some((b) => b.tipo === preset.widgets.despuesDe)).toBe(true)
    }
  })

  test('obtenerPreset devuelve null para un id desconocido', () => {
    expect(obtenerPreset('no-existe')).toBeNull()
    expect(obtenerPreset('clasico')?.nombre).toBe('Clásico')
  })

  test('el layout por defecto coincide con el preset clásico', () => {
    expect(coincideConPreset(layoutDefecto(), 'clasico')).toBe(true)
    expect(coincideConPreset(layoutDefecto(), 'columna')).toBe(false)
  })

  test('aplicar un preset reordena y redimensiona sin perder bloques', () => {
    const base = layoutDefecto()
    const widget = crearBloqueWidget('flujo-mensual', { meses: 6 })
    const layout = { ...base, bloques: [...base.bloques, widget] }

    const aplicado = aplicarPreset(layout, 'columna')
    const porId = new Map(aplicado.bloques.map((b) => [b.id, b]))

    expect(aplicado.bloques).toHaveLength(layout.bloques.length)
    expect(porId.get(widget.id)?.filtros.meses).toBe(6)
    expect(porId.get(widget.id)?.widget).toBe('flujo-mensual')

    const preset = obtenerPreset('columna')!
    const hero = preset.bloques.find((b) => b.tipo === 'hero')!
    const heroLayout = aplicado.bloques.find((b) => b.tipo === 'hero')!
    expect(heroLayout.ancho).toBe(hero.ancho)
    expect(heroLayout.filas).toBe(hero.filas)
  })

  test('aplicarPreset con id desconocido devuelve el mismo layout', () => {
    const base = layoutDefecto()
    expect(aplicarPreset(base, 'no-existe')).toBe(base)
  })

  test('aplicar un preset y volver a evaluar coincide con ese preset', () => {
    for (const preset of PRESETS_LAYOUT) {
      const aplicado = aplicarPreset(layoutDefecto(), preset.id)
      expect(coincideConPreset(aplicado, preset.id)).toBe(true)
    }
  })

  test('los widgets se insertan justo después del bloque ancla del preset', () => {
    const base = layoutDefecto()
    const widget = crearBloqueWidget('carga-pagos')
    const layout = { ...base, bloques: [...base.bloques, widget] }

    for (const preset of PRESETS_LAYOUT) {
      const aplicado = aplicarPreset(layout, preset.id)
      const idxAncla = aplicado.bloques.findIndex((b) => b.tipo === preset.widgets.despuesDe)
      const idxWidget = aplicado.bloques.findIndex((b) => b.id === widget.id)
      expect(idxWidget).toBe(idxAncla + 1)
    }
  })

  test('los widgets adoptan el tamaño definido por el preset', () => {
    const base = layoutDefecto()
    const widget = crearBloqueWidget('saldo-por-cuenta')
    const layout = { ...base, bloques: [...base.bloques, widget] }

    const compacto = aplicarPreset(layout, 'compacto')
    const preset = obtenerPreset('compacto')!
    const widgetAplicado = compacto.bloques.find((b) => b.id === widget.id)!
    expect(widgetAplicado.ancho).toBe(preset.widgets.ancho)
    expect(widgetAplicado.filas).toBe(preset.widgets.filas)
  })
})
