'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { reordenarLista } from '@/lib/tablero'
import { buscarDestino, type ElementoArrastrable } from '@/lib/drag'
import { useAnime } from '@/components/hooks/use-anime'

const UMBRAL_ARRASTRE = 5
const PAUSA_INTERCAMBIO = 120

interface UseReordenarParams<T extends { key: string }> {
  items: T[]
  columnas?: number
  alReordenar: (lista: T[]) => void
  alSoltar: (lista: T[]) => void
}

interface EstadoDrag {
  key: string | null
  pendiente: { key: string; x: number; y: number } | null
  offsetX: number
  offsetY: number
  ultimoCambio: number
}

export function useReordenar<T extends { key: string }>({
  items,
  columnas = 1,
  alReordenar,
  alSoltar,
}: UseReordenarParams<T>) {
  const { animar, reducirMovimiento } = useAnime()
  const [arrastrandoKey, setArrastrandoKey] = useState<string | null>(null)
  const [modoTeclado, setModoTeclado] = useState(false)
  const listaRef = useRef<HTMLDivElement | null>(null)
  const estadoRef = useRef({ items, alReordenar, alSoltar })
  const dragRef = useRef<EstadoDrag>({
    key: null,
    pendiente: null,
    offsetX: 0,
    offsetY: 0,
    ultimoCambio: 0,
  })
  const punteroRef = useRef({ x: 0, y: 0 })
  const frameRef = useRef(0)
  const tecladoRef = useRef<{ key: string | null; original: T[] | null }>({
    key: null,
    original: null,
  })
  const rectsPreviosRef = useRef(new Map<string, { left: number; top: number }>())
  const flipsRef = useRef(new Map<string, { pause: () => void }>())

  useEffect(() => {
    estadoRef.current = { items, alReordenar, alSoltar }
  })

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])

  const buscarElemento = useCallback((key: string): HTMLElement | null => {
    const lista = listaRef.current
    if (!lista) return null
    for (const el of Array.from(lista.querySelectorAll<HTMLElement>('[data-clave]'))) {
      if (el.getAttribute('data-clave') === key) return el
    }
    return null
  }, [])

  const elementosDrag = useCallback(
    (excluir: string | null): ElementoArrastrable[] => {
      const lista = listaRef.current
      if (!lista) return []
      return Array.from(lista.querySelectorAll<HTMLElement>('[data-clave]'))
        .filter((el) => el.getAttribute('data-clave') !== excluir)
        .map((el) => ({
          key: el.getAttribute('data-clave') ?? '',
          rect: el.getBoundingClientRect(),
        }))
        .filter((el) => el.key !== '')
    },
    []
  )

  const capturarParaFlip = useCallback(() => {
    const mapa = new Map<string, { left: number; top: number }>()
    for (const { key, rect } of elementosDrag(null)) {
      mapa.set(key, { left: rect.left, top: rect.top })
    }
    rectsPreviosRef.current = mapa
  }, [elementosDrag])

  const aplicarTransform = useCallback(() => {
    const drag = dragRef.current
    if (!drag.key) return
    const el = buscarElemento(drag.key)
    if (!el) return
    el.style.transform = ''
    const rect = el.getBoundingClientRect()
    const dx = punteroRef.current.x - drag.offsetX - rect.left
    const dy = punteroRef.current.y - drag.offsetY - rect.top
    el.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`
  }, [buscarElemento])

  const intentarReordenar = useCallback(
    (x: number, y: number) => {
      const drag = dragRef.current
      const { items: actuales, alReordenar: reordenar } = estadoRef.current
      if (!drag.key) return
      const ahora = performance.now()
      if (ahora - drag.ultimoCambio < PAUSA_INTERCAMBIO) return

      const destinoKey = buscarDestino(elementosDrag(drag.key), x, y)
      if (!destinoKey) return
      const desde = actuales.findIndex((i) => i.key === drag.key)
      const hasta = actuales.findIndex((i) => i.key === destinoKey)
      if (desde < 0 || hasta < 0 || desde === hasta) return

      capturarParaFlip()
      drag.ultimoCambio = ahora
      reordenar(reordenarLista(actuales, desde, hasta))
    },
    [capturarParaFlip, elementosDrag]
  )

  const limpiarEstilos = useCallback(
    (key: string) => {
      const el = buscarElemento(key)
      if (!el) return
      el.style.transform = ''
      el.style.willChange = ''
    },
    [buscarElemento]
  )

  useEffect(() => {
    const activar = (key: string) => {
      const drag = dragRef.current
      const origen = drag.pendiente
      drag.pendiente = null
      if (!origen) return
      const el = buscarElemento(key)
      if (!el) return
      const rect = el.getBoundingClientRect()
      drag.key = key
      drag.offsetX = origen.x - rect.left
      drag.offsetY = origen.y - rect.top
      drag.ultimoCambio = 0
      punteroRef.current = { x: origen.x, y: origen.y }
      el.style.willChange = 'transform'
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'
      setArrastrandoKey(key)
      aplicarTransform()
    }

    const mover = (evento: PointerEvent) => {
      const drag = dragRef.current
      if (!drag.key && !drag.pendiente) return
      punteroRef.current = { x: evento.clientX, y: evento.clientY }

      if (drag.pendiente) {
        const { x, y } = drag.pendiente
        if (Math.hypot(evento.clientX - x, evento.clientY - y) >= UMBRAL_ARRASTRE) {
          activar(drag.pendiente.key)
        } else {
          return
        }
      }

      if (!drag.key) return
      if (frameRef.current) return
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0
        aplicarTransform()
        intentarReordenar(punteroRef.current.x, punteroRef.current.y)
      })
    }

    const soltar = () => {
      const drag = dragRef.current
      if (drag.pendiente) {
        drag.pendiente = null
        return
      }
      const key = drag.key
      if (!key) return
      drag.key = null

      const el = buscarElemento(key)
      if (el) {
        el.style.transform = ''
        const rect = el.getBoundingClientRect()
        const dx = punteroRef.current.x - drag.offsetX - rect.left
        const dy = punteroRef.current.y - drag.offsetY - rect.top
        if (reducirMovimiento || (Math.abs(dx) < 2 && Math.abs(dy) < 2)) {
          limpiarEstilos(key)
        } else {
          animar(el, {
            duracion: 'rapida',
            translateX: [dx, 0],
            translateY: [dy, 0],
            scale: [1.02, 1],
            onComplete: () => limpiarEstilos(key),
          })
        }
      }

      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      setArrastrandoKey(null)
      estadoRef.current.alSoltar(estadoRef.current.items)
    }

    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    return () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  }, [
    animar,
    aplicarTransform,
    buscarElemento,
    intentarReordenar,
    limpiarEstilos,
    reducirMovimiento,
  ])

  // FLIP: tras cada reordenado, anima los demás bloques desde su posición previa.
  useLayoutEffect(() => {
    const previos = rectsPreviosRef.current
    if (previos.size === 0) return
    rectsPreviosRef.current = new Map()

    const drag = dragRef.current

    if (drag.key) {
      const el = buscarElemento(drag.key)
      if (el) {
        el.style.transform = ''
        const rect = el.getBoundingClientRect()
        const dx = punteroRef.current.x - drag.offsetX - rect.left
        const dy = punteroRef.current.y - drag.offsetY - rect.top
        el.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`
      }
    }

    if (reducirMovimiento) return
    for (const el of Array.from(
      listaRef.current?.querySelectorAll<HTMLElement>('[data-clave]') ?? []
    )) {
      const key = el.getAttribute('data-clave')
      if (!key || key === drag.key) continue
      const previo = previos.get(key)
      if (!previo) continue
      const rect = el.getBoundingClientRect()
      const dx = previo.left - rect.left
      const dy = previo.top - rect.top
      if (dx === 0 && dy === 0) continue
      flipsRef.current.get(key)?.pause()
      const animacion = animar(el, {
        duracion: 'rapida',
        translateX: [dx, 0],
        translateY: [dy, 0],
      })
      flipsRef.current.set(key, animacion)
    }
  }, [items, reducirMovimiento, buscarElemento, animar])

  const iniciar = useCallback((evento: React.PointerEvent, key: string) => {
    if (dragRef.current.key || dragRef.current.pendiente) return
    evento.preventDefault()
    dragRef.current.pendiente = { key, x: evento.clientX, y: evento.clientY }
  }, [])

  const manejarTeclado = useCallback(
    (evento: React.KeyboardEvent, key: string) => {
      const teclado = tecladoRef.current
      const { items: actuales, alReordenar: reordenar, alSoltar: soltarFinal } =
        estadoRef.current

      if (evento.key === ' ' || evento.key === 'Enter') {
        evento.preventDefault()
        if (teclado.key === key) {
          teclado.key = null
          teclado.original = null
          setModoTeclado(false)
          setArrastrandoKey(null)
          soltarFinal(actuales)
        } else {
          if (teclado.key) soltarFinal(actuales)
          teclado.key = key
          teclado.original = actuales
          setModoTeclado(true)
          setArrastrandoKey(key)
        }
        return
      }

      if (teclado.key !== key) return

      if (evento.key === 'Escape') {
        evento.preventDefault()
        if (teclado.original) {
          capturarParaFlip()
          reordenar(teclado.original)
        }
        teclado.key = null
        teclado.original = null
        setModoTeclado(false)
        setArrastrandoKey(null)
        return
      }

      const paso =
        evento.key === 'ArrowLeft'
          ? -1
          : evento.key === 'ArrowRight'
            ? 1
            : evento.key === 'ArrowUp'
              ? -columnas
              : evento.key === 'ArrowDown'
                ? columnas
                : 0
      if (paso === 0) return
      evento.preventDefault()

      const desde = actuales.findIndex((i) => i.key === key)
      const hasta = desde + paso
      if (desde < 0 || hasta < 0 || hasta >= actuales.length) return
      capturarParaFlip()
      reordenar(reordenarLista(actuales, desde, hasta))
    },
    [columnas, capturarParaFlip]
  )

  return {
    listaRef,
    arrastrandoKey,
    modoTeclado,
    iniciar,
    manejarTeclado,
  }
}
