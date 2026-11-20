export const CLAVE_DESCARTE_PWA = 'fynz-pwa-dismissed-until'
export const DIAS_DESCARTE_PWA = 14
export const MS_DESCARTE_PWA =
  DIAS_DESCARTE_PWA * 24 * 60 * 60 * 1000

export type PlataformaPwa = 'ios-safari' | 'android' | 'escritorio' | 'otro'

export function esModoStandalone({
  displayModeStandalone,
  navigatorStandalone,
}: {
  displayModeStandalone: boolean
  navigatorStandalone?: boolean | null
}): boolean {
  return displayModeStandalone || navigatorStandalone === true
}

export function expiracionDescarte(ahora: number): number {
  return ahora + MS_DESCARTE_PWA
}

export function descarteVigente(
  valor: string | null,
  ahora: number
): boolean {
  if (!valor) return false
  const hasta = Number(valor)
  return Number.isFinite(hasta) && hasta > ahora
}

/**
 * iOS Safari (incluye iPadOS en modo escritorio) excluyendo navegadores
 * basados en WebKit con shell propia y navegadores integrados.
 */
export function esIosSafari(
  userAgent: string,
  maxTouchPoints = 0
): boolean {
  const esIos =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1)

  if (!esIos) return false

  const otroNavegador =
    /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|FBAN|FBAV|Instagram|MicroMessenger|Line\//i.test(
      userAgent
    )

  if (otroNavegador) return false

  return /Safari\//.test(userAgent) && !/Chrome|Chromium|Android/i.test(userAgent)
}

export function detectarPlataformaPwa(
  userAgent: string,
  maxTouchPoints = 0
): PlataformaPwa {
  if (esIosSafari(userAgent, maxTouchPoints)) return 'ios-safari'
  if (/Android/i.test(userAgent)) return 'android'
  if (/Windows|Macintosh|Linux|CrOS/i.test(userAgent)) return 'escritorio'
  return 'otro'
}

export function debeMostrarAviso({
  standalone,
  descartado,
  disponible,
  iosSafari,
}: {
  standalone: boolean
  descartado: boolean
  disponible: boolean
  iosSafari: boolean
}): boolean {
  return !standalone && !descartado && (disponible || iosSafari)
}
