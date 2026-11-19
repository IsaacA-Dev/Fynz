/**
 * Utilidades de color para validar el contraste WCAG del contrato de tokens.
 * Solo se usan en pruebas y herramientas; los componentes consumen tokens.
 */

export type Rgb = { r: number; g: number; b: number };

export function hexARgb(hex: string): Rgb {
  const limpio = hex.trim().replace(/^#/, "");

  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) {
    throw new Error(`Color hex inválido: ${hex}`);
  }

  return {
    r: Number.parseInt(limpio.slice(0, 2), 16) / 255,
    g: Number.parseInt(limpio.slice(2, 4), 16) / 255,
    b: Number.parseInt(limpio.slice(4, 6), 16) / 255,
  };
}

function canalLineal(canal: number): number {
  return canal <= 0.04045
    ? canal / 12.92
    : ((canal + 0.055) / 1.055) ** 2.4;
}

export function luminanciaRelativa(hex: string): number {
  const { r, g, b } = hexARgb(hex);
  return (
    0.2126 * canalLineal(r) +
    0.7152 * canalLineal(g) +
    0.0722 * canalLineal(b)
  );
}

export function contraste(colorA: string, colorB: string): number {
  const luzA = luminanciaRelativa(colorA);
  const luzB = luminanciaRelativa(colorB);
  const claro = Math.max(luzA, luzB);
  const oscuro = Math.min(luzA, luzB);
  return (claro + 0.05) / (oscuro + 0.05);
}

export function cumpleAA(
  colorA: string,
  colorB: string,
  minimo = 4.5
): boolean {
  return contraste(colorA, colorB) >= minimo;
}
