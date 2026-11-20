import { describe, expect, test } from 'bun:test'
import {
  CLAVE_DESCARTE_PWA,
  DIAS_DESCARTE_PWA,
  MS_DESCARTE_PWA,
  debeMostrarAviso,
  descarteVigente,
  detectarPlataformaPwa,
  esIosSafari,
  esModoStandalone,
  expiracionDescarte,
} from './pwa-install'

const AHORA = 1_800_000_000_000
const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const IPAD_ESCRITORIO =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'

describe('esModoStandalone', () => {
  test('acepta display-mode standalone o navigator.standalone', () => {
    expect(
      esModoStandalone({ displayModeStandalone: true })
    ).toBe(true)
    expect(
      esModoStandalone({
        displayModeStandalone: false,
        navigatorStandalone: true,
      })
    ).toBe(true)
  })

  test('no confunde el navegador normal con standalone', () => {
    expect(
      esModoStandalone({
        displayModeStandalone: false,
        navigatorStandalone: false,
      })
    ).toBe(false)
    expect(
      esModoStandalone({ displayModeStandalone: false })
    ).toBe(false)
  })
})

describe('descarte de 14 días', () => {
  test('expone el nombre y la duración esperados', () => {
    expect(CLAVE_DESCARTE_PWA).toBe('fynz-pwa-dismissed-until')
    expect(DIAS_DESCARTE_PWA).toBe(14)
    expect(MS_DESCARTE_PWA).toBe(14 * 24 * 60 * 60 * 1000)
  })

  test('oculta el aviso mientras la expiración está en el futuro', () => {
    expect(
      descarteVigente(String(expiracionDescarte(AHORA)), AHORA)
    ).toBe(true)
    expect(
      descarteVigente(String(AHORA + MS_DESCARTE_PWA), AHORA)
    ).toBe(true)
  })

  test('vuelve a mostrar el aviso al expirar', () => {
    expect(
      descarteVigente(String(AHORA), AHORA)
    ).toBe(false)
    expect(
      descarteVigente(String(AHORA - 1), AHORA)
    ).toBe(false)
  })

  test('tolera ausencia, vacío y valores inválidos', () => {
    expect(descarteVigente(null, AHORA)).toBe(false)
    expect(descarteVigente('', AHORA)).toBe(false)
    expect(descarteVigente('no-es-un-numero', AHORA)).toBe(false)
  })
})

describe('detección de iOS Safari', () => {
  test('reconoce iPhone y iPadOS en modo escritorio', () => {
    expect(esIosSafari(IPHONE_SAFARI)).toBe(true)
    expect(esIosSafari(IPAD_ESCRITORIO, 5)).toBe(true)
  })

  test('excluye Chrome, Firefox, Edge y Opera en iOS', () => {
    expect(
      esIosSafari(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1'
      )
    ).toBe(false)
    expect(
      esIosSafari(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/605.1.15'
      )
    ).toBe(false)
    expect(
      esIosSafari(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/120.0 Mobile/15E148 Safari/605.1.15'
      )
    ).toBe(false)
    expect(
      esIosSafari(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) OPiOS/2.2.0 Mobile/15E148 Safari/9537.53'
      )
    ).toBe(false)
  })

  test('excluye navegadores integrados y Android', () => {
    expect(
      esIosSafari(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0'
      )
    ).toBe(false)
    expect(
      esIosSafari(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
      )
    ).toBe(false)
  })

  test('no confunde Safari de escritorio con iOS', () => {
    expect(esIosSafari(IPAD_ESCRITORIO, 0)).toBe(false)
  })
})

describe('detección de plataforma', () => {
  test('clasifica iOS Safari, Android, escritorio y otros', () => {
    expect(detectarPlataformaPwa(IPHONE_SAFARI)).toBe('ios-safari')
    expect(
      detectarPlataformaPwa(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36'
      )
    ).toBe('android')
    expect(
      detectarPlataformaPwa(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
      )
    ).toBe('escritorio')
    expect(detectarPlataformaPwa('un-navegador-desconocido')).toBe('otro')
  })
})

describe('debeMostrarAviso', () => {
  test('muestra el aviso si hay prompt disponible o es iOS Safari', () => {
    expect(
      debeMostrarAviso({
        standalone: false,
        descartado: false,
        disponible: true,
        iosSafari: false,
      })
    ).toBe(true)
    expect(
      debeMostrarAviso({
        standalone: false,
        descartado: false,
        disponible: false,
        iosSafari: true,
      })
    ).toBe(true)
  })

  test('no muestra el aviso en standalone, descartado o sin plataforma', () => {
    expect(
      debeMostrarAviso({
        standalone: true,
        descartado: false,
        disponible: true,
        iosSafari: true,
      })
    ).toBe(false)
    expect(
      debeMostrarAviso({
        standalone: false,
        descartado: true,
        disponible: true,
        iosSafari: true,
      })
    ).toBe(false)
    expect(
      debeMostrarAviso({
        standalone: false,
        descartado: false,
        disponible: false,
        iosSafari: false,
      })
    ).toBe(false)
  })
})
