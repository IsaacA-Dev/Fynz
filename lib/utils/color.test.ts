import { describe, expect, it } from "bun:test";
import { contraste } from "./color";

const CSS = await Bun.file(
  new URL("../../app/globals.css", import.meta.url)
).text();

type Paleta = Record<string, string>;

function extraerPaleta(selector: string): Paleta {
  const inicio = CSS.indexOf(selector);
  if (inicio === -1) throw new Error(`No se encontró el selector ${selector}`);

  const abre = CSS.indexOf("{", inicio);
  const cierra = CSS.indexOf("}", abre);
  const bloque = CSS.slice(abre + 1, cierra);

  const paleta: Paleta = {};
  for (const coincidencia of bloque.matchAll(
    /--ds-([a-z0-9-]+):\s*([^;]+);/g
  )) {
    paleta[coincidencia[1]] = coincidencia[2].trim();
  }
  return paleta;
}

function par(paleta: Paleta, primer: string, segundo: string) {
  const a = paleta[primer];
  const b = paleta[segundo];
  if (!a || !b) {
    throw new Error(`Faltan tokens: ${primer} (${a}) o ${segundo} (${b})`);
  }
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) {
    throw new Error(
      `El par ${primer}/${segundo} debe usar hex para medir contraste`
    );
  }
  return { a, b };
}

const PARES_TEXTO: Array<[string, string]> = [
  ["fg", "surface"],
  ["fg", "surface-muted"],
  ["fg-muted", "surface"],
  ["fg-subtle", "surface"],
  ["brand", "surface"],
  ["on-brand", "brand"],
  ["brand", "brand-soft"],
  ["on-info", "info"],
  ["info", "surface"],
  ["info", "info-soft"],
  ["on-success", "success"],
  ["success", "surface"],
  ["success", "success-soft"],
  ["on-warning", "warning"],
  ["warning", "surface"],
  ["warning", "warning-soft"],
  ["on-danger", "danger"],
  ["danger", "surface"],
  ["danger", "danger-soft"],
];

describe("contrato de contraste devsign", () => {
  for (const [tema, selector] of [
    ["fynz", '[data-theme="fynz"]'],
    ["noche", '[data-theme="noche"]'],
  ] as const) {
    const paleta = extraerPaleta(selector);

    it(`${tema}: define los tokens obligatorios`, () => {
      const obligatorios = [
        "surface",
        "surface-raised",
        "surface-muted",
        "fg",
        "fg-muted",
        "fg-subtle",
        "line",
        "line-strong",
        "input",
        "brand",
        "brand-hover",
        "brand-soft",
        "brand-softer",
        "on-brand",
        "info",
        "info-soft",
        "on-info",
        "success",
        "success-soft",
        "on-success",
        "warning",
        "warning-soft",
        "on-warning",
        "danger",
        "danger-hover",
        "danger-soft",
        "on-danger",
        "scrim",
      ];

      for (const token of obligatorios) {
        expect(paleta[token], `${tema} · --ds-${token}`).toBeDefined();
      }
    });

    it(`${tema}: texto y pares de estado cumplen AA (4.5:1)`, () => {
      for (const [primer, segundo] of PARES_TEXTO) {
        const { a, b } = par(paleta, primer, segundo);
        const razon = contraste(a, b);
        expect(
          razon,
          `${tema} · ${primer}/${segundo} = ${razon.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
