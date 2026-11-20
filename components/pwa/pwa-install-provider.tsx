'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  CLAVE_DESCARTE_PWA,
  debeMostrarAviso,
  descarteVigente,
  detectarPlataformaPwa,
  esModoStandalone,
  expiracionDescarte,
} from '@/lib/pwa-install'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

interface EstadoPwa {
  montado: boolean
  standalone: boolean
  iosSafari: boolean
  descartado: boolean
  instalado: boolean
  prompt: BeforeInstallPromptEvent | null
}

const ESTADO_INICIAL: EstadoPwa = {
  montado: false,
  standalone: false,
  iosSafari: false,
  descartado: false,
  instalado: false,
  prompt: null,
}

let estadoPwa = ESTADO_INICIAL
let inicializado = false
const oyentes = new Set<() => void>()

function emitir(cambios: Partial<EstadoPwa>) {
  estadoPwa = { ...estadoPwa, ...cambios }
  for (const oyente of oyentes) oyente()
}

function inicializarPwa() {
  if (inicializado || typeof window === 'undefined') return
  inicializado = true

  const media = window.matchMedia('(display-mode: standalone)')
  const navigatorPwa = window.navigator as Navigator & {
    standalone?: boolean
  }

  const actualizarStandalone = () => {
    emitir({
      standalone: esModoStandalone({
        displayModeStandalone: media.matches,
        navigatorStandalone: navigatorPwa.standalone,
      }),
    })
  }

  let descartado = false
  try {
    descartado = descarteVigente(
      window.localStorage.getItem(CLAVE_DESCARTE_PWA),
      Date.now()
    )
  } catch {
    descartado = false
  }

  emitir({
    montado: true,
    standalone: esModoStandalone({
      displayModeStandalone: media.matches,
      navigatorStandalone: navigatorPwa.standalone,
    }),
    iosSafari:
      detectarPlataformaPwa(
        navigatorPwa.userAgent,
        navigatorPwa.maxTouchPoints
      ) === 'ios-safari',
    descartado,
  })

  const alTenerPrompt = (evento: Event) => {
    evento.preventDefault()
    emitir({ prompt: evento as BeforeInstallPromptEvent })
  }

  const alInstalar = () => {
    emitir({ prompt: null, instalado: true })
  }

  window.addEventListener('beforeinstallprompt', alTenerPrompt)
  window.addEventListener('appinstalled', alInstalar)
  media.addEventListener('change', actualizarStandalone)
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  inicializarPwa()
  return () => {
    oyentes.delete(oyente)
  }
}

function obtenerEstado() {
  return estadoPwa
}

function obtenerEstadoServidor() {
  return ESTADO_INICIAL
}

interface PwaInstallContextValue {
  montado: boolean
  standalone: boolean
  iosSafari: boolean
  puedeInstalar: boolean
  mostrarAviso: boolean
  instalar: () => Promise<void>
  solicitarInstalacion: () => Promise<void>
  descartar: () => void
}

const PwaInstallContext = createContext<PwaInstallContextValue | null>(null)

export function PwaInstallProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    void navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      .catch(() => {
        // Si el navegador no permite registrar el SW, la app sigue operando.
      })
  }, [])

  const estado = useSyncExternalStore(
    suscribir,
    obtenerEstado,
    obtenerEstadoServidor
  )

  const instalar = useCallback(async () => {
    const evento = estado.prompt
    if (!evento) return

    emitir({ prompt: null })

    try {
      await evento.prompt()
      const eleccion = await evento.userChoice
      if (eleccion.outcome === 'accepted') {
        emitir({ instalado: true })
      }
    } catch {
      // El evento pudo quedar inválido si el navegador ya lo consumió.
    }
  }, [estado.prompt])

  const solicitarInstalacion = useCallback(async () => {
    if (estado.iosSafari) {
      try {
        window.localStorage.removeItem(CLAVE_DESCARTE_PWA)
      } catch {
        // Sin localStorage el aviso se muestra igual en esta sesión.
      }
      emitir({ descartado: false })
      return
    }

    await instalar()
  }, [estado.iosSafari, instalar])

  const descartar = useCallback(() => {
    try {
      window.localStorage.setItem(
        CLAVE_DESCARTE_PWA,
        String(expiracionDescarte(Date.now()))
      )
    } catch {
      // El cierre funciona en memoria aunque no se pueda persistir.
    }
    emitir({ descartado: true })
  }, [])

  const puedeInstalar =
    estado.montado &&
    !estado.standalone &&
    !estado.instalado &&
    (estado.prompt !== null || estado.iosSafari)

  const mostrarAviso =
    estado.montado &&
    !estado.instalado &&
    debeMostrarAviso({
      standalone: estado.standalone,
      descartado: estado.descartado,
      disponible: estado.prompt !== null,
      iosSafari: estado.iosSafari,
    })

  const valor = useMemo(
    () => ({
      montado: estado.montado,
      standalone: estado.standalone,
      iosSafari: estado.iosSafari,
      puedeInstalar,
      mostrarAviso,
      instalar,
      solicitarInstalacion,
      descartar,
    }),
    [
      estado.montado,
      estado.standalone,
      estado.iosSafari,
      puedeInstalar,
      mostrarAviso,
      instalar,
      solicitarInstalacion,
      descartar,
    ]
  )

  return (
    <PwaInstallContext.Provider value={valor}>
      {children}
    </PwaInstallContext.Provider>
  )
}

export function usePwaInstall() {
  const contexto = useContext(PwaInstallContext)
  if (!contexto) {
    throw new Error(
      'usePwaInstall debe usarse dentro de PwaInstallProvider'
    )
  }
  return contexto
}
