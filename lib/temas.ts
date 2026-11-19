export const TEMAS = [
  {
    id: "fynz",
    nombre: "Fynz",
    descripcion: "Claro, sereno y cálido.",
    colorScheme: "light",
  },
  {
    id: "noche",
    nombre: "Noche",
    descripcion: "Oscuro, profundo y sin reflejos.",
    colorScheme: "dark",
  },
] as const;

export type TemaId = (typeof TEMAS)[number]["id"];

export const TEMA_PREDETERMINADO: TemaId = "fynz";
export const CLAVE_TEMA = "fynz:theme";

export function esTemaId(valor: unknown): valor is TemaId {
  return TEMAS.some((tema) => tema.id === valor);
}
